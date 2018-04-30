import axios from 'axios';
import store from '../store/store';
import generateJWT from './jwt-generator';
import { signalSuccessServicesRetrieval,
  signalFailureServicesRetrieval,
  signalRetrievingServices } from '../actions/cds-services-actions';

/**
 * Retrieve CDS Services from a discovery endpoint and dispatch a successful or failed connection to services.
 *
 * @param testUrl - Discovery endpoint to grab the CDS Services from
 * @returns {Promise} - Promise to resolve elsewhere
 */
function retrieveDiscoveryServices(testUrl) {
  return new Promise((resolve, reject) => {
    const discoveryUrl = testUrl || store.getState().cdsServicesState.defaultUrl;
    // TODO: Check if existing loading spinner exists before signaling to display another one
    store.dispatch(signalRetrievingServices(discoveryUrl));

    const signedPrivateJWT = generateJWT(discoveryUrl);

    axios({
      method: 'get',
      url: discoveryUrl,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${signedPrivateJWT}`,
      },
    }).then((result) => {
      if (result.data && result.data.services && result.data.services.length) {
        store.dispatch(signalSuccessServicesRetrieval(result.data.services, discoveryUrl));
        return resolve();
      }
      return reject();
    }).catch((err) => {
      console.error('Could not retrieve any services at discovery endpoint', err);
      store.dispatch(signalFailureServicesRetrieval());
      return reject(err);
    });
  });
}

export default retrieveDiscoveryServices;
