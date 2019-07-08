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
      launchLinks: {}
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
        }
      });
      expect(reducer(state, action)).toEqual(newState);
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

  describe('RESET_SERVICES', () => {
    it('should reset the exchanges hash and any selected service', () => {
      state.exchanges[url] = storedExchange;
      const stateCopy = JSON.parse(JSON.stringify(state));
      stateCopy.exchanges = {};
      stateCopy.selectedService = '';
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
      const stateCopy = JSON.parse(JSON.stringify(state));
      stateCopy.exchanges =  {};
      stateCopy.selectedService = '';
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

  describe('Pass-through Actions', () => {
    it('should return state if an action should pass through this reducer without change to state', () => {
      const action = { type: 'SOME_OTHER_ACTION' };
      expect(reducer(state, action)).toEqual(state);
    });
  });
});
