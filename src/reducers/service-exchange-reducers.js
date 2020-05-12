import * as types from '../actions/action-types';

const initialState = {
  selectedService: '',
  exchanges: {},
  launchLinks: {},
  hiddenCards: {},
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
            hiddenCards: {
              ...state.hiddenCards,
              [action.url]: [],
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
          return { ...state, selectedService: action.service };
        }
        break;
      }

      case types.DISMISS_CARD: {
        return {
          ...state,
          hiddenCards: {
            ...state.hiddenCards,
            [action.serviceUrl]: [
              ...(state.hiddenCards[action.serviceUrl] || []),
              action.cardUUID,
            ],
          },
        };
      }

      // Remove any CDS Service exchanges from the store
      case types.RESET_SERVICES: {
        return {
          ...state,
          selectedService: '',
          exchanges: {},
          hiddenCards: {},
        };
      }

      // If the selected service in the CDS developer panel is toggled under the Configure CDS Services modal, then clear that selected service
      case types.TOGGLE_SERVICE: {
        return { ...state, selectedService: state.selectedService === action.service ? '' : state.selectedService };
      }

      // Delete any CDS service exchanges if a service is deleted from the Configure CDS Services modal
      case types.DELETE_SERVICE: {
        if (state.exchanges[action.service]) {
          const exchangesCopy = JSON.parse(JSON.stringify(state.exchanges));
          delete exchangesCopy[action.service];

          const hiddenCardsCopy = JSON.parse(JSON.stringify(state.hiddenCards));
          delete hiddenCardsCopy[action.service];
          return {
            ...state,
            exchanges: exchangesCopy,
            selectedService: state.selectedService === action.service ? '' : state.selectedService,
            hiddenCards: hiddenCardsCopy,
          };
        }
        break;
      }
      // Clear the selected service to display request/response for when the view changes
      case types.SET_HOOK: {
        return { ...state, selectedService: '' };
      }

      default: {
        return state;
      }
    }
  }
  return state;
};

export default serviceExchangeReducers;
