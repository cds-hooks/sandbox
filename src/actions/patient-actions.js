import * as types from './action-types';

/**
 * Signals successful connection to Patient resource in context from FHIR server
 * @param patient - Patient resource returned by FHIR server
 * @returns {{type, patient: *}} - Action to dispatch
 */
export function signalSuccessPatientRetrieval(patient, conditions) {
  return {
    type: types.GET_PATIENT_SUCCESS,
    patient,
    conditions,
  };
}

/**
 * Signals failed connection to Patient resource in context from FHIR server
 * @returns {{type}} - Action to dispatch
 */
export function signalFailurePatientRetrieval() {
  return {
    type: types.GET_PATIENT_FAILURE,
  };
}
