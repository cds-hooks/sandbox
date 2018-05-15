import configureStore from 'redux-mock-store';
import * as types from '../../src/actions/action-types';

describe('CDS Services Reducer', () => {
  let state = {};
  let persistedService = 'http://stored-service.com/cds-services';
  let reducer;
  let mockStore;
  let storeState;
  let mockStoreWrapper = configureStore([]);

  function setup(store) {
    mockStore = mockStoreWrapper(store);
    jest.setMock('../../src/store/store', mockStore);
    reducer = require('../../src/reducers/cds-services-reducers').default;
  }

  beforeEach(() => {
    storeState = {
      fhirServerState: {
        accessToken: null,
      },
    };
    state = {
      configuredServices: {},
      configuredServiceUrls: [],
      defaultUrl: 'https://fhir-org-cds-services.appspot.com/cds-services',
      testServicesUrl: null,
    };
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should return the initial state without action', () => {
    setup(storeState);
    expect(reducer(undefined, {})).toEqual(Object.assign({}, state, { configuredServiceUrls: [] }));
  });

  describe('DISCOVER_CDS_SERVICES', () => {
    beforeEach(() => {
      setup(storeState);
    });

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
    beforeEach(() => {
      localStorage.setItem('PERSISTED_cdsServices', JSON.stringify([persistedService]));
      state.configuredServiceUrls = [persistedService];
    });

    it('should return the state if action does not qualify state change', () => {
      setup(storeState);
      const action = { type: types.DISCOVER_CDS_SERVICES_SUCCESS };
      expect(reducer(state, action)).toEqual(state);
    });

    it('should return the state if services do not need to be re-configured', () => {
      setup(storeState);
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
        discoveryUrl: exampleUrl,
      };
      expect(reducer(state, action)).toEqual(state);
    });

    it('should handle the DISCOVER_CDS_SERVICES_SUCCESS action accordingly', () => {
      setup(storeState);
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
        discoveryUrl: exampleUrl,
      };
      const configuredServices = {};
      configuredServices[`${service.url}`] = service;
      const newState = Object.assign({}, state, {
        configuredServices: configuredServices,
        configuredServiceUrls: [persistedService, exampleUrl],
        testServicesUrl: null,
      });
      expect(reducer(state, action)).toEqual(newState);
      expect(localStorage.getItem('PERSISTED_cdsServices')).toEqual(JSON.stringify([persistedService, exampleUrl]));
    });

    it('should persist successful service connections if the app has an access_token and no serviceDiscoveryURL token property', () => {
      storeState.fhirServerState.accessToken = {
        access_token: 'foo-bar',
      };
      setup(storeState);
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
        discoveryUrl: exampleUrl,
      };
      const configuredServices = {};
      configuredServices[`${service.url}`] = service;
      const newState = Object.assign({}, state, {
        configuredServices: configuredServices,
        configuredServiceUrls: [persistedService, exampleUrl],
        testServicesUrl: null,
      });
      expect(reducer(state, action)).toEqual(newState);
      expect(localStorage.getItem('PERSISTED_cdsServices')).toEqual(JSON.stringify([persistedService, exampleUrl]));
    });

    it('should not persist successful service connections from services from the accessToken serviceDiscoveryURL property', () => {
      const exampleUrl = 'http://example.com/cds-services';
      storeState.fhirServerState.accessToken = {
        serviceDiscoveryURL: exampleUrl,
      };
      setup(storeState);
      state = Object.assign({}, state, { testServicesUrl: exampleUrl });
      const service = {
        enabled: true,
        id: 'example-service',
        url: `${exampleUrl}/example-service`
      };
      const action = {
        type: types.DISCOVER_CDS_SERVICES_SUCCESS,
        services: [service],
        discoveryUrl: exampleUrl,
      };
      const configuredServices = {};
      configuredServices[`${service.url}`] = service;
      const newState = Object.assign({}, state, {
        configuredServices: configuredServices,
        configuredServiceUrls: [persistedService],
        testServicesUrl: null,
      });
      expect(reducer(state, action)).toEqual(newState);
      expect(localStorage.getItem('PERSISTED_cdsServices')).toEqual(JSON.stringify([persistedService]));
    });
  });

  describe('RESET_SERVICES', () => {
    beforeEach(() => {
      setup(storeState);
    });

    it('removes all configured services from the app', () => {
      state.configuredServices['http://example.com'] = { enabled: true };
      const stateCopy = JSON.parse(JSON.stringify(state));
      stateCopy.configuredServices = {};
      stateCopy.configuredServiceUrls = [];
      stateCopy.testServicesUrl = '';
      const action = {
        type: types.RESET_SERVICES,
      }
      expect(reducer(state, action)).toEqual(stateCopy);
    });
  });

  describe('TOGGLE_SERVICE', () => {
    beforeEach(() => {
      setup(storeState);
    });

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
    beforeEach(() => {
      setup(storeState);
    });

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
    beforeEach(() => {
      setup(storeState);
    });

    it('should return state if an action should pass through this reducer without change to state', () => {
      const action = { type: 'SOME_OTHER_ACTION' };
      expect(reducer(state, action)).toEqual(state);
    });
  });
});
