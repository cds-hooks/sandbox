import React from 'react';
import smartLaunchPromise from '../../retrieve-data-helpers/smart-launch';
import retrieveFhirMetadata from '../../retrieve-data-helpers/fhir-metadata-retrieval';
import retrievePatient from '../../retrieve-data-helpers/patient-retrieval';
import retrieveDiscoveryServices from '../../retrieve-data-helpers/discovery-services-retrieval';
import callServices from '../../retrieve-data-helpers/service-exchange';
import store from '../../store/store';

class MainView extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * TODO: Grab the following pieces of data (w/ face-up loading spinner) before displaying the EHR-view:
   *       1. Initiate SMART App launch (if applicable)
   *       2. Retrieve FHIR server in context (default configured)
   *       3. Retrieve Patient in context (default configured)
   *       4. Retrieve CDS Services in context (default configured)
   *       Finally, load the application UI
   *
   *       ERROR scenarios: If any errors occur, display an input box for the user to specify FHIR server or
   *       patient in context.
   */
  componentDidMount() {
    smartLaunchPromise().then(() => {
      return retrievePatient();
    }, () => {
      // TODO: Display an error banner indicating smart launch failed, and it will launch openly
      return retrieveFhirMetadata().then(() => {
        return retrievePatient();
      }, () => {
        // TODO: Manually enter a FHIR server (modal) if default FHIR server fails to load
      });
    }).then(() => {
      return retrieveDiscoveryServices();
    }, () => {
      // TODO: Manually enter a patient in context if Patient resource fails to return
    }).then(() => {
      // TODO: Set UI loader property to false

      // Below is just a test to see if service exchange works. Normally, this should go into the
      // patient view component
      const defaultPatientService = 'https://fhir-org-cds-services.appspot.com/cds-services/patient-hello-world';
      callServices(defaultPatientService);
    });
  }

  render() {
    return (
      <div>
        Insert application UI here or loading spinner
      </div>
    );
  }
}

export default MainView;
