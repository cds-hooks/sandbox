import { signalSuccessSmartAuth, signalFailureSmartAuth } from '../actions/smart-auth-actions';
import store from '../store/store';
import retrieveDiscoveryServices from './discovery-services-retrieval';

/**
 * Handle SMART launch (Oauth2 response) accordingly if Sandbox is launched as a SMART on FHIR app.
 * Store relevant data passed in.
 * @returns {Promise} - Promise to resolve elsewhere
 */
function smartLaunchPromise() {
  return new Promise((resolve, reject) => {
    const onAuthFailure = () => {
      console.log('Launched openly and unsecured');
      store.dispatch(signalFailureSmartAuth());
      return reject();
    };

    /**
     * If a SMART app launch is successful and redirected, check the conformance statement of the FHIR server to see if it is available to use.
     * If a CDS service discovery URL endpoint is included in the access token (as passed in context), the function grabs and stores available
     * CDS services to use later on.
     * @param {*} smart - Object passed by fhir-client.js library, containing the access token among other context data
     */
    const onAuthSuccess = (smart) => {
      console.log('Launched as a SMART app');
      if (smart.tokenResponse) {
        if (smart.server && smart.server.serviceUrl) {
          const conformanceQuery = smart.api.conformance({});
          const deferredToPromise = Promise.resolve(conformanceQuery);
          deferredToPromise.then((result) => {
            store.dispatch(signalSuccessSmartAuth(smart, result.data));
            // For SMART App Launcher, add ability to configure CDS Service automatically into the sandbox from a
            // custom property in the access token response called "serviceDiscoveryURL"
            if (smart.tokenResponse.serviceDiscoveryURL) {
              let discoveryURL = smart.tokenResponse.serviceDiscoveryURL;
              const discoveryUrls = discoveryURL.split(',');
              for (let i = 0; i < discoveryUrls.length; i += 1) {
                discoveryURL = discoveryUrls[i];
                if (!/^(https?:)?\/\//i.test(discoveryURL)) {
                  discoveryURL = `http://${discoveryURL}`;
                }
                retrieveDiscoveryServices(discoveryURL);
              }
            }
            return resolve(result.data);
          }).catch((err) => {
            console.error('Failed to get metadata from secured FHIR server. Launching sandbox openly', err);
            onAuthFailure();
          });
        } else {
          console.error('Could not provide the FHIR server in context from SMART Authorization response', smart);
          onAuthFailure();
        }
      } else {
        console.error('No token response received');
        onAuthFailure();
      }
    };

    FHIR.oauth2.ready(onAuthSuccess, onAuthFailure);
  });
}

export default smartLaunchPromise;
