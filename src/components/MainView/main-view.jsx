import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'terra-overlay/lib/LoadingOverlay';
import queryString from 'query-string';

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
    this.getQueryParam = this.getQueryParam.bind(this);
  }

  /**
   * Grab the following pieces of data (w/ face-up loading spinner) before displaying the EHR-view:
   *   1. Initiate SMART App launch (if applicable)
   *   2. Retrieve FHIR server in context (from URL param, local storage, or default configured)
   *   3. Retrieve Patient in context (from URL param, local storage, or default configured)
   *   4. Retrieve CDS Services in context (from URL param, local storage, or default configured)
   *   Finally, load the application UI
   *
   *   ERROR scenarios: If any errors occur, display an input box for the user to specify FHIR server or
   *   patient in context.
   */
  async componentDidMount() {
    this.props.setLoadingStatus(true);
    const validHooks = ['patient-view', 'medication-prescribe'];
    let parsedHook = this.getQueryParam('hook');
    if (validHooks.indexOf(parsedHook) < 0) {
      parsedHook = null;
    }
    this.props.setHook(parsedHook || localStorage.getItem('PERSISTED_hook') || 'patient-view');
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
    const parsedDiscoveryEndpoints = this.getQueryParam('serviceDiscoveryURL');
    if (parsedDiscoveryEndpoints) {
      let servicesList = parsedDiscoveryEndpoints.split(',');
      if (servicesList.length) {
        // Ensure that all services have a protocol in the URL string
        servicesList = servicesList.map((url) => {
          let urlCopy = url;
          if (!/^(https?:)?\/\//i.test(url)) {
            urlCopy = `http://${url}`;
          }
          return urlCopy;
        });
        await servicesList.forEach(async (discoveryEndpoint) => {
          await retrieveDiscoveryServices(discoveryEndpoint);
        });
      }
    } else {
      const persistedServices = localStorage.getItem('PERSISTED_cdsServices');
      if (persistedServices) {
        const parsedServices = JSON.parse(persistedServices);
        if (parsedServices && parsedServices.length) {
          await parsedServices.forEach(async (discoveryEndpoint) => {
            await retrieveDiscoveryServices(discoveryEndpoint);
          });
        }
      }
    }
    await retrieveDiscoveryServices().catch(() => {
      this.props.setLoadingStatus(false);
    });
    this.props.setLoadingStatus(false);
  }

  /**
   * Get all query parameters from the current URL and return the value of the passed in param for this function
   * @param {*} param - URL parameter to get the value for
   */
  getQueryParam(param) {
    const parsedParams = queryString.parse(window.location.search);
    return parsedParams[param];
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
