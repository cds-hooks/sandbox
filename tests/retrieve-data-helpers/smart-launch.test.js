import configureStore from 'redux-mock-store';

describe('SMART Launch', () => {
  let actions;

  let mockStore = {};
  let defaultStore = {};

  const securedFhirServer = 'http://secured-fhir-server.com';
  let expectedMetadata;

  let smartLaunchPromise; // function to test

  console.log = jest.fn();
  console.error = jest.fn();
  let FHIR;

  beforeEach(() => {
    defaultStore = {
      fhirServerState: {
        accessToken: null
      },
    };
    expectedMetadata = {
      resourceType: 'Conformance',
    };

    const mockStoreWrapper = configureStore([]);
    mockStore = mockStoreWrapper(defaultStore);
    jest.setMock('../../src/store/store', mockStore);
    smartLaunchPromise = require('../../src/retrieve-data-helpers/smart-launch').default;
    actions = require('../../src/actions/smart-auth-actions');
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('When authorization for the SMART workflow succeeds', () => {
    let smartResponse;
    beforeEach(() => {
      smartResponse = {};
      FHIR = {
        oauth2: {
          ready: (success) => {
            return success(smartResponse);
          }
        }
      };
      global.FHIR = FHIR;
    });
    describe('and the response contains a token response', () => {
      beforeEach(() => {
        smartResponse.tokenResponse = {
          foo: 'foo'
        };
      });

      describe('but does not return the base FHIR server in context', () => {
        it('rejects the Promise and continues application startup', () => {
          const actions = mockStore.getActions();
          const expectedAction = { type: 'SMART_AUTH_FAILURE' };
          return smartLaunchPromise().catch(() => {
            expect(actions).toEqual([expectedAction]);
          });
        });
      });

      describe('and the conformance call to the secured FHIR server succeeds', () => {
        beforeEach(() => {
          smartResponse.server =  {
            serviceUrl: securedFhirServer,
          };
          const conformancePromise = new Promise((resolve) => {
            return resolve({ data: expectedMetadata });
          });
          smartResponse.api = {
            conformance: () => {
              return conformancePromise;
            }
          };
        });

        it('dispatches a successful SMART auth response and resolves', () => {
          const actions = mockStore.getActions();
          const expectedActions = [{
              type: 'SMART_AUTH_SUCCESS',
              authResponse: smartResponse,
              metadata: expectedMetadata,
            }];
          return smartLaunchPromise().then(() => {
            expect(actions).toEqual(expectedActions);
          });
        });
      });

      describe('and the conformance call to the secured FHIR server fails', () => {
        beforeEach(() => {
          smartResponse.server =  {
            serviceUrl: securedFhirServer,
          };
          const conformancePromise = new Promise((resolve, reject) => {
            return reject();
          });
          smartResponse.api = {
            conformance: () => {
              return conformancePromise;
            }
          };
        });

        it('rejects the Promise and continues application startup', () => {
          const actions = mockStore.getActions();
          const expectedAction = { type: 'SMART_AUTH_FAILURE' };
          return smartLaunchPromise().catch(() => {
            expect(actions).toEqual([expectedAction]);
          });
        });
      });
    });

    describe('and the response does not contain a token response', () => {
      it('rejects the Promise and continues application startup', () => {
        const actions = mockStore.getActions();
        const expectedAction = { type: 'SMART_AUTH_FAILURE' };
        return smartLaunchPromise().catch(() => {
          expect(actions).toEqual([expectedAction]);
        });
      });
    });
  });

  describe('When authorization for the SMART workflow fails', () => {
    beforeEach(() => {
      FHIR = {
        oauth2: {
          ready: (success, fail) => {
            return fail;
          }
        }
      };
    });
    it('rejects the Promise and continues app launch openly and unsecured', () => {
      const actions = mockStore.getActions();
      const expectedAction = { type: 'SMART_AUTH_FAILURE' };
      return smartLaunchPromise().catch(() => {
        expect(actions).toEqual([expectedAction]);
      });
    });
  });
});
