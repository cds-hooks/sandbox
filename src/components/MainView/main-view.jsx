import React, {Component} from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'terra-overlay/lib/LoadingOverlay';

import smartLaunchPromise from '../../retrieve-data-helpers/smart-launch';
import retrieveFhirMetadata from '../../retrieve-data-helpers/fhir-metadata-retrieval';
import retrievePatient from '../../retrieve-data-helpers/patient-retrieval';
import retrieveDiscoveryServices from '../../retrieve-data-helpers/discovery-services-retrieval';
import store from '../../store/store';

import styles from './main-view.css';
import PatientView from '../PatientView/patient-view';
import { setLoadingStatus } from '../../actions/ui-actions';

export class MainView extends Component {
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
    this.props.setLoader(true);
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
      this.props.setLoader(false);
    });
  }

  render() {
    const hookView = this.props.hook === 'patient-view' ? <PatientView /> : <div>Med Prescribe View</div>;
    const container = <div className={styles.container}>
      {hookView}
    </div>;
    return (
      <div>
        <LoadingOverlay isOpen={this.props.isLoadingData} isAnimated />
        {this.props.isLoadingData ? '' : container}
      </div>
    );
  }
}

const mapStateToProps = (store) => {
  return {
    hook: store.hookState.currentHook,
    isLoadingData: store.hookState.isLoadingData,
  }
};

const mapDispatchToProps = (dispatch) => {
  return {
    setLoader: (status) => {
      dispatch(setLoadingStatus(status));
    }
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(MainView);
