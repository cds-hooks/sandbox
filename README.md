# CDS Hooks Sandbox

The CDS Hooks Sandbox (coined here as "Sandbox") is a tool that allows users to simulate the workflow of the [CDS Hooks](http://cds-hooks.org/) standard. It acts as a sort of "mock"-EHR that can be used as a demonstration tool for showing how CDS Hooks would work with an EHR system, as well as a testing tool to try out different CDS Services to ensure compatibility with the spec. This application is built using React and Redux.

Try out the live tool at [https://sandbox.cds-hooks.org](https://sandbox.cds-hooks.org)!


## How it Works

The Sandbox can act as a demo tool to simulate CDS Hooks and visualize the workflow and standard in an EHR-like setting. Additionally, this tool can be used to test your own/other CDS Services on an EHR workflow. If the testing portion of the tool is not needed during a demo, you can collapse the right-hand side panel and focus on the EHR-like views instead. Below are the different components of this tool.

### Views

The Sandbox supports the following CDS Hooks Workflows:

- `patient-view`: On initial load, the Sandbox displays what looks like the opening of a patient's chart. A default CDS Service displays a card pertaining to the `patient-view` hook invoked on this view. On the toolbar in the header, the Patient View tab should be highlighted to indicate this default view. When navigated to this view, the Sandbox will invoke configured CDS Services listening on the `patient-view` hook.
- `medication-prescribe`: Invoked by the Rx View tab on the header, the Sandbox displays an EHR-like view of a form a care provider would use to author a medication for a specific condition. With the patient in context, you can drill down into the specific (if any) conditions the patient has. Additionally, you can choose from an extensive list of medications to prescribe, and adjust dosage instructions accordingly. Any action taken on this view once a medication is prescribed will invoke the configured CDS Services on this tool listening on the `medication-prescribe` hook.
   
### Tools

The Sandbox contains different tools to test and configure CDS Services. Below we describe each functionality and how to use it.

- **Add CDS Service**: Configures your CDS Service(s) onto the Sandbox. Your services are discovered via the input of a discovery endpoint. Note: The Sandbox may cache these services and persist them on a refresh of the page.
- **Configure CDS Services**: Edit settings on CDS Services configured, and see what each service definition looks like (the response from invoking discovery endpoints).
  - `Enabled` - Allow the Sandbox to interact with this specific CDS Service if enabled. Otherwise, ignore this service in the workflow of this tool.
  - `Delete` - Delete this specific CDS Service from the Sandbox entirely
- **Reset Configuration**: When using the Sandbox, some configuration values may be cached in `localStorage` so that users don't have to re-configure certain properties like the FHIR server, the patient in context, added CDS Services, etc. upon a refresh. Users can reset their configuration and clear their cache so that the Sandbox configures only default values.

- **CDS Developer Panel**: The right-hand panel of the screen displays the CDS Developer Panel.
  - **CDS Service Requests/Replies**:  For each CDS Service invoked (listed in the dropdown under "Select a Service"), the Sandbox will display collapsible panels that contain the specific request the Sandbox made to that CDS service, and the specific response (if any) the service returned to the Sandbox. This allows CDS Service providers testing their services to see what a request would look like to their services and what their response should look like to the EHR.
  - **SMART Web Messages**: Beneath the request/response panels, the Messages panel will display any *scratchpad.** or *ui.** [SMART Web Messages](https://github.com/smart-on-fhir/smart-web-messaging) received.
- **Card Demo**: This feature located on the toolbar header (the pencil icon) allows developers to see how a card response renders on the UI in real-time. Developers can edit the service response JSON on the right-hand side and see the card render automatically with their changes on the left-hand side. This is useful to see how links/buttons/text render on the Sandbox so their own CDS Service responses can be adjusted accordingly. Note that each EHR vendor ultimately decides how to render cards stylistically, and the card generated on this tool may not reflect similar styles with other vendors.

The tool also allows for testing against different patients and FHIR servers (see gear icon on the toolbar header).
- **Change Patient** - This feature allows users to change the patient in context of the tool by inputting the patient ID of a patient (as it relates to the FHIR server in context). Note: The Sandbox may cache this patient ID and persist this configuration on a refresh of the page.
- **Change FHIR Server** - This feature located on the toolbar header allows users to test the Sandbox against a FHIR server of their choice by inputting a FHIR server URL. Additionally, the user can reset to testing against the default FHIR server here. Currently, the Sandbox **only allows testing against an open endpoint of a FHIR server**. However, the Sandbox supports testing against secured FHIR servers from HSPC sandbox instances; see below for more details. Note: The Sandbox may cache this FHIR server and persist this configuration on a refresh of the page.

### Pre-configuration via URL parameters

While users have the option to configure properties of the Sandbox in-app like the FHIR server, the patient in context, the medication details on Rx View, etc., they also have the option to configure these values on launch via URL query parameters. The Sandbox supports the following query parameters.
  - `fhirServiceUrl` - FHIR server base URL that MUST be URL encoded (i.e. `fhirServiceUrl=https%3A%2F%2Fapi.hspconsortium.org%2Fcdshooksdstu2%2Fopen`)
  - `patientId` - The ID of the Patient in context as it relates to the associated FHIR server (i.e. `patientId=SMART-1288992`)
  - `hook` - The view/associated hook of the Sandbox (i.e. `hook=medication-prescribe`)
  - `serviceDiscoveryURL` - A comma-separated list of URL encoded CDS service discovery endpoints (i.e. `serviceDiscoveryURL=http%3A%2F%2Flocalhost%3A3000%2Fcds-services,https%3A%2F%2Ffhir-org-cds-services.appspot.com%2Fcds-services`)
  - `prescribedMedication` - Coding code of a medication from the system, `http://www.nlm.nih.gov/research/umls/rxnorm` (i.e. `prescribedMedication=731370`)
  - `prescribedInstructionNumber` - Dosage number of medication to take (i.e. `prescribedInstructionNumber=2`)
  - `prescribedInstructionFrequency` - Dosage frequency of medication to take (i.e. `prescribedInstructionFrequency=bid`). Valid values are `daily`, `bid` (bi-daily), `tid` (three times daily), `qid` (four times daily)
  - `prescribedMedicationStartDate` - Start date of the medication (i.e. `prescribedMedicationStartDate=2018-06-01`)
  - `prescribedMedicationEndDate` - End date of the medication (i.e. `prescribedMedicationEndDate=2018-09-01`)
  - `prescribedReason` - Condition coding code for the reason of the medication (i.e. `prescribedReason=1201005`)

Now, users can construct a link that has their preferred properties configured on launch instead of manually inputting them in-app, and can use the link every time to launch their configured Sandbox (does not include SMART-launched Sandbox method). See below for an example URL.

> https://sandbox.cds-hooks.org/?hook=medication-prescribe&prescribedMedication=731370&prescribedReason=1201005&prescribedInstructionNumber=2&prescribedInstructionFrequency=daily


## Testing w/ Secured FHIR Servers

Currently, launching the Sandbox by simply navigating to `https://sandbox.cds-hooks.org` means the tool can only be tested against an open FHIR server endpoint. However, the Sandbox tool can be launched as a SMART application from an [HSPC sandbox instance](https://sandbox.hspconsortium.org), and the tool can then test against a secured FHIR server endpoint. This endpoint would be the FHIR server of the HSPC sandbox instance the CDS Hooks Sandbox is launched from. By default, an app is configured on each HSPC sandbox, which allows users to launch the Sandbox as a SMART app from their own HSPC instance and test the Sandbox against a secured FHIR endpoint. Additionally, if the Sandbox is launched against a secured HSPC FHIR endpoint, it can also launch SMART apps from Card links securely as well.

To test the Sandbox against a secured FHIR server, see steps below.

1. If you have not done so before, create an [HSPC Sandbox account](https://sandbox.hspconsortium.org/#/start).
2. Click the button "Create Sandbox" and follow the prompts. Make sure to check the box "Allow Open FHIR Endpoint" and "Apply Default Data Set". 
3. On the "Apps" page, launch the "CDS Hooks Sandbox" app, and choose a patient to launch with.

The Sandbox should automatically launch in a new tab, and the configured FHIR server (secured endpoint) should be that of the HSPC Sandbox that launched it.  

Note: When launching the Sandbox in this manner, the option to change the FHIR server in context is removed from the tool. This is because the Sandbox will be passed an `access_token` when launched as a SMART application from HSPC. This token will be passed to CDS Services in requests, and used to query the FHIR server for any additional extra queries down the workflow.

## Local Development

You can develop on and run this project locally by using the following steps below. 

### Setup

If you don't already have it, install the [LTS version](https://nodejs.org/en/download/) of `Node.js` on your machine and then install the project and its dependencies locally via the steps below in your terminal/shell:
```
git clone https://github.com/cds-hooks/sandbox.git
cd sandbox
npm install
```

### Run it

To load the application on localhost, run the following command at the top-level of the project directory:
```
npm run dev
```

Now, you can navigate to `http://localhost:8080` to view the application. Any changes made to the code locally should be
picked up automatically by the `webpack-dev-server`, and you should see the changes reflect accordingly.

### Linting

This project uses [ESLint](https://eslint.org/) to do a static analysis of the code and make sure it adheres to specific style guidelines. To lint, run the following command at the top-level of the project directory:
```
npm run lint
```

Note: This command will be run on each pull request to this repository, and any added code MUST pass the linter before being merged in.

### Testing

This project uses [Jest](https://facebook.github.io/jest/) to unit test the application. This includes the actions, reducers, middleware, data retrieval funtions, and components. To test, run the following command at the top-level of the project directory:
```
npm run test
```

Note: This command will be run on each pull request to this repository, and any added code MUST pass at least the existing tests before being merged in.

## Project Flow

For more details on how this project is structured, and how to effectively make changes, [see these wiki pages](https://github.com/cds-hooks/sandbox/wiki).

## Contributing

We welcome any contributions to help further enhance this tool for the CDS Hooks community! To contribute to this project, please see instructions above for running the application locally and testing the app to make sure the tool works as expected with your incorporated changes. Follow the steps below to get started.

1. [Fork this project](https://help.github.com/articles/fork-a-repo/) to make a copy of this repository onto your own Github profile
1. Make necessary code changes onto your forked project and run the application locally to ensure expected behavior
2. Lint and test the code changes to guarantee the project is maintained moving forward 
3. Issue a pull request on the `cds-hooks/sandbox` repository with your changes for review
4. Make any changes/revisions (as necessary)
5. The project maintainers will merge the pull request in once approved
