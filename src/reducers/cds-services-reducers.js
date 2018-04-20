import isEqual from 'lodash/isEqual';
import uniq from 'lodash/uniq';
import * as types from '../actions/action-types';
import store from '../store/store';

const getPersistedServices = () => {
  const persistedServices = localStorage.getItem('PERSISTED_cdsServices');
  if (persistedServices) {
    const parsedServices = JSON.parse(persistedServices);
    if (parsedServices && parsedServices.length) {
      return [].concat(parsedServices);
    }
  }
  return [];
};

const initialState = {
  configuredServices: {},
  configuredServiceUrls: getPersistedServices(),
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
            const serviceUrl = `${action.discoveryUrl}/${service.id}`;
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
            let newConfiguredServiceUrls = state.configuredServiceUrls;
            // Don't add default CDS Service endpoint to cached services, as it will be called when the Sandbox starts up already
            if (action.discoveryUrl !== state.defaultUrl) {
              const { accessToken } = store.getState().fhirServerState;
              // Don't add CDS Service endpoint from access token "serviceDiscoveryURL" property to cached services, as it has already
              // been called during the SMART authentication step. Ignore http(s) in case the serviceDiscoveryURL was not configured with a
              // http(s) protocol in the access token
              if ((accessToken && accessToken.serviceDiscoveryURL &&
                accessToken.serviceDiscoveryURL.replace(/^https?:\/\//i, '') !== action.discoveryUrl.replace(/^https?:\/\//i, ''))
                || !accessToken) {
                const concatArr = newConfiguredServiceUrls.concat([action.discoveryUrl]);
                newConfiguredServiceUrls = uniq(concatArr);
              }
            }
            localStorage.setItem('PERSISTED_cdsServices', JSON.stringify(newConfiguredServiceUrls));
            return Object.assign({}, state, {
              testServicesUrl: null,
              configuredServices: newServices,
              configuredServiceUrls: newConfiguredServiceUrls,
            });
          }
        }
        break;
      }

      case types.RESET_SERVICES: {
        localStorage.removeItem('PERSISTED_cdsServices');
        return Object.assign({}, state, {
          configuredServices: {},
          configuredServiceUrls: [],
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
