import * as types from '../actions/action-types';

const initialState = {
  currentFhirServer: 'https://api.hspconsortium.org/cdshooksdstu2/open',
  currentMetadata: null,
  defaultFhirServer: 'https://api.hspconsortium.org/cdshooksdstu2/open',
  fhirVersion: '1.0.2',
  isDefaultFhirServer: true,
  // Used for reference when trying to validate switching to this FHIR server
  testFhirServer: '',
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
      default:
        return state;
    }
  }
  return state;
};

export default fhirServerReducers;
