import * as types from '../actions/action-types';

const initialState = {
  serviceRequest: {
    studyCoding: {},
    reasonCodings: [],
  },
  pamaRating: 'unknown',
};

const reducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      case 'TRIGGER_ORDER_SIGN':
      case 'EXPLICIT_HOOK_TRIGGER': {
        return { ...state, pamaRating: 'unknown' };
      }

      case types.REMOVE_STUDY: return {
        ...state,
        serviceRequest: {
          ...(state.serviceRequest),
          studyCoding: {}
        },
      };

       case types.UPDATE_STUDY: return {
        ...state,
        serviceRequest: {
          ...(state.serviceRequest),
          studyCoding: action.coding
        },
      };

      case types.ADD_REASON: return {
        ...state,
        serviceRequest: {
          ...(state.serviceRequest),
          reasonCodings: state.serviceRequest.reasonCodings.concat([action.coding])
        },
      };

      case types.REMOVE_REASON: return {
        ...state,
        serviceRequest: {
          ...(state.serviceRequest),
          reasonCodings: state.serviceRequest.reasonCodings.filter(c => c.code !== action.coding.code)
        },
      };

      case 'APPLY_PAMA_RATING': return {
        ...state,
        pamaRating: action.rating,
      };
      default: return state;
    }
  }
  return state;
};

export default reducers;
