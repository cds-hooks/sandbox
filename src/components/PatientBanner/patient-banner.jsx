import React from 'react';
import { connect } from 'react-redux';
import styles from './patient-banner.css';

export const defaultName = 'Missing Name';
export const defaultId = 'Missing Patient ID';

export function PatientBanner(props) {
  const name = props.patientName || defaultName;
  const pid = props.patientId || defaultId;
  return (
    <div className={styles['patient-banner-text']}>
      <p><strong>Patient: </strong> {name} <strong>ID: </strong> {pid}</p>
    </div>
  );
}

const mapStateToProps = store => ({
  patientName: store.patientState.currentPatient.name,
  patientId: store.patientState.currentPatient.id,
});

export default connect(
  mapStateToProps,
  {},
)(PatientBanner);

// Testing-only exports:
export const testingMapStateToProps = mapStateToProps;
