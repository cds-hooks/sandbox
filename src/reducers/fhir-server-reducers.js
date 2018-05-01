import * as types from '../actions/action-types';

const initialState = {
  testFhirServer: null,
  currentFhirServer: '',
  currentMetadata: null,
  defaultFhirServer: 'https://api.hspconsortium.org/cdshooksdstu2/open',
  fhirVersion: '1.0.2',
  isDefaultFhirServer: true,
  accessToken: null,
};

const fhirServerReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Store FHIR server metadata accordingly in store from successful connection
      case types.GET_FHIR_SERVER_SUCCESS: {
        const newState = Object.assign({}, state, {
          currentFhirServer: action.baseUrl,
          currentMetadata: action.metadata,
          fhirVersion: action.metadata.fhirVersion,
          testFhirServer: null,
        });
        newState.isDefaultFhirServer = action.baseUrl === state.defaultFhirServer;
        return newState;
      }
      case types.SMART_AUTH_SUCCESS: {
        const newState = Object.assign({}, state, {
          accessToken: action.authResponse.tokenResponse,
          currentFhirServer: action.authResponse.server.serviceUrl,
          currentMetadata: action.metadata,
          fhirVersion: action.metadata.fhirVersion,
        });
        newState.isDefaultFhirServer = newState.currentFhirServer === state.defaultFhirServer;
        return newState;
      }
      case types.SET_TEST_FHIR_SERVER: {
        return Object.assign({}, state, {
          testFhirServer: action.fhirServer,
        });
      }
      default:
        return state;
    }
  }
  return state;
};

export default fhirServerReducers;
