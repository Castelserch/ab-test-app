import React from 'react';
import { AccountStorageMutation, AccountStorageQuery, BlockText, Button, ChartGroup, Grid, GridItem, HeadingText, LineChart, Modal, NerdGraphQuery, NerdGraphMutation, NrqlQuery, PlatformStateContext, PieChart, Select, SelectItem, Spinner, TableChart, TextField, navigation } from 'nr1';

const ACCOUNT_ID = 1234567  // <YOUR-ACCOUNT-ID>
const ENTITY_GUID = ""  // <YOUR-ENTITY-GUID>
const VERSION_A_DESCRIPTION = 'The newsletter signup message says, "Sign up for our newsletter"'
const VERSION_B_DESCRIPTION = 'The newsletter signup message says, "Sign up for our newsletter and get a free shirt!"'


class NewsletterSignups extends React.Component {
    openAPMEntity() {
        navigation.openStackedEntity(ENTITY_GUID)
    }

    render() {
        return <React.Fragment>
            <Grid>
                <GridItem columnSpan={10}>
                    <HeadingText className="chartHeader">
                        Newsletter subscriptions per version
                    </HeadingText>
                </GridItem>
                <GridItem columnSpan={2}>
                    <Button onClick={this.openAPMEntity}>
                        App performance
                    </Button>
                </GridItem>
            </Grid>
            <PlatformStateContext.Consumer>
                {
                    (platformState) => {
                        return (
                            <NrqlQuery
                                accountId={platformState.accountId}
                                query="SELECT count(*) FROM subscription FACET page_version SINCE 30 MINUTES AGO TIMESERIES"
                                timeRange={platformState.timeRange}
                                pollInterval={60000}
                            >
                                {
                                    ({ data }) => {
                                        return <LineChart data={data} fullWidth />;
                                    }
                                }
                            </NrqlQuery>
                        )
                    }
                }
            </PlatformStateContext.Consumer>
        </React.Fragment>
    }
}

class TotalSubscriptions extends React.Component {
    render() {
        return <React.Fragment>
            <HeadingText className="chartHeader">
                Total subscriptions per version
            </HeadingText>
            <NrqlQuery
                accountId={ACCOUNT_ID}
                query="SELECT count(*) FROM subscription FACET page_version SINCE 7 DAYS AGO"
                pollInterval={60000}
            >
                {
                    ({ data }) => {
                        return <PieChart data={data} fullWidth />
                    }
                }
            </NrqlQuery>
        </React.Fragment>
    }
}

class TotalCancellations extends React.Component {
    constructor() {
        super(...arguments);

        this.state = {
            cancellations: [],
            lastToken: null
        }
    }

    generateChartData(data) {
        const cancellationsA = data ? data.a : 0;
        c74onst cancellationsB = data ? data.b : 0;

        return [
            {
                metadata: {
                    id: 'cancellations-A',
                    name: 'Version A',
                    viz: 'main',
                    color: 'blue',
                },
                data: [
                    { y: cancellationsA },
                ],
            },
            {
                metadata: {
                    id: 'cancellations-B',
                    name: 'Version B',
                    viz: 'main',
                    color: 'green',
                },
                data: [
                    { y: cancellationsB },
                ],
            },
        ]
    }

    componentDidUpdate() {
        if (this.props.token && this.props.token != this.state.lastToken) {
            console.log(`requesting data with api token ${this.props.token}`)
            fetch("https://api.nerdsletter.net/cancellations", {headers: {"Authorization": `Bearer ${this.props.token}`}})
                .then(
                    (response) => {
                        if (response.status == 200) {
                            return response.json()
                        } else if (response.status == 401) {
                            console.error("Incorrect auth header")
                        } else {
                            console.error(response.text())
                        }
                    }
                )
                .then(
                    (data) => {
                        if (data) {
                            this.setState({ cancellations: this.generateChartData(data), lastToken: this.props.token })
                        }
                    }
                )
        }
    }
    render() {
        return <div>
            <HeadingText className="chartHeader">
                Total cancellations per version
            </HeadingText>
            <PieChart data={this.state.cancellations} fullWidth />
        </div>
    }
}

class VersionATotals extends React.Component {
    constructor() {
        super(...arguments);

        this.state = {
            tableData: {
                metadata: {
                    id: 'totals-A',
                    name: 'Version A',
                    columns: ['name', 'count'],
                },
                data: [
                    {
                        name: 'Subscriptions',
                        count: 0
                    },
                    {
                        name: 'Page views',
                        count: 0
                    },
                ],
            }
        }
    }

    componentDidMount() {
        NrqlQuery.query({
            accountId: ACCOUNT_ID,
            query: "SELECT count(*) FROM subscription WHERE page_version = 'a' SINCE 7 DAYS AGO",
            formatType: NrqlQuery.FORMAT_TYPE.RAW
        }).then(({ data }) => {
            if (data.raw) {
                let tableData = {...this.state.tableData}
                tableData.data[0].count = data.raw.results[0].count
                this.setState({tableData})
            }
        })

        NrqlQuery.query({
            accountId: ACCOUNT_ID,
            query: "SELECT count(*) FROM pageView WHERE page_version = 'a' SINCE 7 DAYS AGO",
            formatType: NrqlQuery.FORMAT_TYPE.RAW
        }).then(({ data }) => {
            if (data.raw) {
                let tableData = {...this.state.tableData}
                tableData.data[1].count = data.raw.results[0].count
                this.setState({tableData})
            }

        })
    }

    render() {
        return <React.Fragment>
            <HeadingText className="chartHeader">
                Version A - Page views vs. subscriptions
            </HeadingText>
            <TableChart data={[this.state.tableData]} fullWidth />
        </React.Fragment>
    }
}

class VersionBTotals extends React.Component {
    constructor() {
        super(...arguments);

        this.state = {
            tableData: {
                metadata: {
                    id: 'totals-B',
                    name: 'Version B',
                    columns: ['name', 'count'],
                },
                data: [
                    {
                        name: 'Subscriptions',
                        count: 0
                    },
                    {
                        name: 'Page views',
                        count: 0
                    },
                ],
            }
        }
    }

    componentDidMount() {
        NrqlQuery.query({
            accountId: ACCOUNT_ID,
            query: "SELECT count(*) FROM subscription WHERE page_version = 'b' SINCE 7 DAYS AGO",
            formatType: NrqlQuery.FORMAT_TYPE.RAW
        }).then(({ data }) => {
            if (data.raw) {
                let tableData = {...this.state.tableData}
                tableData.data[0].count = data.raw.results[0].count
                this.setState({tableData})
            }

        })

        NrqlQuery.query({
            accountId: ACCOUNT_ID,
            query: "SELECT count(*) FROM pageView WHERE page_version = 'b' SINCE 7 DAYS AGO",
            formatType: NrqlQuery.FORMAT_TYPE.RAW
        }).then(({ data }) => {
            if (data.raw) {
                let tableData = {...this.state.tableData}
                tableData.data[1].count = data.raw.results[0].count
                this.setState({tableData})
            }

        })
    }

    render() {
        return <React.Fragment>
            <HeadingText className="chartHeader">
                Version B - Page views vs. subscriptions
            </HeadingText>
            <TableChart data={[this.state.tableData]} fullWidth />
        </React.Fragment>
    }
}

class VersionAPageViews extends React.Component {
    render() {
        return <React.Fragment>
            <HeadingText className="chartHeader">
                Version A - Page views
            </HeadingText>
            <PlatformStateContext.Consumer>
                {
                    (platformState) => {
                        return <NrqlQuery
                            accountId={platformState.accountId}
                            query="SELECT count(*) FROM pageView WHERE page_version = 'a' SINCE 30 MINUTES AGO TIMESERIES"
                            timeRange={platformState.timeRange}
                            pollInterval={60000}
                        >
                            {
                                ({ data }) => {
                                    return <LineChart data={data} fullWidth />;
                                }
                            }
                        </NrqlQuery>
                    }
                }
            </PlatformStateContext.Consumer>
        </React.Fragment>
    }
}

class VersionBPageViews extends React.Component {
    render() {
        return <React.Fragment>
            <HeadingText className="chartHeader">
                Version B - Page views
            </HeadingText>
            <PlatformStateContext.Consumer>
                {
                    (platformState) => {
                        return <NrqlQuery
                            accountId={platformState.accountId}
                            query="SELECT count(*) FROM pageView WHERE page_version = 'b' SINCE 30 MINUTES AGO TIMESERIES"
                            timeRange={platformState.timeRange}
                            pollInterval={60000}
                        >
                            {
                                ({ data }) => {
                                    return <LineChart data={data} fullWidth />;
                                }
                            }
                        </NrqlQuery>
                    }
                }
            </PlatformStateContext.Consumer>
        </React.Fragment>
    }
}

class PastTests extends React.Component {
    render() {
        var historicalData = {
            metadata: {
                id: 'totals-B',
                name: 'Version B',
                columns: ['endDate', 'versionADescription', 'versionBDescription', 'winner'],
            },
            data: [],
        }

        return <React.Fragment>
            <HeadingText className="chartHeader">
                Past tests
            </HeadingText>
            <AccountStorageQuery accountId={ACCOUNT_ID} collection="past-tests">
                {({ loading, error, data }) => {
                    if (loading) {
                        return <Spinner />;
                    }
                    if (error) {
                        console.debug(error);
                        return 'There was an error fetching your data.';
                    }
                    data.forEach(
                        function (currentValue, index) {
                            this[index] = {
                                endDate: currentValue.id,
                                versionADescription: currentValue.document.versionADescription,
                                versionBDescription: currentValue.document.versionBDescription,
                                winner: currentValue.document.winner,
                            }
                        }, data
                    )
                    historicalData.data = data
                    return <TableChart data={[historicalData]} fullWidth />
                }}
            </AccountStorageQuery>
        </React.Fragment>
    }
}

class VersionSelector extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <Select onChange={this.props.selectVersion} value={this.props.selectedVersion}>
            <SelectItem value={'A'}>Version A</SelectItem>
            <SelectItem value={'B'}>Version B</SelectItem>
        </Select>
    }
}

class EndTestButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            modalHidden: true,
        }

        this.showModal = this.showModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
        this.endTest = this.endTest.bind(this);
    }

    closeModal() {
        this.setState({ modalHidden: true });
    }

    showModal() {
        this.setState({ modalHidden: false });
    }

    endTest() {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const endDate = `${mm}/${dd}/${yyyy}`
        AccountStorageMutation.mutate(
            {
                accountId: ACCOUNT_ID,
                actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
                collection: "past-tests",
                documentId: endDate,
                document: {
                    versionADescription: VERSION_A_DESCRIPTION,
                    versionBDescription: VERSION_B_DESCRIPTION,
                    winner: this.props.selectedVersion,
                }
            }
        )
        this.closeModal();
    }

    render() {
        return <React.Fragment>
            <Button type={Button.TYPE.DESTRUCTIVE} onClick={this.showModal}>End test</Button>

            <Modal hidden={this.state.modalHidden} onClose={this.closeModal}>
                <HeadingText>Are you sure?</HeadingText>
                <BlockText>
                    If you end the test, all your users will receive the version you selected:
                </BlockText>

                <BlockText spacingType={[BlockText.SPACING_TYPE.LARGE]}>
                    <b>Version {this.props.selectedVersion}</b>
                </BlockText>

                <Button onClick={this.closeModal}>No, continue test</Button>
                <Button type={Button.TYPE.DESTRUCTIVE} onClick={this.endTest}>Yes, end test</Button>
            </Modal>
        </React.Fragment>
    }
}

class EndTestSection extends React.Component {
    constructor() {
        super(...arguments);

        this.state = {
            selectedVersion: 'A',
        };

        this.selectVersion = this.selectVersion.bind(this);
    }

    selectVersion(event, value) {
        this.setState({ selectedVersion: value });
    }

    render() {
        return <Grid className="endTestSection">
            <GridItem columnSpan={12}>
                <HeadingText className="endTestHeader">
                    Pick a version to end the test:
                </HeadingText>
            </GridItem>
            <GridItem columnStart={5} columnEnd={6} className="versionSelector">
                <VersionSelector
                    selectedVersion={this.state.selectedVersion}
                    selectVersion={this.selectVersion}
                />
            </GridItem>
            <GridItem columnStart={7} columnEnd={8}>
                <EndTestButton selectedVersion={this.state.selectedVersion}>End test</EndTestButton>
            </GridItem>
        </Grid>
    }
}

class VersionDescription extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                <HeadingText className="versionHeader">
                    Version {this.props.version}
                </HeadingText>
                <BlockText className="versionText">
                    {this.props.description}
                </BlockText>
            </React.Fragment>
        )
    }
}

class ApiTokenPrompt extends React.Component {
    constructor() {
        super(...arguments);

        this.state = {
            token: null,
            tokenError: false,
        };

        this.submitToken = this.submitToken.bind(this);
        this.hideTokenError = this.hideTokenError.bind(this);
        this.changeToken = this.changeToken.bind(this);
        this.keyPress = this.keyPress.bind(this);
    }

    showTokenError() {
        this.setState({ tokenError: true });
    }

    hideTokenError() {
        this.setState({ tokenError: false });
    }

    changeToken(event) {
        this.setState({ token: event.target.value });
    }

    submitToken(event) {
        event.preventDefault();

        if (this.state.token) {
            this.props.storeToken(this.state.token)
            this.hideTokenError()
            this.props.hidePrompt()
        } else {
            this.showTokenError()
        }
    }

    keyPress(event) {
        if(event.keyCode == 13) {
            event.preventDefault();

            this.submitToken(event);
        }
    }

    render() {
        return <Modal hidden={this.props.hideTokenPrompt} onClose={this.props.hidePrompt}>
            To see cancellation data, you need to enter an API token for your backend service:
            <form>
                <TextField label="API token" onChange={this.changeToken} onKeyDown={this.keyPress} invalid={this.state.tokenError ? "Token required" : false} />
                <Button type={Button.TYPE.PRIMARY} onClick={this.submitToken}>Submit</Button>
            </form>
        </Modal>
    }
}

class ApiTokenButton extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Button onClick={this.props.showPrompt}>Update API token</Button>
        )
    }
}

export default class AbTestNerdletNerdlet extends React.Component {
    constructor() {
        super(...arguments);

        this.state = {
            hideTokenPrompt: true,
            token: null,
        }

        this.showPrompt = this.showPrompt.bind(this);
        this.hidePrompt = this.hidePrompt.bind(this);
        this.storeToken = this.storeToken.bind(this);
    }

    showPrompt() {
        this.setState({ hideTokenPrompt: false });
    }

    hidePrompt() {
        this.setState({ hideTokenPrompt: true });
    }

    componentDidMount() {
        const query = `
            query($key: String!) {
                actor {
                    nerdStorageVault {
                        secret(key: $key) {
                            value
                        }
                    }
                }
            }
        `;
        const variables = {
            key: "api_token",
        };

        NerdGraphQuery.query(
            {
                query: query,
                variables: variables,
            }
        ).then(
            ({ loading, error, data }) => {
                if (error) {
                    console.error(error);
                    this.showPrompt();
                }

                if (data && data.actor.nerdStorageVault.secret) {
                    this.setState({ token: data.actor.nerdStorageVault.secret.value })
                } else {
                    this.showPrompt();
                }
            }
        )
    }

    storeToken(newToken) {
        if (newToken != this.state.token) {
            const mutation = `
                mutation($key: String!, $token: SecureValue!) {
                    nerdStorageVaultWriteSecret(
                        scope: { actor: CURRENT_USER }
                        secret: { key: $key, value: $token }
                    ) {
                        status
                        errors {
                            message
                            type
                        }
                    }
                }
            `;
            const variables = {
                key: "api_token",
                token: newToken,
            };
            NerdGraphMutation.mutate({ mutation: mutation, variables: variables }).then(
                (data) => {
                    if (data.data.nerdStorageVaultWriteSecret.status === "SUCCESS") {
                        this.setState({token: newToken})
                    }
                }
            );
        }
    }

    render() {
        return (
            <React.Fragment>
                <ApiTokenPrompt
                    hideTokenPrompt={this.state.hideTokenPrompt}
                    hidePrompt={this.hidePrompt}
                    showPrompt={this.showPrompt}
                    storeToken={this.storeToken}
                />

                <Grid className="wrapper">
                    <GridItem columnSpan={6}><VersionDescription version="A" description={VERSION_A_DESCRIPTION} /></GridItem>
                    <GridItem columnSpan={6}><VersionDescription version="B" description={VERSION_B_DESCRIPTION} /></GridItem>
                    <GridItem columnSpan={12}><hr /></GridItem>
                    <GridItem columnSpan={12}><NewsletterSignups /></GridItem>
                    <GridItem columnSpan={6}><TotalSubscriptions /></GridItem>
                    <GridItem columnSpan={6}>
                        <TotalCancellations token={this.state.token} />
                    </GridItem>
                    <GridItem columnSpan={6}><VersionATotals /></GridItem>
                    <GridItem columnSpan={6}><VersionBTotals /></GridItem>
                    <ChartGroup>
                        <GridItem columnSpan={6}><VersionAPageViews /></GridItem>
                        <GridItem columnSpan={6}><VersionBPageViews /></GridItem>
                    </ChartGroup>
                    <GridItem columnSpan={12}><EndTestSection /></GridItem>
                    <GridItem columnSpan={12}><PastTests /></GridItem>
                    <GridItem columnSpan={12}><ApiTokenButton showPrompt={this.showPrompt} /></GridItem>
                </Grid>
            </React.Fragment>
        )
    }
}
