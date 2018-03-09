import { signalSuccessSmartAuth, signalFailureSmartAuth } from '../actions/smart-auth-actions';
import store from '../store/store';

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

    const onAuthSuccess = (smart) => {
      console.log('Launched as a SMART app');
      if (smart.tokenResponse) {
        if (smart.server && smart.server.serviceUrl) {
          const conformanceQuery = smart.api.conformance({});
          const deferredToPromise = Promise.resolve(conformanceQuery);
          deferredToPromise.then((result) => {
            store.dispatch(signalSuccessSmartAuth(smart, result.data));
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
