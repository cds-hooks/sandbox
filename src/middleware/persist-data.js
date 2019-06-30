/* eslint no-unused-vars: 0 */

/**
 * As an action gets dispatched to the Redux reducers, these middleware functions will intercept actions of interest before it
 * hits the reducers, and store some of the data in localStorage to cache user configuration for a better user experience within the Sandbox.
 *
 * For example, as a user decides to "Change FHIR Server", the new FHIR server URL may be cached as the user's choice for a FHIR server in localStorage,
 * once the 'GET_FHIR_SERVER_SUCCESS' action comes through (though for this case, we don't store secured FHIR servers).
 */

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
    if (action.screen) {
      localStorage.setItem('PERSISTED_screen', action.screen);
    }
  }
  return next(action);
};
