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
import cdsExecution from '../../middleware/cds-execution';

// TODO remove
import store from '../../store/store';

const propTypes = {
  /**
   * The Patient resource in context
   */
  patient: PropTypes.object,
  /**
   * Flag to determine if the CDS Developer Panel is displayed or not
   */
  isContextVisible: PropTypes.bool.isRequired,
};

cdsExecution.registerTriggerHandler('face-sheet/patient-view', {
  needExplicitTrigger: false,
  onSystemActions: () => { },
  onMessage: () => { },
  generateContext: state => ({ }), // no special context
});

/**
 * Left-hand side on the mock-EHR view that displays the cards and relevant UI for the patient-view hook
 */
export class PatientView extends Component {


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
        <CardList />
      </div>
    );
  }
}

PatientView.propTypes = propTypes;

const mapStateToProps = (state) => ({
    isContextVisible: state.hookState.isContextVisible,
    patient: state.patientState.currentPatient,
});

export default connect(mapStateToProps)(PatientView);
