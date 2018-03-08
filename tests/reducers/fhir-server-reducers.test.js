import reducer from '../../src/reducers/fhir-server-reducers';
import * as types from '../../src/actions/action-types';

describe('FHIR Server Reducers', () => {
  let state = {};

  beforeEach(() => {
    state = {
      currentFhirServer: 'https://api.hspconsortium.org/cdshooksdstu2/open',
      currentMetadata: null,
      defaultFhirServer: 'https://api.hspconsortium.org/cdshooksdstu2/open',
      fhirVersion: '1.0.2',
      isDefaultFhirServer: true,
      testFhirServer: '',
      accessToken: null,
    };
  });

  it('returns the initial state without action', () => {
    expect(reducer(undefined, {})).toEqual(state);
  });

  describe('GET_FHIR_SERVER_SUCCESS', () => {
    it('should handle the GET_FHIR_SERVER_SUCCESS', () => {
      const metadata = { fhirVersion: '3.0.1' };
      const action = {
        type: types.GET_FHIR_SERVER_SUCCESS,
        baseUrl: 'http://new-base-url.com',
        metadata,
        fhirVersion: metadata.fhirVersion,
        isSecured: false,
      };

      const newState = Object.assign({}, state, {
        currentFhirServer: action.baseUrl,
        currentMetadata: action.metadata,
        fhirVersion: action.fhirVersion,
        isDefaultFhirServer: false,
      });

      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('SMART_AUTH_SUCCESS', () => {
    it('should handle the SMART_AUTH_SUCCESS action', () => {
      const authResponseMock = {
        tokenResponse: { foo: 'access-token' },
        server: { serviceUrl: 'http://example.com' }
      };
      const metadataMock = { fhirVersion: '1.0.2' };
      const action = {
        type: types.SMART_AUTH_SUCCESS,
        authResponse: authResponseMock,
        metadata: metadataMock,
      };

      const newState = Object.assign({}, state, {
        accessToken: authResponseMock.tokenResponse,
        currentFhirServer: authResponseMock.server.serviceUrl,
        currentMetadata: metadataMock,
        isDefaultFhirServer: false,
        fhirVersion: metadataMock.fhirVersion,
      });

      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('Pass-through Actions', () => {
    it('should return state if an action should pass through this reducer without change to state', () => {
      const action = { type: 'SOME_OTHER_ACTION' };
      expect(reducer(state, action)).toEqual(state);
    });
  });
});
