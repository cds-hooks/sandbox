import configureStore from 'redux-mock-store';
import MockAdapter from 'axios-mock-adapter';

describe('Service Exchange', () => {
  console.error = jest.fn();
  console.log = jest.fn();

  let mockAxios;
  let axios;
  let actions;

  let mockStore = {};
  let defaultStore = {};
  let callServices;

  let mockPatient;
  let mockFhirServer;
  let mockServiceWithPrefetch;
  let mockServiceWithPrefetchEncoded;
  let mockServiceNoEncoding;
  let mockServiceWithoutPrefetch;
  let mockHookInstance;
  let mockRequest;

  let noDataMessage = 'No response returned. Check developer tools for more details.';
  let failedServiceCallMessage = 'Could not get a response from the CDS Service. See developer tools for more details';

  let prefetchedData = { test: 'prefetch' };
  const mockServiceResult = { test: 'result' };
  const jwtMock = 'jwt-mock';

  function setMocksAndTestFunction(testStore) {
    const mockStoreWrapper = configureStore([]);
    mockStore = mockStoreWrapper(testStore);
    jest.setMock('../../src/store/store', mockStore);
    jest.dontMock('query-string');
    axios = require('axios').default;
    mockAxios = new MockAdapter(axios);
    jest.mock('uuid/v4', () => { return jest.fn(() => { return mockHookInstance })});
    actions = require('../../src/actions/service-exchange-actions');
    jest.setMock('../../src/retrieve-data-helpers/jwt-generator', () => jwtMock);
    callServices = require('../../src/retrieve-data-helpers/service-exchange').default;
  }

  beforeEach(() => {
    mockPatient = 'patient-1';
    mockFhirServer = 'http://fhir-server.com';
    mockServiceWithPrefetch = 'http://example.com/cds-services/id-1';
    mockServiceWithoutPrefetch = 'http://example.com/cds-services/id-2';
    mockServiceNoEncoding = 'http://example.com/cds-services/id-3';
    mockServiceWithPrefetchEncoded = 'http://example.com/cds-services/id-4';
    mockHookInstance = '123';
    mockRequest = {
      hookInstance: mockHookInstance,
      hook: 'patient-view',
      fhirServer: mockFhirServer,
      user: 'Practitioner/example',
      patient: mockPatient,
      context: { patientId: mockPatient }
    };

    defaultStore = {
      hookState: 'patient-view',
      patientState: {
        defaultUserId: 'Practitioner/example',
        currentPatient: {
          id: mockPatient
        }
      },
      fhirServerState: {
        currentFhirServer: mockFhirServer
      },
      cdsServicesState: {
        configuredServices: {
          [`${mockServiceWithPrefetch}`]: {
            prefetch: {
              test: 'Observation?patient={{Patient.id}}&code=http://loinc.org|2857-1'
            }
          },
          [`${mockServiceWithPrefetchEncoded}`]: {
            prefetch: {
              first: 'Conditions?patient={{Patient.id}}',
              test: `Observation?patient={{Patient.id}}&code=${encodeURIComponent('http://loinc.org|2857-1')}`,
              second: 'Patient/{{Patient.id}}'
            }
          },
          [`${mockServiceNoEncoding}`]: {
            prefetch: {
              test: 'Patient/{{Patient.id}}'
            }
          },
          [`${mockServiceWithoutPrefetch}`]: {}
        }
      }
    }
  });

  afterEach(() => {
    mockAxios.reset();
    mockStore.clearActions();
    jest.resetModules();
  });

  describe('When prefetch is needed by a service', () => {
    let spy;
    beforeEach(() => {
      setMocksAndTestFunction(defaultStore);
      spy = jest.spyOn(actions, 'storeExchange');
    });
    describe('and the prefetch call is successful with data', () => {
      beforeEach(() => {
        mockRequest.prefetch = {test: {resource: prefetchedData, response: {status: 200}}};
      });

      it('resolves and dispatches a successful CDS Service call when prefetch is retrieved', () => {
        defaultStore.fhirServerState.accessToken = { access_token: 'mock-access-token' };
        mockAxios.onGet(`${mockFhirServer}/Observation?code=${encodeURIComponent('http://loinc.org|2857-1')}&patient=${mockPatient}`)
          .reply((config) => {
            expect(config.headers['Authorization']).toEqual('Bearer mock-access-token');
            return [200, prefetchedData];
          })
          .onPost(mockServiceWithPrefetch).reply(200, mockServiceResult);
        return callServices(mockServiceWithPrefetch).then(() => {
          expect(spy).toHaveBeenCalledWith(mockServiceWithPrefetch, mockRequest, mockServiceResult);
        });
      });

      it('resolves and dispatches an appropriate message when no data comes back from services', () => {
        mockAxios.onGet(`${mockFhirServer}/Patient/${mockPatient}`)
          .reply(200, prefetchedData)
          .onPost(mockServiceNoEncoding).reply(200, {});
        return callServices(mockServiceNoEncoding).then(() => {
          expect(spy).toHaveBeenCalledWith(mockServiceNoEncoding, mockRequest, noDataMessage);
        });
      });

      it('resolves and dispatches an appropriate error message when service call fails', () => {
        mockAxios.onGet(`${mockFhirServer}/Observation?code=${encodeURIComponent('http://loinc.org|2857-1')}&patient=${mockPatient}`)
          .reply(200, prefetchedData)
          .onGet(`${mockFhirServer}/Conditions?patient=${mockPatient}`).reply(500)
          .onGet(`${mockFhirServer}/Patient/${mockPatient}`).reply(200, {})
          .onPost(mockServiceWithPrefetchEncoded).reply(500);
        return callServices(mockServiceWithPrefetchEncoded).then(() => {
          expect(spy).toHaveBeenCalledWith(mockServiceWithPrefetchEncoded, mockRequest, failedServiceCallMessage);
        });
      });
    });

    describe('and the prefetch call is unsuccessful', () => {
      it('continues to POST to CDS service without the prefetch property that failed', ()=> {
        mockAxios.onGet(`${mockFhirServer}/Observation?code=${encodeURIComponent('http://loinc.org|2857-1')}&patient=${mockPatient}`)
          .reply(404)
          .onPost(mockServiceWithPrefetch).reply(200, mockServiceResult);
        return callServices(mockServiceWithPrefetch).then(() => {
          expect(spy).toHaveBeenCalledWith(mockServiceWithPrefetch, mockRequest, mockServiceResult);
        });
      });
    });
  });

  describe('When prefetch is not needed by a service', () => {
    let spy;
    beforeEach(() => {
      setMocksAndTestFunction(defaultStore);
      spy = jest.spyOn(actions, 'storeExchange');
    });

    it('resolves and dispatches data from a successful CDS service call', () => {
      mockAxios.onPost(mockServiceWithoutPrefetch).reply(200, mockServiceResult);
      return callServices(mockServiceWithoutPrefetch).then(() => {
        expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequest, mockServiceResult);
      });
    });

    it('resolves and dispatches an appropriate message if no data is returned from service', () => {
      mockAxios.onPost(mockServiceWithoutPrefetch).reply(200, {});
      return callServices(mockServiceWithoutPrefetch).then(() => {
        expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequest, noDataMessage);
      });
    });

    it('resolves and dispatches an appropriate message when service call fails', () => {
      mockAxios.onPost(mockServiceWithoutPrefetch).reply(500);
      return callServices(mockServiceWithoutPrefetch).then(() => {
        expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequest, failedServiceCallMessage);
      });
    });
  });
});
