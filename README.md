# CDS Hooks Sandbox

The CDS Hooks Sandbox (coined here as "Sandbox") is a tool that allows users to simulate the workflow of the [CDS Hooks](http://cds-hooks.org/) standard. It acts as a sort of "mock"-EHR that can be used as a demonstration tool for showing how CDS Hooks would work with an EHR system, as well as a testing tool to try out different CDS Services to ensure compatibility with the spec.

Try out the live tool at [http://sandbox.cds-hooks.org](http://sandbox.cds-hooks.org)!


## How it Works

The Sandbox can act as a demo tool to simulate CDS Hooks and visualize the workflow and standard in an EHR-like setting. Additionally, this tool can be used to test your own/other CDS Services on an EHR workflow. If the testing portion of the tool is not needed during a demo, you can collapse the right-hand side panel and focus on the EHR-like views instead. Below are the different components of this tool.

### Views

The Sandbox supports the following CDS Hooks Workflows:

- `patient-view`: On initial load, the Sandbox displays what looks like the opening of a patient's chart. A default CDS Service displays a card pertaining to the `patient-view` hook invoked on this view. On the toolbar in the header, the Patient View tab should be highlighted to indicate this default view. When navigated to this view, the Sandbox will invoke configured CDS Services listening on the `patient-view` hook.
- `medication-prescribe`: Invoked by the Rx View tab on the header, the Sandbox displays an EHR-like view of a form a care provider would use to author a medication for a specific condition. With the patient in context, you can drill down into the specific (if any) conditions the patient has. Additionally, you can choose from an extensive list of medications to prescribe, and adjust dosage instructions accordingly. Any action taken on this view will invoke the configured CDS Services on this tool listening on the `medication-prescribe` hook.
   
   
### Tools

The Sandbox contains different tools to test and configure CDS Services. Below we describe each functionality and how to use it.

- **Add CDS Service**: Configures your CDS Service(s) onto the Sandbox. Your services are discovered via the input of a discovery endpoint.
- **Reset Configuration**: Resets the Sandbox to the original default configuration, which removes any added CDS Services and resets edited settings on the services.
- **Configure CDS Services**: Edit settings on CDS Services configured (or add CDS Services here), and see what each service definition looks like (the response from invoking discovery endpoints).
  - `Enabled` - Allow the Sandbox to interact with this specific CDS Service if enabled. Otherwise, ignore this service in the workflow of this tool.
  - `Delete` - Delete this specific CDS Service from the Sandbox entirely
  - `Save` - Save any edited services or added services for the Sandbox

- **CDS Service Exchange**: The right-hand panel of the screen displays the CDS Service context, or the CDS Service Exchange. For each CDS Service invoked (listed in the dropdown under "Select a Service"), the Sandbox will display collapsible panels that contain the specific request the Sandbox made to that CDS service, and the specific response (if any) the service returned to the Sandbox. This allows CDS Service providers testing their services to see what a request would look like to their services and what their response should look like to the EHR. This context information is also automatically logged on the developer console of the browser.
- **Card Demo**: This feature located on the toolbar header allows developers to see how a card response renders on the UI in real-time. Developers can edit the service response JSON on the right-hand side and see the card render automatically with their changes on the left-hand side. This is useful to see how links/buttons/text render on the Sandbox so their own CDS Service responses can be adjusted accordingly. Note that each EHR vendor ultimately decides how to render cards stylistically, and the card generated on this tool may not reflect similar styles with other vendors.

The tool also allows for testing against different patients and FHIR servers.
- **Change Patient** - This feature located on the toolbar header allows users to change the patient in context of the tool by inputting the patient ID of a patient (as it relates to the FHIR server in context). If the default FHIR server is enabled, a list of different patients will be available to choose from.
- **Change FHIR Server** - This feature located on the toolbar header allows users to test the Sandbox against a FHIR server of their choice by inputting a FHIR server URL. Additionally, the user can reset to testing against the default FHIR server here. Currently, the Sandbox only allows testing against an open endpoint of a FHIR server. However, the Sandbox supports testing against secured FHIR servers from HSPC sandbox instances; see below for more details.

## Testing w/ Secured FHIR Servers

Currently, launching the Sandbox by simply navigating to `http://sandbox.cds-hooks.org` means the tool can only be tested against an open FHIR server endpoint. However, the Sandbox tool can be launched as a SMART application from an [HSPC sandbox instance](https://sandbox.hspconsortium.org), and the tool can then test against a secured FHIR server endpoint. This endpoint would be the FHIR server of the HSPC sandbox instance the CDS Hooks Sandbox is launched from. By default, an app is configured on each HSPC sandbox, CDS Hooks Sandbox, which allows users to launch the Sandbox as a SMART app from their own HSPC instance and test the Sandbox against a secured FHIR endpoint.

Note: When launching the Sandbox in this manner, the option to change the FHIR server in context is removed from the tool. This is because the Sandbox will be passed an `access_token` when launched as a SMART application from HSPC. This token will be passed to CDS Services in requests, and used to query the FHIR server for any additional extra queries down the workflow.

## Local development

You can develop on and run this project locally by using the following steps below. There are two means of developing: with and without Docker.

### Development without Docker (recommended)

#### Setup

Install `nodejs` 6.11+ and `npm` 5.0+ on your machine and then install the project and its dependencies locally:
```
git clone https://github.com/cds-hooks/sandbox.git
cd sandbox
npm install
```

#### Run it

To load the webpage, run the following command:
```
npm run dev-frontend
```

To run the mock CDS services that accompany this tool, run the following command:
```
npm run dev-services
```

Now, you can navigate to `http://localhost:8080` to view the application. Any changes made to the code locally should be
picked up automatically by the `webpack-dev-server`, and you should see the changes reflect accordingly.

### Development with Docker

1. Install latest (1.9+) `docker-engine` (see
https://docs.docker.com/engine/installation/ubuntulinux/)

2. Install latest (1.5.2+) `docker-compose` (see
https://docs.docker.com/compose/install/)

For me, on Ubuntu 15.10, this meant running:

```
echo "deb https://apt.dockerproject.org/repo ubuntu-wily main" |  sudo tee --append /etc/apt/sources.list.d/docker.list
sudo apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
sudo apt-get update
sudo apt-get install docker-engine pip
sudo pip install docker-compose
```

#### Local dev environment w/ Docker

```
git clone https://github.com/cds-hooks/sandbox.git
cd sandbox
sudo docker-compose -f docker-compose-dev.yml  up
```

From here, once the server builds and comes online you can edit files in `src`
and see changes automatically reloaded at `http://localhost:8080`

Configuration:

 * To talk to a FHIR server other than `https://sb-fhir-dstu2.smarthealthit.org/api/smartdstu2/open`,
   you can pass a query variable to the HTML page, as in
   `http://localhost:8080?fhirServiceUrl=http://my-fhir-server`

Bring up the whole stack including API server, assuming you're on a host called `morel`:

```
CDS_HOOKS_URL="http://morel:9001" \
FHIR_URL="http://morel:9002/data" \
docker-compose -f docker-compose-dev.yml up
```

## Build and Contribution

We welcome any contributions to help further enhance this tool for the CDS Hooks community! To contribute to this project, please see instructions above for running the application locally and testing the app to make sure the tool works as expected with your incorporated changes. Then follow the steps below.

1. At the root level of the project, run `npm run build` to bundle the application code. Please ensure no errors occur during this step.
2. Issue a pull request on the `cds-hooks/Sandbox` repository with your changes for review. 
