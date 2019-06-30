import * as types from '../actions/action-types';
import cdsExecution from '../middleware/cds-execution';

const initialState = {
  currentHook: 'patient-view',
  currentScreen: 'patient-view',
  isLoadingData: false,
  isContextVisible: true,
  triggerCount: 0,
  apps: [],
  screens: {
    'patient-view': { // TODO rename this to face-sheet
      triggerPoints: {
        'face-sheet/patient-view': {
          hook: 'patient-view',
          lastExchangeRound: 0,
        },
      },
    },
    'rx-view': {
      triggerPoints: {
        'rx-view/order-select': {
          hook: 'order-select',
          lastExchangeRound: 0,
        },
      },
    },
    pama: {
      triggerPoints: {
        'pama/order-select': {
          hook: 'order-select',
          lastExchangeRound: 0,
        },
        'pama/order-sign': {
          hook: 'order-sign',
          lastExchangeRound: 0,
        },
      },
    },
  },
};

const deepCopy = x => JSON.parse(JSON.stringify(x));

const hookReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Set status for data loading in application
      case types.SET_LOADING_STATUS: {
        return Object.assign({}, state, { isLoadingData: action.isLoaderOn });
      }
      case 'LAUNCH_SMART_APP': {
        const windowId = cdsExecution.registerWindow('pama/order-select', action.link, action.sourceWindow);
        return {
          ...state,
          apps: [...state.apps, {
            triggerPoint: action.triggerPoint,
            link: action.link,
            windowId,
          }],
        };
      }

      case 'EXPLICIT_HOOK_TRIGGER': {
        return { ...state, triggerCount: state.triggerCount + 1 };
      }

      case 'CREATE_EXCHANGE_ROUND': {
        // TODO use immer or something to make this nice
        const newState = deepCopy(state);
        newState.screens[action.screen].triggerPoints[action.triggerPoint].lastExchangeRound = action.id;
        return newState;
      }

      // Set status for slideout context view visibility
      case types.SET_CONTEXT_VISIBILITY: {
        return Object.assign({}, state, {
          isContextVisible: !state.isContextVisible,
        });
      }

      // Set hook for the application
      case types.SET_HOOK: {
        const currentHook = action.hook || state.currentHook;
        const currentScreen = action.screen || currentHook;

        return Object.assign({}, state, {
          currentHook,
          currentScreen,
        });
      }

      case types.ADD_HOOK_TRIGGER: {
        const currentHook = action.hook || state.currentHook;
        const currentScreen = action.screen || currentHook;

        return Object.assign({}, state, {
          currentHook,
          currentScreen,
        });
      }

      default:
        return state;
    }
  }
  return state;
};

export default hookReducers;
