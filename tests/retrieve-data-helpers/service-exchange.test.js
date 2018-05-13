import configureStore from 'redux-mock-store';
import MockAdapter from 'axios-mock-adapter';

describe('Service Exchange', () => {
  console.error = jest.fn();
  console.log = jest.fn();

  let mockAxios;
  let axios;
  let actions;
  let fhirConfig;

  let mockStore = {};
  let defaultStore = {};
  let callServices;

  let mockPatient;
  let mockFhirServer;
  let mockServiceWithPrefetch;
  let mockServiceWithPrefetchEncoded;
  let mockServiceNoEncoding;
  let mockServiceWithoutPrefetch;
  let mockServiceWithEmptyPrefetch;
  let mockHookInstance;
  let mockRequest;
  let mockRequestWithContext;
  let mockRequestWithFhirAuthorization;
  let mockAccessToken;

  let noDataMessage = 'No response returned. Check developer tools for more details.';
  let failedServiceCallMessage = 'Could not get a response from the CDS Service. See developer tools for more details';

  let prefetchedData = 'prefetch';
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
    fhirConfig = require('../../src/config/fhir-config');
    mockPatient = 'patient-1';
    mockFhirServer = 'http://fhir-server-example.com';
    mockServiceWithPrefetch = 'http://example.com/cds-services/id-1';
    mockServiceWithoutPrefetch = 'http://example.com/cds-services/id-2';
    mockServiceNoEncoding = 'http://example.com/cds-services/id-3';
    mockServiceWithPrefetchEncoded = 'http://example.com/cds-services/id-4';
    mockHookInstance = '123';
    mockAccessToken = {
      access_token: 'access-token',
      expires_in: '600',
    }
    mockRequest = {
      hookInstance: mockHookInstance,
      hook: 'patient-view',
      fhirServer: mockFhirServer,
      user: 'Practitioner/example',
      patient: mockPatient,
      context: { patientId: mockPatient }
    };
    mockRequestWithContext = Object.assign({}, mockRequest, {
      context: {
        ...mockRequest.context,
        medications: [{
          foo: 'foo',
        }],
      },
    });
    mockRequestWithFhirAuthorization = Object.assign({}, mockRequest, {
      fhirAuthorization: {
        access_token: mockAccessToken.access_token,
        token_type: 'Bearer',
        expires_in: mockAccessToken.expires_in,
        scope: fhirConfig.allScopes,
        subject: fhirConfig.productionClientId,
      },
    });

    defaultStore = {
      hookState: { currentHook: 'patient-view' },
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
              test: 'Observation?patient={{context.patientId}}&code=http://loinc.org|2857-1'
            }
          },
          [`${mockServiceWithPrefetchEncoded}`]: {
            prefetch: {
              first: 'Conditions?patient={{context.patientId}}',
              test: `Observation?patient={{context.patientId}}&code=${encodeURIComponent('http://loinc.org|2857-1')}`,
              second: 'Patient/{{context.patientId}}'
            }
          },
          [`${mockServiceNoEncoding}`]: {
            prefetch: {
              test: 'Patient/{{context.patientId}}'
            }
          },
          [`${mockServiceWithEmptyPrefetch}`]: {
            prefetch: {},
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
        mockRequest.prefetch = { test: prefetchedData };
      });

      it('resolves and dispatches a successful CDS Service call when prefetch is retrieved', () => {
        defaultStore.fhirServerState.accessToken = mockAccessToken;
        mockRequestWithFhirAuthorization.prefetch = { test: prefetchedData };
        const serviceResultStatus = 200;
        mockAxios.onGet(`${mockFhirServer}/Observation?code=${encodeURIComponent('http://loinc.org|2857-1')}&patient=${mockPatient}`)
          .reply((config) => {
            expect(config.headers['Authorization']).toEqual(`Bearer ${mockAccessToken.access_token}`);
            return [200, prefetchedData];
          })
          .onPost(mockServiceWithPrefetch).reply(serviceResultStatus, mockServiceResult);
        return callServices(mockServiceWithPrefetch).then(() => {
          expect(spy).toHaveBeenCalledWith(mockServiceWithPrefetch, mockRequestWithFhirAuthorization, mockServiceResult, serviceResultStatus);
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
        const serviceResultStatus = 200;
        mockAxios.onGet(`${mockFhirServer}/Observation?code=${encodeURIComponent('http://loinc.org|2857-1')}&patient=${mockPatient}`)
          .reply(404)
          .onPost(mockServiceWithPrefetch).reply(serviceResultStatus, mockServiceResult);
        return callServices(mockServiceWithPrefetch).then(() => {
          expect(spy).toHaveBeenCalledWith(mockServiceWithPrefetch, mockRequest, mockServiceResult, serviceResultStatus);
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
      const serviceResultStatus = 200;
      mockAxios.onPost(mockServiceWithoutPrefetch).reply(serviceResultStatus, mockServiceResult);
      return callServices(mockServiceWithoutPrefetch).then(() => {
        expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequest, mockServiceResult, serviceResultStatus);
      });
    });

    it('resolves and dispatches data from a successful CDS Service call with empty an prefetch object', () => {
      const serviceResultStatus = 200;
      mockAxios.onPost(mockServiceWithEmptyPrefetch).reply(serviceResultStatus, mockServiceResult);
      return callServices(mockServiceWithEmptyPrefetch).then(() => {
        expect(spy).toHaveBeenCalledWith(mockServiceWithEmptyPrefetch, mockRequest, mockServiceResult, serviceResultStatus);
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

    it('resolves with context passed in for the context parameter', () => {
      const serviceResultStatus = 200;
      mockAxios.onPost(mockServiceWithoutPrefetch).reply(serviceResultStatus, mockServiceResult);
      const context = [
        {
          key: 'medications',
          value: [{ foo: 'foo' }],
        },
      ];
      return callServices(mockServiceWithoutPrefetch, context).then(() => {
        expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequestWithContext, mockServiceResult, serviceResultStatus)
      });
    });
  });
});
