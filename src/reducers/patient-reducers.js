import * as types from '../actions/action-types';

const initialState = {
  defaultPatientId: 'SMART-1288992',
  defaultUserId: 'Practitioner/COREPRACTITIONER1',
  currentPatient: {
    id: 'SMART-1288992',
    name: 'Daniel X. Adams',
    birthDate: '1925-12-23',
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
        const familyName = (Array.isArray(patient.name[0].family)) ? patient.name[0].family.join(' ') : patient.name[0].family;
        const fullName = `${patient.name[0].given.join(' ')} ${familyName}`;
        const newPatient = {
          id: patient.id,
          name: fullName,
          birthDate: patient.birthDate,
          patientResource: patient,
          conditionsResources: [],
        };
        return Object.assign({}, state, { currentPatient: newPatient });
      }
      default: {
        return state;
      }
    }
  }
  return state;
};

export default patientReducers;
