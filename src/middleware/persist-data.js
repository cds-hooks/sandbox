/* eslint no-unused-vars: 0 */

export const persistFhirServer = store => next => (action) => {
  if (action.type === 'GET_FHIR_SERVER_SUCCESS') {
    if (!store.getState().fhirServerState.accessToken) {
      localStorage.setItem('PERSISTED_fhirServer', action.baseUrl);
    }
  }
  return next(action);
};

export const persistPatient = store => next => (action) => {
  if (action.type === 'GET_PATIENT_SUCCESS') {
    localStorage.setItem('PERSISTED_patientId', action.patient.id);
  }
  return next(action);
};

export const persistHook = store => next => (action) => {
  if (action.type === 'SET_HOOK') {
    localStorage.setItem('PERSISTED_hook', action.hook);
  }
  return next(action);
};
