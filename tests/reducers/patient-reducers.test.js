import reducer from '../../src/reducers/patient-reducers';
import * as types from '../../src/actions/action-types';

describe('Patient Reducers', () => {
  let state = {};

  beforeEach(() => {
    state = {
      defaultPatientId: 'smart-1288992',
      defaultUser: 'Practitioner/COREPRACTITIONER1',
      currentUser: '',
      currentPatient: {
        id: 'smart-1288992',
        name: 'Daniel X. Adams',
        birthDate: '1925-12-23',
        patientResource: {},
        conditionsResources: [],
      },
    };
  });

  it('returns the initial state without action', () => {
    expect(reducer(undefined, {})).toEqual(state);
  });

  describe('GET_PATIENT_SUCCESS', () => {
    let patient = {
      id: 'patient-example-id',
      birthDate: '2017-12-17',
      name: [
        {
          given: ['Given'],
          family: 'Family No Array',
        },
      ],
    };
    let action = {
      type: types.GET_PATIENT_SUCCESS,
      patient,
    };

    it('handles the action with family name not in an array', () => {
      const fullName = `${action.patient.name[0].given.join(' ')} ${action.patient.name[0].family}`;
      const newPatient = {
        id: action.patient.id,
        name: fullName,
        birthDate: action.patient.birthDate,
        patientResource: action.patient,
        conditionsResources: [],
      };

      const newState = Object.assign({}, state, {
        currentPatient: newPatient,
      });

      expect(reducer(state, action)).toEqual(newState);
    });

    it('handles the action with family in an array', () => {
      patient = Object.assign({}, patient, {
        name: [
          {
            given: ['Given'],
            family: ['Family', 'Array'],
          },
        ],
      });
      action = Object.assign({}, action, {
        patient,
      });

      const fullName = `${action.patient.name[0].given.join(' ')} ${action.patient.name[0].family.join(' ')}`;
      const newPatient = {
        id: action.patient.id,
        name: fullName,
        birthDate: action.patient.birthDate,
        patientResource: action.patient,
        conditionsResources: [],
      };

      const newState = Object.assign({}, state, {
        currentPatient: newPatient,
      });

      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('SMART_AUTH_SUCCESS', () => {
    it('updates the current user if a user is supplied in the SMART auth response', () => {
      const authResponseMock = {
        userId: 'Practitioner/some-user',
      };
      const metadataMock = { fhirVersion: '1.0.2' };
      const action = {
        type: types.SMART_AUTH_SUCCESS,
        authResponse: authResponseMock,
        metadata: metadataMock,
      };

      const newState = Object.assign({}, state, {
        currentUser: authResponseMock.userId,
      });

      expect(reducer(state, action)).toEqual(newState);
    });

    it('returns state if a user is not supplied in the SMART auth response', () => {
      const authResponseMock = {};
      const metadataMock = { fhirVersion: '1.0.2' };
      const action = {
        type: types.SMART_AUTH_SUCCESS,
        authResponse: authResponseMock,
        metadata: metadataMock,
      };

      expect(reducer(state, action)).toEqual(state);
    });
  });

  describe('Pass-through Actions', () => {
    it('should return state if an action should pass through this reducer without change to state', () => {
      const action = { type: 'SOME_OTHER_ACTION' };
      expect(reducer(state, action)).toEqual(state);
    });
  });
});
