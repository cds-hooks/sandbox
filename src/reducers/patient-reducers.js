import * as types from '../actions/action-types';
import formatPatientName from '../utils/patient-name';

const initialState = {
  defaultPatientId: 'f2316789-30c4-4c06-9193-0ca5475bbb1b',
  defaultUser: 'Practitioner/6d705d81-8546-43b2-b336-31a282128f2d',
  currentUser: '',
  currentPatient: {
    id: 'f2316789-30c4-4c06-9193-0ca5475bbb1b',
    name: 'Casimira Nicolas',
    birthDate: '1987-03-27',
    patientResource: {},
    conditionsResources: [],
  },
};

const patientReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Store Patient resource from successful connection to patient in context from FHIR server
      case types.GET_PATIENT_SUCCESS: {
        const { patient } = action;
        const newPatient = {
          id: patient.id,
          name: formatPatientName(patient.name),
          birthDate: patient.birthDate,
          patientResource: patient,
        };

        let filteredEntries = [];
        if (action.conditions && action.conditions.total > 0) {
          const conditionCodes = [];
          filteredEntries = action.conditions.entry.filter((item) => {
            const { resource } = item;
            const hasAppropriateCode = resource && resource.code && resource.code.coding
              && resource.code.coding[0] && resource.code.coding[0].code;
            if (hasAppropriateCode) {
              const isDuplicate = conditionCodes.indexOf(resource.code.coding[0].code);
              if (isDuplicate < 0) {
                conditionCodes.push(resource.code.coding[0].code);
                return true;
              }
              return false;
            }
            return false;
          });
        }
        filteredEntries = filteredEntries.sort((a, b) => {
          if (a.resource.code.text < b.resource.code.text) { return -1; }
          if (b.resource.code.text < a.resource.code.text) { return 1; }
          return 0;
        });
        newPatient.conditionsResources = filteredEntries;
        return { ...state, currentPatient: newPatient };
      }

      // Stores the current user ID in store if specified in an access token returned to the Sandbox (on SMART launched Sandbox)
      case types.SMART_AUTH_SUCCESS: {
        const { authResponse } = action;
        if (authResponse && authResponse.userId) {
          return { ...state, currentUser: authResponse.userId };
        }
        return state;
      }

      default: {
        return state;
      }
    }
  }
  return state;
};

export default patientReducers;
