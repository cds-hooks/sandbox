import reducer from '../../src/reducers/service-exchange-reducers';
import * as types from '../../src/actions/action-types';

describe('Services Exchange Reducers', () => {
  let state = {};
  let storedExchange = {};
  const url = 'http://example.com/cds-services/id-1';

  beforeEach(() => {
    state = {
      selectedService: '',
      exchanges: {},
      launchLinks: {},
      hiddenCards: {},
    };
    storedExchange = {
      request: 'request',
      response: 'response',
      responseStatus: 200,
    };
  });

  it('should return the initial state without action', () => {
    expect(reducer(undefined, {})).toMatchObject(state);
  });

  describe('STORE_SERVICE_EXCHANGE', () => {
    it('should return the state if action does not qualify state change', () => {
      const action = { type: types.STORE_SERVICE_EXCHANGE };
      expect(reducer(state, action)).toEqual(state);
    });

    it('should store the request/response of an exchange', () => {
      const action = Object.assign({
        type: types.STORE_SERVICE_EXCHANGE,
        url: url
      }, storedExchange);


      const newState = Object.assign({}, state, {
        exchanges: {
          [action.url]: storedExchange
        },
        hiddenCards: {
          [action.url]: []
        }
      });
      expect(reducer(state, action)).toEqual(newState);
    });

    it('should store exchangeRound for enhanced prefetch tracking', () => {
      const action = {
        type: types.STORE_SERVICE_EXCHANGE,
        url,
        request: { hookInstance: '123', hook: 'patient-view' },
        response: { cards: [] },
        responseStatus: 200,
        exchangeRound: 0,
      };

      const result = reducer(state, action);
      expect(result.exchanges[url].exchangeRound).toEqual(0);
    });

    it('should store multiple exchange rounds for the same service', () => {
      const firstAction = {
        type: types.STORE_SERVICE_EXCHANGE,
        url,
        request: { hookInstance: '123', hook: 'patient-view' },
        response: { cards: [] },
        responseStatus: 200,
        exchangeRound: 0,
      };

      let result = reducer(state, firstAction);
      expect(result.exchanges[url].exchangeRound).toEqual(0);

      const secondAction = {
        type: types.STORE_SERVICE_EXCHANGE,
        url,
        request: { hookInstance: '456', hook: 'patient-view' },
        response: { cards: [{ summary: 'Updated card' }] },
        responseStatus: 200,
        exchangeRound: 1,
      };

      result = reducer(result, secondAction);
      expect(result.exchanges[url].exchangeRound).toEqual(1);
      expect(result.exchanges[url].response.cards[0].summary).toEqual('Updated card');
    });

    it('should store request with prefetch data containing resolved date tokens', () => {
      const requestWithPrefetch = {
        hookInstance: '123',
        hook: 'patient-view',
        prefetch: {
          'p1': {
            resourceType: 'Bundle',
            entry: [{ resource: { id: 'obs-1' } }],
          },
        },
      };

      const action = {
        type: types.STORE_SERVICE_EXCHANGE,
        url,
        request: requestWithPrefetch,
        response: { cards: [] },
        responseStatus: 200,
        exchangeRound: 0,
      };

      const result = reducer(state, action);
      expect(result.exchanges[url].request.prefetch).toBeDefined();
      expect(result.exchanges[url].request.prefetch.p1.resourceType).toEqual('Bundle');
    });

    it('should initialize hiddenCards as empty array for new exchange', () => {
      const action = {
        type: types.STORE_SERVICE_EXCHANGE,
        url,
        request: { hookInstance: '123' },
        response: { cards: [] },
        responseStatus: 200,
        exchangeRound: 0,
      };

      const result = reducer(state, action);
      expect(result.hiddenCards[url]).toEqual([]);
    });

    it('should preserve hiddenCards when updating existing exchange', () => {
      state.hiddenCards[url] = ['card-uuid-1', 'card-uuid-2'];

      const action = {
        type: types.STORE_SERVICE_EXCHANGE,
        url,
        request: { hookInstance: '456' },
        response: { cards: [] },
        responseStatus: 200,
        exchangeRound: 1,
      };

      const result = reducer(state, action);
      expect(result.hiddenCards[url]).toEqual([]);
    });
  });

  describe('SELECT_SERVICE_CONTEXT', () => {
    it('should return the state if no service is passed in', () => {
      const action = { type: types.SELECT_SERVICE_CONTEXT };
      expect(reducer(state, action)).toEqual(state);
    });

    it('should return the state if selected service in state already matches passed in service to select', () => {
      state = { selectedService: url, exchanges: {} };
      const action = { type: types.SELECT_SERVICE_CONTEXT, service: url };
      expect(reducer(state, action)).toEqual(state);
    });

    it('should store selected service if passed in value does not match current selected service', () => {
      state = { selectedService: url, exchanges: {} };
      const newService = 'http://new.com/cds-services/id-1';
      const action = { type: types.SELECT_SERVICE_CONTEXT, service: newService };
      const newState = { selectedService: newService, exchanges: {}};
      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('DISMISS_CARD', () => {
    it('should add the card uuid to the array of hidden cards when dismissed', () => {
      state.exchanges[url] = storedExchange;
      const stateCopy = JSON.parse(JSON.stringify(state));
      stateCopy.hiddenCards[url] = ['1'];
      const action = { type: types.DISMISS_CARD, serviceUrl: url, cardUUID: '1' };
      expect(reducer(state, action)).toEqual(stateCopy);
    });
  });

  describe('RESET_SERVICES', () => {
    it('should reset the exchanges hash and any selected service', () => {
      state.exchanges[url] = storedExchange;
      state.hiddenCards[url] = ['1', '2']
      const stateCopy = JSON.parse(JSON.stringify(state));
      stateCopy.exchanges = {};
      stateCopy.selectedService = '';
      stateCopy.hiddenCards = {};
      const action = { type: types.RESET_SERVICES };
      expect(reducer(state, action)).toEqual(stateCopy);
    });
  });

  describe('TOGGLE_SERVICE', () => {
    it('should clear the selectedService property if it matches the service in incoming action', () => {
      const service = 'http://example.com';
      state.selectedService = service;
      const action = {
        type: types.TOGGLE_SERVICE,
        service,
      };
      const expectedState = Object.assign({}, state, { selectedService: '' });
      expect(reducer(state, action)).toEqual(expectedState);
    });

    it('should not clear selectedService property if the toggled service does not match selectedService', () => {
      const service = 'http://example.com';
      state.selectedService = service;
      const action = {
        type: types.TOGGLE_SERVICE,
        service: 'http://example22.com',
      };
      expect(reducer(state, action)).toEqual(state);
    });
  });

  describe('DELETE_SERVICE', () => {
    it('should remove stored service exchanges where the exchange URL matches the URL passed in action', () => {
      state.exchanges[url] = storedExchange;
      state.selectedService = url;
      state.hiddenCards[url] = ['1', '2'];
      const stateCopy = JSON.parse(JSON.stringify(state));
      stateCopy.exchanges =  {};
      stateCopy.selectedService = '';
      stateCopy.hiddenCards = {};
      const action = {
        type: types.DELETE_SERVICE,
        service: url,
      };
      expect(reducer(state, action)).toEqual(stateCopy);
    });

    it('should not update selectedService if the action service property does not match', () => {
      const otherSelectedService = 'http://some-otherthing.com';
      state.selectedService = otherSelectedService;
      state.exchanges[url] = storedExchange;
      const stateCopy = Object.assign({}, state, { exchanges: {} });
      const action = {
        type: types.DELETE_SERVICE,
        service: url,
      };
      expect(reducer(state, action)).toEqual(stateCopy);
    });

    it('should not update state if action service property does not exist in exchanges', () => {
      const action = {
        type: types.DELETE_SERVICE,
        service: url,
      };
      expect(reducer(state, action)).toEqual(state);
    });
  });

  describe('SET_HOOK', () => {
    it('should clear the selected service on a hook change', () => {
      const action = {
        type: types.SET_HOOK,
      };
      expect(reducer(state, action)).toEqual(Object.assign({}, state, { selectedService: '' }));
    });
  });

  describe('STORE_LAUNCH_LINK', () => {
    it('should store a SMART launch link with default context', () => {
      const launchUrl = 'http://example.com/cds-services/launch-1';
      const remappedUrl = 'http://ehr.example.com/launch?iss=...';
      const action = {
        type: types.STORE_LAUNCH_LINK,
        url: launchUrl,
        remappedUrl,
      };

      const result = reducer(state, action);
      expect(result.launchLinks[launchUrl]).toBeDefined();
      expect(result.launchLinks[launchUrl].default).toEqual(remappedUrl);
    });

    it('should store a SMART launch link with specific app context', () => {
      const launchUrl = 'http://example.com/cds-services/launch-1';
      const remappedUrl = 'http://ehr.example.com/launch?iss=...';
      const appContext = 'patient-123';
      const action = {
        type: types.STORE_LAUNCH_LINK,
        url: launchUrl,
        remappedUrl,
        appContext,
      };

      const result = reducer(state, action);
      expect(result.launchLinks[launchUrl][appContext]).toEqual(remappedUrl);
    });

    it('should preserve existing launch links when adding new ones', () => {
      const launchUrl1 = 'http://example.com/cds-services/launch-1';
      const launchUrl2 = 'http://example.com/cds-services/launch-2';
      const remappedUrl1 = 'http://ehr.example.com/launch1';
      const remappedUrl2 = 'http://ehr.example.com/launch2';

      const action1 = {
        type: types.STORE_LAUNCH_LINK,
        url: launchUrl1,
        remappedUrl: remappedUrl1,
      };

      let result = reducer(state, action1);

      const action2 = {
        type: types.STORE_LAUNCH_LINK,
        url: launchUrl2,
        remappedUrl: remappedUrl2,
        appContext: 'patient-456',
      };

      result = reducer(result, action2);
      expect(result.launchLinks[launchUrl1].default).toEqual(remappedUrl1);
      expect(result.launchLinks[launchUrl2]['patient-456']).toEqual(remappedUrl2);
    });

    it('should allow multiple app contexts for the same launch URL', () => {
      const launchUrl = 'http://example.com/cds-services/launch-1';
      const remappedUrl1 = 'http://ehr.example.com/launch?patient=123';
      const remappedUrl2 = 'http://ehr.example.com/launch?patient=456';

      const action1 = {
        type: types.STORE_LAUNCH_LINK,
        url: launchUrl,
        remappedUrl: remappedUrl1,
        appContext: 'patient-123',
      };

      let result = reducer(state, action1);

      const action2 = {
        type: types.STORE_LAUNCH_LINK,
        url: launchUrl,
        remappedUrl: remappedUrl2,
        appContext: 'patient-456',
      };

      result = reducer(result, action2);
      expect(result.launchLinks[launchUrl]['patient-123']).toEqual(remappedUrl1);
      expect(result.launchLinks[launchUrl]['patient-456']).toEqual(remappedUrl2);
    });
  });

  describe('GET_PATIENT_SUCCESS', () => {
    it('should clear all exchanges and selected service when new patient is loaded', () => {
      state.exchanges[url] = storedExchange;
      state.selectedService = url;
      state.hiddenCards[url] = ['card-1', 'card-2'];

      const action = {
        type: types.GET_PATIENT_SUCCESS,
      };

      const result = reducer(state, action);
      expect(result.exchanges).toEqual({});
      expect(result.selectedService).toEqual('');
      expect(result.hiddenCards).toEqual({});
    });

    it('should preserve launchLinks when patient changes', () => {
      const launchUrl = 'http://example.com/launch';
      state.launchLinks[launchUrl] = { default: 'http://ehr.example.com/launch' };
      state.exchanges[url] = storedExchange;

      const action = {
        type: types.GET_PATIENT_SUCCESS,
      };

      const result = reducer(state, action);
      expect(result.exchanges).toEqual({});
      expect(result.launchLinks[launchUrl]).toBeDefined();
    });
  });

  describe('Pass-through Actions', () => {
    it('should return state if an action should pass through this reducer without change to state', () => {
      const action = { type: 'SOME_OTHER_ACTION' };
      expect(reducer(state, action)).toEqual(state);
    });
  });
});
