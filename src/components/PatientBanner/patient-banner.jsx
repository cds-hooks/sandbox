import React from 'react';
import { connect } from 'react-redux';
import styles from './patient-banner.css';


function PatientBanner(props) {
  const name = props.patientName || 'Missing Name';
  const pid = props.patientId || 'Missing Patient ID';
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
