import reducer from '../../src/reducers/card-demo-reducers';
import * as types from '../../src/actions/action-types';

describe('Card Demo Reducer', () => {
  let state = {};

  beforeEach(() => {
    state = {
      tempUserJson: null,
      isCardDemoView: false,
    };
  });

  it('should return the initial state without action', () => {
    expect(reducer(undefined, {})).toEqual(state);
  });

  describe('STORE_USER_CARD_JSON', () => {
    it('should handle the STORE_USER_CARD_JSON action accordingly', () => {
      const userJson = JSON.stringify({'foo': 'test'});
      const action = {
        type: types.STORE_USER_CARD_JSON,
        userJson,
      };

      const newState = Object.assign({}, state, { tempUserJson: action.userJson});
      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('TOGGLE_DEMO_VIEW', () => {
    it('should handle the SET_CONTEXT_VISIBILITY action accordingly', () => {
      const action = { type: types.TOGGLE_DEMO_VIEW };

      const newState = Object.assign({}, state, { isCardDemoView: !state.isCardDemoView});
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
