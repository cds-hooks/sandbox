import reducer from '../../src/reducers/hook-reducers';
import * as types from '../../src/actions/action-types';

describe('Hook Reducer', () => {
  let state = {};

  beforeEach(() => {
    state = {
      apps: [],
      currentHook: 'patient-view',
      isLoadingData: false,
      isContextVisible: true,
    };
  });

  it('should return the initial state without action', () => {
    expect(reducer(undefined, {})).toMatchObject(state);
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

  describe('LAUNCH_SMART_APP', () => {
    it('should extract the origin from a link url', () => {
      const action = {
        type: types.LAUNCH_SMART_APP,
        triggerPoint: 'patient-view',
        link: {
          url: 'http://localhost:8080/foo/bar/ignored',
        },
        sourceWindow: 'abcdefgh-ijkl-mnop-qrst-uvwxyz012345',
      };
      const expectedApp = {
        triggerPoint: action.triggerPoint,
        link: action.link,
        linkOrigin: 'http://localhost:8080',
        windowId: 0,
      };
      const expected = Object.assign({}, state, { apps: [ expectedApp ] });
      const actual = reducer(state, action);
      expect(actual).toEqual(expected);
    })
  });

  describe('SET_CONTEXT_VISIBILITY', () => {
    it('should handle the SET_CONTEXT_VISIBILITY action accordingly', () => {
      const action = {
        type: types.SET_CONTEXT_VISIBILITY,
        isContextVisible: false,
      };

      const newState = Object.assign({}, state, { isContextVisible: action.isContextVisible});
      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('SET_HOOK', () => {
    it('should handle the SET_HOOK action accordingly', () => {
      const action = {
        type: types.SET_HOOK,
        hook: 'order-select',
      };

      const newState = Object.assign({}, state, { currentHook: action.hook });
      expect(reducer(state, action)).toMatchObject(newState);
    });

    it('should keep the current hook if the incoming hook is not valid', () => {
      const action = {
        type: types.SET_HOOK,
        hook: '',
      };

      expect(reducer(state, action)).toMatchObject(state);
    });
  });

  describe('Pass-through Actions', () => {
    it('should return state if an action should pass through this reducer without change to state', () => {
      const action = { type: 'SOME_OTHER_ACTION' };
      expect(reducer(state, action)).toEqual(state);
    });
  });
});