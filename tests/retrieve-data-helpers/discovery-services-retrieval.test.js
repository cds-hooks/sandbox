import configureStore from 'redux-mock-store';
import MockAdapter from 'axios-mock-adapter';

describe('Discovery Services Retrieval', () => {
  let mockAxios;
  let axios;
  let actions;

  const defaultServicesUrl = 'http://default-discovery.com/cds-services';
  let mockStore = {};
  let retrieveServices;
  let jwtMock = 'jwt-mock';
  console.error = jest.fn();
  console.log = jest.fn();

  beforeEach(() => {
    const mockStoreWrapper = configureStore([]);
    mockStore = mockStoreWrapper({
      cdsServicesState: {
        defaultUrl: defaultServicesUrl,
      },
    });
    jest.setMock('../../src/store/store', mockStore);
    jest.setMock('../../src/retrieve-data-helpers/jwt-generator', () => jwtMock);
    axios = require('axios').default;
    mockAxios = new MockAdapter(axios);
    retrieveServices = require('../../src/retrieve-data-helpers/discovery-services-retrieval').default;
    actions = require('../../src/actions/cds-services-actions');
  });

  afterEach(() => {
    mockAxios.reset();
    mockStore.clearActions();
    jest.resetModules();
  });

  it('dispatches a DISCOVER_CDS_SERVICES action', () => {
    const spy = jest.spyOn(actions, 'signalRetrievingServices');
    mockAxios.onGet(`${defaultServicesUrl}`)
      .reply(200, { services: ['foo'] });

    return retrieveServices().then(() => {
      expect(spy).toHaveBeenCalledWith(defaultServicesUrl);
      spy.mockReset();
      spy.mockRestore();
    });
  });

  describe('When a services call to the discovery endpoint is successful', () => {
    it('resolves and dispatches an action if returned data is valid', () => {
      const spy = jest.spyOn(actions, 'signalSuccessServicesRetrieval');
      const service = {
        id: 'example-id',
        hook: 'patient-view',
      };
      mockAxios.onGet(`${defaultServicesUrl}`)
        .reply((config) => {
          expect(config.headers.Authorization).toEqual(`Bearer ${jwtMock}`);
          return [ 200, { services: [service] } ];
        });

      return retrieveServices().then(() => {
        expect(spy).toHaveBeenCalledWith([service], defaultServicesUrl);
        spy.mockReset();
        spy.mockRestore();
      });
    });

    it('rejects the Promise and does not dispatch an action for invalid returned data', () => {
      const spy = jest.spyOn(actions, 'signalSuccessServicesRetrieval');
      mockAxios.onGet(`${defaultServicesUrl}`)
        .reply(200);

      return retrieveServices().catch(() => {
        expect(spy).not.toHaveBeenCalled();
        spy.mockReset();
        spy.mockRestore();
      });
    });
  });

  describe('When a services call to the discovery endpoint is unsuccessful', () => {
    it('rejects the Promise and dispatches an action for failed discovery endpoint connection', () => {
      const spy = jest.spyOn(actions, 'signalFailureServicesRetrieval');
      mockAxios.onGet(`${defaultServicesUrl}`).reply(500);
      return retrieveServices().catch(() => {
        expect(spy).toHaveBeenCalled();
        spy.mockReset();
        spy.mockRestore();
      });
    });
  });
});
