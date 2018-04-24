import reducer from '../../src/reducers/cds-services-reducers';
import * as types from '../../src/actions/action-types';

describe('CDS Services Reducer', () => {
  let state = {};

  beforeEach(() => {
    state = {
      configuredServices: {},
      defaultUrl: 'https://fhir-org-cds-services.appspot.com/cds-services',
      testServicesUrl: null,
    };
  });

  it('should return the initial state without action', () => {
    expect(reducer(undefined, {})).toEqual(state);
  });

  describe('DISCOVER_CDS_SERVICES', () => {
    it('should return the state if action does not qualify state change', () => {
      const action = { type: types.DISCOVER_CDS_SERVICES };
      expect(reducer(state, action)).toEqual(state);
    });

    it('should handle the DISCOVER_CDS_SERVICES action accordingly', () => {
      const action = {
        type: types.DISCOVER_CDS_SERVICES,
        testUrl: 'http://example.com',
      };

      const newState = Object.assign({}, state, { testServicesUrl: action.testUrl });
      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('DISCOVER_CDS_SERVICES_SUCCESS', () => {
    it('should return the state if action does not qualify state change', () => {
      const action = { type: types.DISCOVER_CDS_SERVICES_SUCCESS };
      expect(reducer(state, action)).toEqual(state);
    });

    it('should return the state if services do not need to be re-configured', () => {
      const exampleUrl = 'http://example.com/cds-services';
      const service = {
        enabled: true,
        id: 'example-service',
        url: `${exampleUrl}/example-service`
      };
      const existingServices = {};
      existingServices[`${service.url}`] = service;
      state = Object.assign({}, state, {
        testServicesUrl: exampleUrl,
        configuredServices: existingServices,
      });

      const action = {
        type: types.DISCOVER_CDS_SERVICES_SUCCESS,
        services: [service],
      };
      expect(reducer(state, action)).toEqual(state);
    });

    it('should handle the DISCOVER_CDS_SERVICES_SUCCESS action accordingly', () => {
      const exampleUrl = 'http://example.com/cds-services';
      state = Object.assign({}, state, { testServicesUrl: exampleUrl });
      const service = {
        enabled: true,
        id: 'example-service',
        url: `${exampleUrl}/example-service`
      };
      const action = {
        type: types.DISCOVER_CDS_SERVICES_SUCCESS,
        services: [service],
      };
      const configuredServices = {};
      configuredServices[`${service.url}`] = service;
      const newState = Object.assign({}, state, {
        configuredServices: configuredServices,
        testServicesUrl: null,
      });
      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('RESET_SERVICES', () => {
    it('removes all configured services from the app', () => {
      state.configuredServices['http://example.com'] = { enabled: true };
      const stateCopy = JSON.parse(JSON.stringify(state));
      stateCopy.configuredServices = {};
      stateCopy.testServicesUrl = '';
      const action = {
        type: types.RESET_SERVICES,
      }
      expect(reducer(state, action)).toEqual(stateCopy);
    });
  });

  describe('TOGGLE_SERVICE', () => {
    it('toggles the enabled status for a CDS Service if it exists', () => {
      const service = 'http://example.com';
      state.configuredServices[service] = { enabled: true };
      const action = {
        type: types.TOGGLE_SERVICE,
        service,
      };

      const newState = Object.assign({}, state, {
        configuredServices: {
          [service]: { enabled: false },
        },
      });
      expect(reducer(state, action)).toEqual(newState);
    });

    it('does not change state if the CDS Service does not exist', () => {
      const service = 'http://example.com';
      const action = {
        type: types.TOGGLE_SERVICE,
        service,
      };
      expect(reducer(state, action)).toEqual(state);
    });
  });

  describe('DELETE_SERVICE', () => {
    it('removes a CDS Service from app config if it exists', () => {
      const service = 'http://example.com';
      state.configuredServices[service] = { enabled: true };
      const action = {
        type: types.DELETE_SERVICE,
        service,
      };

      const newState = Object.assign({}, state, {
        configuredServices: {},
      });
      expect(reducer(state, action)).toEqual(newState);
    });

    it('does not change state if the CDS Service does not exist', () => {
      const service = 'http://example.com';
      const action = {
        type: types.DELETE_SERVICE,
        service,
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
