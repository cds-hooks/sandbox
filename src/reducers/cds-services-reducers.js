import isEqual from 'lodash/isEqual';
import * as types from '../actions/action-types';

const initialState = {
  configuredServices: {},
  defaultUrl: 'https://fhir-org-cds-services.appspot.com/cds-services',
  testServicesUrl: null,
};

const cdsServicesReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Signal that the application is retrieving CDS Services
      case types.DISCOVER_CDS_SERVICES: {
        if (action.testUrl) {
          return Object.assign({}, state, { testServicesUrl: action.testUrl });
        }
        break;
      }
      // Store CDS Services grabbed successfully from a discovery endpoint
      case types.DISCOVER_CDS_SERVICES_SUCCESS: {
        if (action.services) {
          const incomingServices = {};

          // For each service returned by the discovery endpoint, check if it is already configured (or not changed),
          // and if not, store the service definitions by the specific CDS Service URL in the
          // configuredServices property of the reducer state
          action.services.forEach((service) => {
            const serviceUrl = `${state.testServicesUrl}/${service.id}`;
            const serviceEndpoint = state.configuredServices[serviceUrl];
            if (!serviceEndpoint || !isEqual(serviceEndpoint, service)) {
              const serviceCopy = Object.assign({}, service);
              serviceCopy.enabled = true;
              incomingServices[serviceUrl] = serviceCopy;
            }
          });

          const newServicesKeys = Object.keys(incomingServices);

          if (newServicesKeys.length) {
            const newServices = Object.assign({}, state.configuredServices);
            for (let i = 0; i < newServicesKeys.length; i += 1) {
              newServices[newServicesKeys[i]] = incomingServices[newServicesKeys[i]];
            }
            return Object.assign({}, state, {
              testServicesUrl: null,
              configuredServices: newServices,
            });
          }
        }
        break;
      }

      case types.RESET_SERVICES: {
        return Object.assign({}, state, {
          configuredServices: {},
          testServicesUrl: '',
        });
      }

      case types.TOGGLE_SERVICE: {
        if (state.configuredServices[action.service]) {
          const servicesCopy = JSON.parse(JSON.stringify(state.configuredServices));
          servicesCopy[action.service].enabled = !servicesCopy[action.service].enabled;
          return Object.assign({}, state, {
            configuredServices: servicesCopy,
          });
        }
        return state;
      }

      case types.DELETE_SERVICE: {
        if (state.configuredServices[action.service]) {
          const servicesCopy = JSON.parse(JSON.stringify(state.configuredServices));
          delete servicesCopy[action.service];
          return Object.assign({}, state, {
            configuredServices: servicesCopy,
          });
        }
        return state;
      }

      default: {
        return state;
      }
    }
  }
  return state;
};

export default cdsServicesReducers;
