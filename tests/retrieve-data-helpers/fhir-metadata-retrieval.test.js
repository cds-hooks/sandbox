import configureStore from 'redux-mock-store';
import MockAdapter from 'axios-mock-adapter';

describe('FHIR Metadata Retrieval', () => {
  let mockAxios;
  let axios;
  let actions;

  let mockStore = {};
  const defaultFhirServer = 'http://default-fhir-server.com';
  let expectedMetadata;
  let retrieveFhirMetadata;
  let defaultStore = {};
  console.error = jest.fn();

  beforeEach(() => {
    defaultStore = {
      fhirServerState: {
        defaultFhirServer,
      },
    };
    expectedMetadata = {
      resourceType: 'Conformance',
      rest: [
        {
          security: {
            cors: true,
          },
        },
      ],
    };
    const mockStoreWrapper = configureStore([]);
    mockStore = mockStoreWrapper(defaultStore);
    jest.setMock('../../src/store/store', mockStore);
    jest.mock('query-string');
    axios = require('axios').default;
    mockAxios = new MockAdapter(axios);
    retrieveFhirMetadata = require('../../src/retrieve-data-helpers/fhir-metadata-retrieval').default;
    actions = require('../../src/actions/fhir-server-actions');
  });

  afterEach(() => {
    mockAxios.reset();
    mockStore.clearActions();
    jest.resetModules();
  });

  describe('When a metadata GET call is successful', () => {
    it('resolves and dispatches action with default FHIR server url', () => {
      const spy = jest.spyOn(actions, 'signalSuccessFhirServerRetrieval');
      mockAxios.onGet(`${defaultFhirServer}/metadata`).reply(200, expectedMetadata);

      return retrieveFhirMetadata().then(() => {
        expect(spy).toHaveBeenCalledWith(defaultFhirServer, expectedMetadata);
        spy.mockReset();
        spy.mockRestore();
      });
    });

    it('resolves and dispatches action with passed in test URL', () => {
      const spy = jest.spyOn(actions, 'signalSuccessFhirServerRetrieval');
      const passedInUrl = 'http://test-url.com';
      mockAxios.onGet(`${passedInUrl}/metadata`).reply(200, expectedMetadata);

      return retrieveFhirMetadata(passedInUrl).then(() => {
        expect(spy).toHaveBeenCalledWith(passedInUrl, expectedMetadata);
        spy.mockReset();
        spy.mockRestore();
      });
    });

    it('rejects the Promise and does not dispatch any actions for insufficient result data', () => {
      const spy = jest.spyOn(actions, 'signalSuccessFhirServerRetrieval');
      mockAxios.onGet(`${defaultFhirServer}/metadata`).reply(200, {});

      return retrieveFhirMetadata().catch(() => {
        expect(spy).not.toHaveBeenCalled();
        spy.mockReset();
        spy.mockRestore();
      });
    });
  });

  describe('When a metadata GET call is unsuccessful', () => {
    it('rejects the Promise and dispatches a failure action', () => {
      const spy = jest.spyOn(actions, 'signalFailureFhirServerRetrieval');
      mockAxios.onGet(`${defaultFhirServer}/metadata`).reply(500);

      return retrieveFhirMetadata().catch(() => {
        expect(spy).toHaveBeenCalled();
        spy.mockReset();
        spy.mockRestore();
      });
    });
  });
});
