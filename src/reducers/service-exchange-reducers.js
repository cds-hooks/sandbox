import * as types from '../actions/action-types';

const initialState = {
  selectedService: '',
  exchanges: {},
};

const serviceExchangeReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Successful call to CDS Service, store the data request and response in-app
      case types.STORE_SERVICE_EXCHANGE: {
        if (action.url && action.request && action.response) {
          const service = {};
          service.request = action.request;
          service.response = action.response;
          service.responseStatus = action.responseStatus;
          const exchanges = Object.assign({}, state.exchanges);
          exchanges[action.url] = service;
          return Object.assign({}, state, { exchanges });
        }
        break;
      }

      // Select a CDS Service to display exchange context for
      case types.SELECT_SERVICE_CONTEXT: {
        if (action.service && state.selectedService !== action.service) {
          return Object.assign({}, state, { selectedService: action.service });
        }
        break;
      }

      case types.RESET_SERVICES: {
        return Object.assign({}, state, {
          selectedService: '',
          exchanges: {},
        });
      }

      case types.TOGGLE_SERVICE: {
        return Object.assign({}, state, {
          selectedService: state.selectedService === action.service ? '' : state.selectedService,
        });
      }

      case types.DELETE_SERVICE: {
        if (state.exchanges[action.service]) {
          const exchangesCopy = JSON.parse(JSON.stringify(state.exchanges));
          delete exchangesCopy[action.service];
          return Object.assign({}, state, {
            exchanges: exchangesCopy,
            selectedService: state.selectedService === action.service ? '' : state.selectedService,
          });
        }
        break;
      }
      // Clear the selected service to display request/response for when the view changes
      case types.SET_HOOK: {
        return Object.assign({}, state, {
          selectedService: '',
        });
      }

      default: {
        return state;
      }
    }
  }
  return state;
};

export default serviceExchangeReducers;
