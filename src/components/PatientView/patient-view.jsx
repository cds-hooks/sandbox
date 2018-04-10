import React, { Component } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import pickBy from 'lodash/pickBy';
import forIn from 'lodash/forIn';

import styles from './patient-view.css';
import callServices from '../../retrieve-data-helpers/service-exchange';

export class PatientView extends Component {
  constructor(props) {
    super(props);
    this.executeRequests = this.executeRequests.bind(this);
  }

  // When patient view mounts, execute CDS Service requests configured for this hook
  componentDidMount() {
    this.executeRequests();
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
      </div>
    );
  }
}

const mapStateToProps = (store) => {
  function isCorrectHook(service) {
    return service.hook === 'patient-view';
  }

  return {
    isContextVisible: store.hookState.isContextVisible,
    patient: store.patientState.currentPatient,
    services: pickBy(store.cdsServicesState.configuredServices, isCorrectHook),
  };
};

export default connect(mapStateToProps)(PatientView);
