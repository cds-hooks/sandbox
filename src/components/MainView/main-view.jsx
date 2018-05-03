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
import RxView from '../RxView/rx-view';
import ContextView from '../ContextView/context-view';
import FhirServerEntry from '../FhirServerEntry/fhir-server-entry';
import PatientEntry from '../PatientEntry/patient-entry';
import CardDemo from '../CardDemo/card-demo';
import { setLoadingStatus } from '../../actions/ui-actions';
import { setHook } from '../../actions/hook-actions';

export class MainView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fhirServerPrompt: false,
      fhirServerPromptHold: null,
      fhirServerInitialError: '',
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
    this.props.setHook(localStorage.getItem('PERSISTED_hook') || 'patient-view');
    await smartLaunchPromise().catch(async () => {
      await retrieveFhirMetadata().catch(err => new Promise((resolve) => {
        let fhirErrorResponse = this.state.fhirServerInitialError;
        if (err && err.response && err.response.status === 401) {
          fhirErrorResponse = 'Cannot configure secured FHIR endpoints. Please use an open (unsecured) FHIR endpoint.';
        }
        this.setState({
          fhirServerPrompt: true,
          fhirServerPromptHold: resolve,
          fhirServerInitialError: fhirErrorResponse,
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
    const persistedServices = localStorage.getItem('PERSISTED_cdsServices');
    if (persistedServices) {
      const parsedServices = JSON.parse(persistedServices);
      if (parsedServices && parsedServices.length) {
        await parsedServices.forEach(async (discoveryEndpoint) => {
          await retrieveDiscoveryServices(discoveryEndpoint);
        });
      }
    }
    await retrieveDiscoveryServices().catch(() => {
      this.props.setLoadingStatus(false);
    });
    this.props.setLoadingStatus(false);
  }

  closeFhirServerPrompt() {
    this.setState({
      fhirServerPrompt: false,
      fhirServerInitialError: '',
    });
  }

  closePatientPrompt() {
    this.setState({ patientPrompt: false });
  }

  render() {
    const hookView = this.props.hook === 'patient-view' ? <PatientView /> : <RxView />;
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
          initialError={this.state.fhirServerInitialError}
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
  setHook: (hook) => {
    dispatch(setHook(hook));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(MainView);
