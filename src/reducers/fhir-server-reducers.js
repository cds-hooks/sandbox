import * as types from '../actions/action-types';

const initialState = {
  testFhirServer: null,
  currentFhirServer: '',
  currentMetadata: null,
  defaultFhirServer: 'https://launch.smarthealthit.org/v/r2/fhir',
  fhirVersion: '1.0.2',
  isDefaultFhirServer: true,
  accessToken: null,
};

const fhirServerReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Store FHIR server metadata accordingly in store from successful connection
      case types.GET_FHIR_SERVER_SUCCESS: {
        const newState = {
          ...state,
          currentFhirServer: action.baseUrl,
          currentMetadata: action.metadata,
          fhirVersion: action.metadata.fhirVersion,
          testFhirServer: null,
        };
        newState.isDefaultFhirServer = action.baseUrl === state.defaultFhirServer;
        return newState;
      }
      // Store SMART authorization response in store from successful SMART workflow
      case types.SMART_AUTH_SUCCESS: {
        const newState = {
          ...state,
          accessToken: action.authResponse.tokenResponse,
          currentFhirServer: action.authResponse.server.serviceUrl,
          currentMetadata: action.metadata,
          fhirVersion: action.metadata.fhirVersion,
        };
        newState.isDefaultFhirServer = newState.currentFhirServer === state.defaultFhirServer;
        return newState;
      }
      // Sets the FHIR server a user enters to change the current FHIR server, before testing it is a valid endpoint
      case types.SET_TEST_FHIR_SERVER: {
        return { ...state, testFhirServer: action.fhirServer };
      }
      default:
        return state;
    }
  }
  return state;
};

export default fhirServerReducers;
