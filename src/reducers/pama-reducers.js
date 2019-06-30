const initialState = {
  serviceRequest: {
    code: '123',
    reasonCode: '456',
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

      case 'UPDATE_SERVICE_REQUEST': return {
        ...state,
        pamaRating: 'unknown',
        serviceRequest: {
          ...(state.serviceRequest),
          [action.field]: action.val,
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
