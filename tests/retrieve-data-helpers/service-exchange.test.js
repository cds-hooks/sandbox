import configureStore from 'redux-mock-store';
import MockAdapter from 'axios-mock-adapter';
import 'core-js/es/array/flat-map';


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
    let mockServiceWithSimpleFhirPath;
    let mockServiceWithUserTokens;
    let mockServiceWithUnresolved;
    let mockServiceWithQueryRestriction;
    let mockServiceWithDateAddition;
    let mockServiceWithMultipleDateTokens;
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
        mockServiceWithSimpleFhirPath = 'http://example.com/cds-services/id-5';
        mockServiceWithUserTokens = 'http://example.com/cds-services/id-6';
        mockServiceWithUnresolved = 'http://example.com/cds-services/id-7';
        mockServiceWithQueryRestriction = 'http://example.com/cds-services/id-8';
        mockServiceWithDateAddition = 'http://example.com/cds-services/id-9';
        mockServiceWithMultipleDateTokens = 'http://example.com/cds-services/id-10';
        mockHookInstance = '123';
        mockAccessToken = {
            access_token: 'access-token',
            expires_in: '600',
        }
        mockRequest = {
            hookInstance: mockHookInstance,
            hook: 'patient-view',
            fhirServer: mockFhirServer,
            context: { patientId: mockPatient, userId: 'Practitioner/specified-1' }
        };
        mockRequestWithContext = Object.assign({}, mockRequest, {
            context: {
                ...mockRequest.context,
                selections: ['selection/id'],
                draftOrders: [{
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
            hookState: { currentHook: 'patient-view', currentScreen: 'patient-view'},
            patientState: {
                defaultUser: 'Practitioner/default',
                currentUser: 'Practitioner/specified-1',
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
                    [`${mockServiceWithoutPrefetch}`]: {},
                    [`${mockServiceWithSimpleFhirPath}`]: {
                        prefetch: {
                            test: 'Observation?patient={{context.patientId}}&date=ge{{today() - 90 days}}'
                        }
                    },
                    [`${mockServiceWithUserTokens}`]: {
                        prefetch: {
                            test: 'Encounter?participant={{userPractitionerId}}'
                        }
                    },
                    [`${mockServiceWithUnresolved}`]: {
                        prefetch: {
                            test: 'Observation?patient={{context.nonexistent}}'
                        }
                    },
                    [`${mockServiceWithQueryRestriction}`]: {
                        prefetch: {
                            test: 'Patient?identifier:contains=foo'
                        }
                    },
                    [`${mockServiceWithDateAddition}`]: {
                        prefetch: {
                            test: 'Observation?patient={{context.patientId}}&date=le{{today() + 30 days}}'
                        }
                    },
                    [`${mockServiceWithMultipleDateTokens}`]: {
                        prefetch: {
                            test: 'Observation?patient={{context.patientId}}&date=ge{{today() - 90 days}}&date=le{{today()}}'
                        }
                    }
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
                mockAxios
                    .onPost(`${mockFhirServer}/Observation/_search`)
                    .reply((config) => {
                        expect(config.headers['Authorization']).toEqual(`Bearer ${mockAccessToken.access_token}`);
                        expect(config.data).toContain(`patient=${mockPatient}`);
                        expect(config.data).toContain(`code=${encodeURIComponent('http://loinc.org|2857-1')}`);
                        return [200, prefetchedData];
                    })
                    .onPost(mockServiceWithPrefetch).reply(serviceResultStatus, mockServiceResult);
                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithPrefetch).then(() => {
                    expect(spy).toHaveBeenCalledWith(mockServiceWithPrefetch, mockRequestWithFhirAuthorization, mockServiceResult, serviceResultStatus, 0);
                });
            });

            it('resolves and dispatches an appropriate message when no data comes back from services', () => {
                mockAxios.onGet(`${mockFhirServer}/Patient/${mockPatient}`)
                    .reply(200, prefetchedData)
                    .onPost(mockServiceNoEncoding).reply(200, {});
                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceNoEncoding).then(() => {
                    expect(spy).toHaveBeenCalledWith(mockServiceNoEncoding, mockRequest, noDataMessage);
                });
            });

            it('resolves and dispatches an appropriate error message when service call fails', () => {
                mockAxios
                    .onPost(`${mockFhirServer}/Observation/_search`).reply(200, prefetchedData)
                    .onPost(`${mockFhirServer}/Conditions/_search`).reply(500)
                    .onGet(`${mockFhirServer}/Patient/${mockPatient}`).reply(200, {})
                    .onPost(mockServiceWithPrefetchEncoded).reply(500);
                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithPrefetchEncoded).then(() => {
                    expect(spy).toHaveBeenCalledWith(mockServiceWithPrefetchEncoded, mockRequest, failedServiceCallMessage);
                });
            });
        });

        describe('and the prefetch call is unsuccessful', () => {
            it('continues to POST to CDS service without the prefetch property that failed', ()=> {
                const serviceResultStatus = 200;
                mockAxios
                    .onPost(`${mockFhirServer}/Observation/_search`).reply(404)
                    .onPost(mockServiceWithPrefetch).reply(serviceResultStatus, mockServiceResult);
                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithPrefetch).then(() => {
                    expect(spy).toHaveBeenCalledWith(mockServiceWithPrefetch, mockRequest, mockServiceResult, serviceResultStatus, 0);
                });
            });
        });

        // New tests for enhanced prefetch logic
        describe('enhanced prefetch tokens and behaviors', () => {
            beforeEach(() => {
                // ensure mocks/spies are in place
            });

            it('falls back to GET when POST to _search fails', () => {
                const serviceResultStatus = 200;
                mockAxios
                    .onPost(`${mockFhirServer}/Observation/_search`).reply(500)
                    .onGet(`${mockFhirServer}/Observation?patient=${mockPatient}&code=${encodeURIComponent('http://loinc.org|2857-1')}`)
                    .reply(200, prefetchedData)
                    .onPost(mockServiceWithPrefetch).reply(serviceResultStatus, mockServiceResult);
                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithPrefetch).then(() => {
                    const expectedReq = expect.objectContaining({
                        hookInstance: mockHookInstance,
                        hook: 'patient-view',
                        fhirServer: mockFhirServer,
                        context: { patientId: mockPatient, userId: 'Practitioner/specified-1' },
                    });
                    expect(spy).toHaveBeenCalledWith(
                        mockServiceWithPrefetch,
                        expectedReq,
                        mockServiceResult,
                        serviceResultStatus,
                        0
                    );
                });
            });

            it('resolves simple FHIRPath tokens like {{today() - 90 days}}', () => {
                mockRequest.prefetch = { test: prefetchedData };
                const serviceResultStatus = 200;
                const today = new Date();
                today.setHours(0,0,0,0);
                const d = new Date(today);
                d.setDate(d.getDate() - 90);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth()+1).padStart(2,'0');
                const dd = String(d.getDate()).padStart(2,'0');
                const expected = `${yyyy}-${mm}-${dd}`;

                mockAxios
                    .onPost(`${mockFhirServer}/Observation/_search`)
                    .reply((config) => {
                        expect(config.data).toContain(`patient=${mockPatient}`);
                        expect(config.data).toContain(`date=ge${expected}`);
                        return [200, prefetchedData];
                    })
                    .onPost(mockServiceWithSimpleFhirPath).reply(serviceResultStatus, mockServiceResult);

                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithSimpleFhirPath).then(() => {
                    expect(spy).toHaveBeenCalledWith(mockServiceWithSimpleFhirPath, mockRequest, mockServiceResult, serviceResultStatus, 0);
                });
            });

            it('replaces user identifier tokens like {{userPractitionerId}}', () => {
                mockRequest.prefetch = { test: prefetchedData };
                const serviceResultStatus = 200;
                mockAxios
                    .onPost(`${mockFhirServer}/Encounter/_search`)
                    .reply((config) => {
                        expect(config.data).toContain('participant=specified-1');
                        return [200, prefetchedData];
                    })
                    .onPost(mockServiceWithUserTokens).reply(serviceResultStatus, mockServiceResult);

                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithUserTokens).then(() => {
                    expect(spy).toHaveBeenCalledWith(mockServiceWithUserTokens, mockRequest, mockServiceResult, serviceResultStatus, 0);
                });
            });

            it('skips unresolved tokens rather than calling the FHIR server', () => {
                const serviceResultStatus = 200;
                // No FHIR mocks set up — unresolved token should cause skip
                mockAxios.onPost(mockServiceWithUnresolved).reply(serviceResultStatus, mockServiceResult);
                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithUnresolved).then(() => {
                    expect(spy).toHaveBeenCalledWith(mockServiceWithUnresolved, mockRequest, mockServiceResult, serviceResultStatus, 0);
                });
            });

            it('warns (advisory) on query modifiers outside recommended set', () => {
                console.warn = jest.fn();
                mockRequest.prefetch = { test: prefetchedData };
                const serviceResultStatus = 200;
                mockAxios
                    .onPost(`${mockFhirServer}/Patient/_search`).reply(200, prefetchedData)
                    .onPost(mockServiceWithQueryRestriction).reply(serviceResultStatus, mockServiceResult);

                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithQueryRestriction).then(() => {
                    expect(console.warn).toHaveBeenCalled();
                    expect(spy).toHaveBeenCalledWith(mockServiceWithQueryRestriction, mockRequest, mockServiceResult, serviceResultStatus, 0);
                });
            });

            it('resolves date tokens with addition for future dates', () => {
                const serviceResultStatus = 200;
                const today = new Date();
                today.setHours(0,0,0,0);
                const d = new Date(today);
                d.setDate(d.getDate() + 30);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth()+1).padStart(2,'0');
                const dd = String(d.getDate()).padStart(2,'0');
                const expected = `${yyyy}-${mm}-${dd}`;

                mockAxios
                    .onPost(`${mockFhirServer}/Observation/_search`)
                    .reply((config) => {
                        expect(config.data).toContain(`patient=${mockPatient}`);
                        expect(config.data).toContain(`date=le${expected}`);
                        return [200, prefetchedData];
                    })
                    .onPost(mockServiceWithDateAddition).reply(serviceResultStatus, mockServiceResult);

                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithDateAddition).then(() => {
                    const expectedReq = expect.objectContaining({
                        hookInstance: mockHookInstance,
                        hook: 'patient-view',
                        fhirServer: mockFhirServer,
                        context: { patientId: mockPatient, userId: 'Practitioner/specified-1' },
                        prefetch: { test: prefetchedData },
                    });
                    expect(spy).toHaveBeenCalledWith(
                        mockServiceWithDateAddition,
                        expectedReq,
                        mockServiceResult,
                        serviceResultStatus,
                        0
                    );
                });
            });

            it('resolves multiple date tokens in a single query', () => {
                const serviceResultStatus = 200;
                const today = new Date();
                today.setHours(0,0,0,0);
                const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

                const past = new Date(today);
                past.setDate(past.getDate() - 90);
                const pastStr = `${past.getFullYear()}-${String(past.getMonth()+1).padStart(2,'0')}-${String(past.getDate()).padStart(2,'0')}`;

                mockAxios
                    .onPost(`${mockFhirServer}/Observation/_search`)
                    .reply((config) => {
                        expect(config.data).toContain(`patient=${mockPatient}`);
                        expect(config.data).toContain(`date=ge${pastStr}`);
                        expect(config.data).toContain(`date=le${todayStr}`);
                        return [200, prefetchedData];
                    })
                    .onPost(mockServiceWithMultipleDateTokens).reply(serviceResultStatus, mockServiceResult);

                return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithMultipleDateTokens).then(() => {
                    const expectedReq = expect.objectContaining({
                        hookInstance: mockHookInstance,
                        hook: 'patient-view',
                        fhirServer: mockFhirServer,
                        context: { patientId: mockPatient, userId: 'Practitioner/specified-1' },
                    });
                    expect(spy).toHaveBeenCalledWith(
                        mockServiceWithMultipleDateTokens,
                        expectedReq,
                        mockServiceResult,
                        serviceResultStatus,
                        0
                    );
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
            return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithoutPrefetch).then(() => {
                expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequest, mockServiceResult, serviceResultStatus, 0);
            });
        });

        it('resolves and dispatches data from a successful CDS Service call with default user', () => {
            defaultStore.patientState.currentUser = '';
            mockRequest.context.userId = 'Practitioner/default';
            const serviceResultStatus = 200;
            mockAxios.onPost(mockServiceWithoutPrefetch).reply(serviceResultStatus, mockServiceResult);
            return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithoutPrefetch).then(() => {
                expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequest, mockServiceResult, serviceResultStatus, 0);
            });
        });

        it('resolves and dispatches data from a successful CDS Service call with empty an prefetch object', () => {
            const serviceResultStatus = 200;
            mockAxios.onPost(mockServiceWithEmptyPrefetch).reply(serviceResultStatus, mockServiceResult);
            return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithEmptyPrefetch).then(() => {
                expect(spy).toHaveBeenCalledWith(mockServiceWithEmptyPrefetch, mockRequest, mockServiceResult, serviceResultStatus, 0);
            });
        });



        it('resolves and dispatches an appropriate message if no data is returned from service', () => {
            mockAxios.onPost(mockServiceWithoutPrefetch).reply(200, {});
            return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithoutPrefetch).then(() => {
                expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequest, noDataMessage);
            });
        });

        it('resolves and dispatches an appropriate message when service call fails', () => {
            mockAxios.onPost(mockServiceWithoutPrefetch).reply(500);
            return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithoutPrefetch).then(() => {
                expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequest, failedServiceCallMessage);
            });
        });

        it('resolves with context passed in for the context parameter', () => {
            const serviceResultStatus = 200;
            mockAxios.onPost(mockServiceWithoutPrefetch).reply(serviceResultStatus, mockServiceResult);
            const context = [
                {
                    key: 'selections',
                    value: ['selection/id'],
                },
                {
                    key: 'draftOrders',
                    value: [{ foo: 'foo' }],
                },
            ];
            return callServices(mockStore.dispatch, mockStore.getState(), mockServiceWithoutPrefetch, context).then(() => {
                expect(spy).toHaveBeenCalledWith(mockServiceWithoutPrefetch, mockRequestWithContext, mockServiceResult, serviceResultStatus, 0)
            });
        });
    });
});
