import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'terra-overlay/lib/LoadingOverlay';

import smartLaunchPromise from '../../retrieve-data-helpers/smart-launch';
import retrieveFhirMetadata from '../../retrieve-data-helpers/fhir-metadata-retrieval';
import retrievePatient from '../../retrieve-data-helpers/patient-retrieval';
import retrieveDiscoveryServices from '../../retrieve-data-helpers/discovery-services-retrieval';

import styles from './main-view.css';
import Header from '../Header/header';
import PatientView from '../PatientView/patient-view';
import ContextView from '../ContextView/context-view';
import FhirServerEntry from '../FhirServerEntry/fhir-server-entry';
import PatientEntry from '../PatientEntry/patient-entry';
import CardDemo from '../CardDemo/card-demo';
import { setLoadingStatus } from '../../actions/ui-actions';

export class MainView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fhirServerPrompt: false,
      fhirServerPromptHold: null,
      patientPrompt: false,
      patientPromptHold: null,
    };

    this.closeFhirServerPrompt = this.closeFhirServerPrompt.bind(this);
    this.closePatientPrompt = this.closePatientPrompt.bind(this);
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
  async componentDidMount() {
    this.props.setLoadingStatus(true);
    await smartLaunchPromise().catch(async () => {
      await retrieveFhirMetadata().catch(() => new Promise((resolve) => {
        this.setState({
          fhirServerPrompt: true,
          fhirServerPromptHold: resolve,
        });
      }));
    });
    if (this.state.fhirServerPrompt) { this.setState({ fhirServerPrompt: false }); }
    await retrievePatient().catch(() => new Promise((resolve) => {
      this.setState({
        patientPrompt: true,
        patientPromptHold: resolve,
      });
    }));
    if (this.state.patientPrompt) { this.setState({ patientPrompt: false }); }
    await retrieveDiscoveryServices().catch(() => {
      this.props.setLoadingStatus(false);
    });
    this.props.setLoadingStatus(false);
  }

  closeFhirServerPrompt() {
    this.setState({ fhirServerPrompt: false });
  }

  closePatientPrompt() {
    this.setState({ patientPrompt: false });
  }

  render() {
    const hookView = this.props.hook === 'patient-view' ? <PatientView /> : 'Med Prescribe View';
    const container = !this.props.isCardDemoView ? (
      <div className={styles.container}>
        {hookView}
        <ContextView />
      </div>
    ) : <div className={styles.container}><CardDemo /></div>;

    return (
      <div>
        <LoadingOverlay isOpen={this.props.isLoadingData} isAnimated />
        {this.state.fhirServerPrompt ? <FhirServerEntry
          isOpen={this.state.fhirServerPrompt}
          isEntryRequired
          closePrompt={this.closeFhirServerPrompt}
          resolve={this.state.fhirServerPromptHold}
        /> : null}
        {this.state.patientPrompt ? <PatientEntry
          isOpen={this.state.patientPrompt}
          isEntryRequired
          closePrompt={this.closePatientPrompt}
          resolve={this.state.patientPromptHold}
        /> : null}
        <div className={styles.pin}><Header /></div>
        {this.props.isLoadingData ? '' : container}
      </div>
    );
  }
}

const mapStateToProps = store => ({
  hook: store.hookState.currentHook,
  isLoadingData: store.hookState.isLoadingData,
  isCardDemoView: store.cardDemoState.isCardDemoView,
});

const mapDispatchToProps = dispatch => ({
  setLoadingStatus: (status) => {
    dispatch(setLoadingStatus(status));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MainView);
