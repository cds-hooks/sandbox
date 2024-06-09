import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
import RxSign from '../RxSign/rx-sign';
import Pama from '../Pama/pama';
import ContextView from '../ContextView/context-view';
import FhirServerEntry from '../FhirServerEntry/fhir-server-entry';
import PatientEntry from '../PatientEntry/patient-entry';
import CardDemo from '../CardDemo/card-demo';
import { setLoadingStatus } from '../../actions/ui-actions';
import { setHook } from '../../actions/hook-actions';

const propTypes = {
  /**
   * The name of the screen in context
   */
  screen: PropTypes.string.isRequired,
  /**
   * Flag to determine if the view is the Card Demo view or mock-EHR view
   */
  isCardDemoView: PropTypes.bool.isRequired,
  /**
   * Flag to determine if startup data retrieval is being taken place (i.e. getting the FHIR server, the patient in context, etc)
   * and uses this flag to determine if a loading spinner should display while waiting for network calls to complete
   */
  isLoadingData: PropTypes.bool.isRequired,
  /**
   * Function to call when switching a hook view
   */
  setHook: PropTypes.func.isRequired,
  /**
   * Function to call when setting the isLoadingData store property, which determines displaying a loading spinner or not
   */
  setLoadingStatus: PropTypes.func.isRequired,
};

/**
 * Entry point, or top parent component of the application that encompasses all child components (Header, hook views, context view, etc).
 * When the application loads, this component is responsible mainly for loading the appropriate data into the store, via network calls
 * to grab a FHIR server, patient in context, etc. It is also responsible for ensuring the necessary data the application needs before
 * displaying the UI. This means that it may prompt the user to enter a FHIR server if the default FHIR server is down, and same with
 * the patient ID. Once the appropriate data is loaded and stored, this component renders the appropriate hook component (PatientView or RxView)
 * where in those components, calls to CDS services may be made.
 */
export class MainView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /**
       * Flag to determine if the Sandbox needs to prompt the user for a FHIR server before loading the rest
       * of the application
       */
      fhirServerPrompt: false,
      /**
       * Property to store a potential "resolve" method of a Promise. If the user must input a FHIR server
       * on startup, the application here will wait for execution of the rest of the data calls by passing in
       * a resolve method of a Promise, where the FhirServerEntry component can use to resolve data only once
       * a valid FHIR server can be configured. Without passing the resolve method to the FhirServerEntry component,
       * calls to grab the patient from a faulty FHIR server will execute, which we don't want. We want this action
       * to be sequential.
       */
      fhirServerPromptHold: null,
      /**
       * Error message when trying to connect to a FHIR server. This displays on the Change FHIR Server modal.
       */
      fhirServerInitialError: '',
      /**
       * Flag to determine if the Sandbox needs to prompt the user for a patient ID before loading the rest
       * of the application
       */
      patientPrompt: false,
      /**
       * Property to store a potential "resolve" method of a Promise. If the user must input a patient ID
       * on startup, the application here will wait for execution of the rest of the data calls by passing in
       * a resolve method of a Promise, where the PatientEntry component can use to resolve data only once
       * a valid patient ID can be configured. Without passing the resolve method to the PatientEntry component,
       * execution of the application will continue, which we don't want, because we need a valid patient in context
       * for proper CDS Hooks workflow.
       */
      patientPromptHold: null,
    };

    this.closeFhirServerPrompt = this.closeFhirServerPrompt.bind(this);
    this.closePatientPrompt = this.closePatientPrompt.bind(this);
    this.getQueryParam = this.getQueryParam.bind(this);
  }

  /**
   * Grab the following pieces of data (w/ face-up loading spinner) before displaying the EHR-view:
   *   1. Initiate SMART App launch (if applicable, so the user may use a secured FHIR server)
   *   2. Retrieve FHIR server in context (from URL param, local storage, or default configured)
   *   3. Retrieve Patient in context (from URL param, local storage, or default configured)
   *   4. Retrieve CDS Services in context (from URL param, local storage, or default configured)
   *   Finally, load the application UI
   *
   *   ERROR scenarios: If any errors occur, display an input box for the user to specify FHIR server or
   *   patient in context via a modal.
   */
  async componentDidMount() {
    // Set the loading spinner face-up
    this.props.setLoadingStatus(true);
    const validHooks = ['patient-view', 'order-select', 'order-sign'];
    let parsedHook = this.getQueryParam('hook');
    const parsedScreen = this.getQueryParam('screen');
    if (validHooks.indexOf(parsedHook) < 0) {
      parsedHook = null;
    }
    // Set the hook in context
    this.props.setHook(
      parsedHook || localStorage.getItem('PERSISTED_hook') || 'patient-view',
      parsedScreen || localStorage.getItem('PERSISTED_screen') || 'patient-view',
    );

    // Execute the SMART app launch sequence to grab a FHIR access token and SMART context (if applicable)
    await smartLaunchPromise().catch(async () => {
      // SMART app launch not needed: Grab the default FHIR server
      await retrieveFhirMetadata().catch((err) => new Promise((resolve) => {
        let fhirErrorResponse = this.state.fhirServerInitialError;
        if (err && err.response && err.response.status === 401) {
          fhirErrorResponse = 'Cannot configure secured FHIR endpoints. Please use an open (unsecured) FHIR endpoint.';
        }
        // Open a Change FHIR Server modal for manual input if default FHIR server fails
        this.setState({
          fhirServerPrompt: true,
          fhirServerPromptHold: resolve,
          fhirServerInitialError: fhirErrorResponse,
        });
      }));
    });
    if (this.state.fhirServerPrompt) {
      this.setState({ fhirServerPrompt: false });
    }

    // Retrieve the patient in context
    await retrievePatient().catch(() => new Promise((resolve) => {
      // Open a Change Patient modal for manual input if default patient ID fails against configured FHIR server
      this.setState({
        patientPrompt: true,
        patientPromptHold: resolve,
      });
    }));
    if (this.state.patientPrompt) {
      this.setState({ patientPrompt: false });
    }
    // Grab any potential CDS services from the URL at the query param: serviceDiscoveryURL
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
      // Grab any cached CDS services from localStorage to load
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

    // Remove the loading indicator from the UI and display rendered components
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
    const hookView = {
      'patient-view': <PatientView />,
      'rx-view': <RxView />,
      'rx-sign': <RxSign />,
      pama: <Pama />,
    }[this.props.screen];

    const container = !this.props.isCardDemoView ? (
      <div className={styles.container}>
        {hookView}
        <ContextView />
      </div>
    ) : (
      <div className={styles.container}>
        <CardDemo />
      </div>
    );

    return (
      <div>
        <LoadingOverlay isOpen={this.props.isLoadingData} isAnimated />
        {this.state.fhirServerPrompt ? (
          <FhirServerEntry
            isOpen={this.state.fhirServerPrompt}
            isEntryRequired
            closePrompt={this.closeFhirServerPrompt}
            resolve={this.state.fhirServerPromptHold}
            initialError={this.state.fhirServerInitialError}
          />
        ) : null}
        {this.state.patientPrompt ? (
          <PatientEntry
            isOpen={this.state.patientPrompt}
            isEntryRequired
            closePrompt={this.closePatientPrompt}
            resolve={this.state.patientPromptHold}
          />
        ) : null}
        <div className={styles.pin}>
          <Header />
        </div>
        {this.props.isLoadingData ? '' : container}
      </div>
    );
  }
}

MainView.propTypes = propTypes;

const mapStateToProps = (store) => ({
  screen: store.hookState.currentScreen,
  isLoadingData: store.hookState.isLoadingData,
  isCardDemoView: store.cardDemoState.isCardDemoView,
});

const mapDispatchToProps = (dispatch) => ({
  setLoadingStatus: (status) => {
    dispatch(setLoadingStatus(status));
  },
  setHook: (...args) => {
    dispatch(setHook(...args));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MainView);
