import * as types from '../actions/action-types';

const initialState = {
  selectedService: '',
  exchanges: {},
  launchLinks: {},
};

const serviceExchangeReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Successful call to CDS Service, store the data request and response in-app
      case types.STORE_SERVICE_EXCHANGE: {
        if (action.url && action.request && action.response) {
          return {
            ...state,
            exchanges: {
              ...state.exchanges,
              [action.url]: {
                request: action.request,
                response: action.response,
                responseStatus: action.responseStatus,
                exchangeRound: action.exchangeRound,
              },
            },
          };
        }
        break;
      }

      case types.STORE_LAUNCH_LINK: {
        return {
          ...state,
          launchLinks: {
            ...state.launchLinks,
            [action.url]: {
              ...(state.launchLinks[action.url] || {}),
              [action.appContext || 'default']: action.remappedUrl,
            },
          },
        };
      }

      // Select a CDS Service to display exchange context for
      case types.SELECT_SERVICE_CONTEXT: {
        if (action.service && state.selectedService !== action.service) {
          return Object.assign({}, state, { selectedService: action.service });
        }
        break;
      }

      // Remove any CDS Service exchanges from the store
      case types.RESET_SERVICES: {
        return Object.assign({}, state, {
          selectedService: '',
          exchanges: {},
        });
      }

      // If the selected service in the CDS developer panel is toggled under the Configure CDS Services modal, then clear that selected service
      case types.TOGGLE_SERVICE: {
        return Object.assign({}, state, {
          selectedService: state.selectedService === action.service ? '' : state.selectedService,
        });
      }

      // Delete any CDS service exchanges if a service is deleted from the Configure CDS Services modal
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
