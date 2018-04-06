import reducer from '../../src/reducers/service-exchange-reducers';
import * as types from '../../src/actions/action-types';

describe('Services Exchange Reducers', () => {
  let state = {};
  let storedExchange = {};
  const url = 'http://example.com/cds-services/id-1';

  beforeEach(() => {
    state = {
      selectedService: '',
      exchanges: {}
    };
    storedExchange = {
      request: 'request',
      response: 'response'
    };
  });

  it('should return the initial state without action', () => {
    expect(reducer(undefined, {})).toEqual(state);
  });

  describe('STORE_SERVICE_EXCHANGE', () => {
    it('should return the state if action does not qualify state change', () => {
      const action = { type: types.STORE_SERVICE_EXCHANGE };
      expect(reducer(state, action)).toEqual(state);
    });

    it('should store the request/response of an exchange and set selectedService if not set already', () => {
      const action = Object.assign({
        type: types.STORE_SERVICE_EXCHANGE,
        url: url
      }, storedExchange);


      const newState = Object.assign({}, state, {
        selectedService: url,
        exchanges: {
          [action.url]: storedExchange
        }
      });
      expect(reducer(state, action)).toEqual(newState);
    });

    it('should store the request/response of an exchange and not set selectedService if set already', () => {
      const action = Object.assign({
        type: types.STORE_SERVICE_EXCHANGE,
        url: 'http://example.com/cds-services/id-2'
      }, storedExchange);

      state = { selectedService: url };

      const newState = Object.assign({}, state, {
        exchanges: {
          [action.url]: storedExchange
        }
      });
      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('Pass-through Actions', () => {
    it('should return state if an action should pass through this reducer without change to state', () => {
      const action = { type: 'SOME_OTHER_ACTION' };
      expect(reducer(state, action)).toEqual(state);
    });
  });
});
