import produce from 'immer';
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
    'patient-view': {
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

const hookReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Set status for data loading in application
      case types.SET_LOADING_STATUS: {
        return { ...state, isLoadingData: action.isLoaderOn };
      }
      case types.LAUNCH_SMART_APP: {
        const { windowId } = cdsExecution.registerWindow(
          action.triggerPoint,
          action.link,
          action.sourceWindow,
        );
        return {
          ...state,
          apps: [
            ...state.apps,
            {
              triggerPoint: action.triggerPoint,
              link: action.link,
              windowId,
            },
          ],
        };
      }

      case types.EXPLICIT_HOOK_TRIGGER: {
        return { ...state, triggerCount: state.triggerCount + 1 };
      }

      case types.CREATE_EXCHANGE_ROUND: {
        return produce(state, (draftState) => {
          // eslint-disable-next-line no-param-reassign
          draftState.screens[action.screen].triggerPoints[
            action.triggerPoint
          ].lastExchangeRound = action.id;
        });
      }

      // Set status for slideout context view visibility
      case types.SET_CONTEXT_VISIBILITY: {
        return { ...state, isContextVisible: !state.isContextVisible };
      }

      // Set hook for the application
      case types.SET_HOOK: {
        const currentHook = action.hook || state.currentHook;
        const currentScreen = action.screen || currentHook;

        return {
          ...state,
          currentHook,
          currentScreen,
        };
      }

      default:
        return state;
    }
  }
  return state;
};

export default hookReducers;
