import reducer from '../../src/reducers/hook-reducers';
import * as types from '../../src/actions/action-types';

describe('Hook Reducer', () => {
  let state = {};

  beforeEach(() => {
    state = {
      currentHook: 'patient-view',
      isLoadingData: false,
    };
  });

  it('should return the initial state without action', () => {
    expect(reducer(undefined, {})).toEqual(state);
  });

  describe('SET_LOADING_STATUS', () => {
    it('should handle the SET_LOADING_STATUS action accordingly', () => {
      const action = {
        type: types.SET_LOADING_STATUS,
        isLoaderOn: true,
      };

      const newState = Object.assign({}, state, { isLoadingData: action.isLoaderOn});
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