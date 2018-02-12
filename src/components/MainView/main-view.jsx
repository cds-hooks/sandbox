import React from 'react';
import retrieveFhirMetadata from '../../retrieve-data-helpers/fhir-metadata-retrieval';

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
    retrieveFhirMetadata().then(() => {
      // TODO: Call Patient in context method
    }, () => {
      // TODO: Manually enter a FHIR server (modal) if default FHIR server fails to load
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
