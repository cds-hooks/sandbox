import reducer from '../../src/reducers/pama-reducers';
import * as types from '../../src/actions/action-types';

describe('Pama Reducers', () => {
  let state = {};

  beforeEach(() => {
    state = {
      serviceRequest: {
        studyCoding: {},
        reasonCodings: [],
      },
      pamaRating: 'unknown',
    };
  });

  it('returns the initial state without action', () => {
    expect(reducer(undefined, {})).toEqual(state);
  });

  it('should return state if an action should pass through this reducer without change to state', () => {
    const action = { type: 'SOME_OTHER_ACTION' };
    expect(reducer(state, action)).toEqual(state);
  });

  describe('UPDATE_IMAGING_ORDER', () => {
    it('updates pama rating, imaging study, and reason codings', () => {
      const rating = 'appropriate';
      const studyCoding = {
        code: '72133',
      };
      const reasonCodings = [
        {
          code: '123',
        },
      ];

      const action = {
        type: types.UPDATE_IMAGING_ORDER,
        pamaRating: rating,
        studyCoding,
        reasonCodings,
      };

      const newState = Object.assign({}, state, {
        pamaRating: rating,
        serviceRequest: {
          studyCoding,
          reasonCodings,
        }
      });

      expect(reducer(state, action)).toEqual(newState);
    });
  });
});
