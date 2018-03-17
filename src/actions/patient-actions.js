import * as types from './action-types';

/**
 * Signals successful connection to Patient resource in context from FHIR server
 * @param patient - Patient resource returned by FHIR server
 * @returns {{type, patient: *}} - Action to dispatch
 */
export function signalSuccessPatientRetrieval(patient) {
  return {
    type: types.GET_PATIENT_SUCCESS,
    patient,
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
