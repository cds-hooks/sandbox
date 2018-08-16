/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';
import pickBy from 'lodash/pickBy';
import forIn from 'lodash/forIn';
import isEqual from 'lodash/isEqual';

import CardList from '../CardList/card-list';
import styles from './patient-view.css';
import callServices from '../../retrieve-data-helpers/service-exchange';

const propTypes = {
  /**
   * The Patient resource in context
   */
  patient: PropTypes.object,
  /**
   * The URL of the FHIR server in context
   */
  fhirServer: PropTypes.string,
  /**
   * A hash of the CDS services and their definitions
   */
  services: PropTypes.object,
  /**
   * Flag to determine if the CDS Developer Panel is displayed or not
   */
  isContextVisible: PropTypes.bool.isRequired,
};

/**
 * Left-hand side on the mock-EHR view that displays the cards and relevant UI for the patient-view hook
 */
export class PatientView extends Component {
  constructor(props) {
    super(props);
    this.executeRequests = this.executeRequests.bind(this);
  }

  // When patient view mounts, execute CDS Service requests configured for this hook
  componentDidMount() {
    this.executeRequests();
  }

  componentDidUpdate(prevProps) {
    if (this.props.patient !== prevProps.patient ||
        this.props.fhirServer !== prevProps.fhirServer ||
        this.props.user !== prevProps.user ||
        !isEqual(this.props.services, prevProps.services)) {
      this.executeRequests();
    }
  }

  executeRequests() {
    if (Object.keys(this.props.services).length) {
      // For each service, call service for request/response exchange
      forIn(this.props.services, (val, key) => {
        callServices(key);
      });
    }
  }

  render() {
    const name = this.props.patient.name || 'Missing Name';
    const dob = this.props.patient.birthDate || 'Missing DOB';
    const pid = this.props.patient.id || 'Missing Patient ID';

    const isHalfView = this.props.isContextVisible ? styles['half-view'] : '';

    return (
      <div className={cx(styles['patient-view'], isHalfView)}>
        <h1 className={styles['view-title']}>Patient View</h1>
        <h2>{name}</h2>
        <div className={styles['patient-data-text']}>
          <p><strong>ID: </strong> {pid} <strong>Birthdate: </strong> {dob}</p>
        </div>
        {Object.keys(this.props.services).length ? <CardList /> : ''}
      </div>
    );
  }
}

PatientView.propTypes = propTypes;

const mapStateToProps = (store) => {
  function isValidService(service) {
    return service.hook === 'patient-view' && service.enabled;
  }

  return {
    isContextVisible: store.hookState.isContextVisible,
    patient: store.patientState.currentPatient,
    fhirServer: store.fhirServerState.currentFhirServer,
    services: pickBy(store.cdsServicesState.configuredServices, isValidService),
    hook: store.hookState.currentHook,
    user: store.patientState.currentUser,
  };
};

export default connect(mapStateToProps)(PatientView);
