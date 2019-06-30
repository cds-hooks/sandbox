/* eslint no-param-reassign: 0 */
import axios from 'axios';

/**
 * Retrieves a SMART launch context from an endpoint to append as a "launch" query parameter to a SMART app launch URL (see SMART docs for more about launch context).
 * This applies mainly if a SMART app link on a card is to be launched. The link needs a "launch" query param with some opaque value from the SMART server entity.
 * This function generates the launch context (for HSPC Sandboxes only) for a SMART application by pinging a specific endpoint on the FHIR base URL and returns
 * a Promise to resolve the newly modified link.
 * @param {*} link - The SMART app launch URL
 * @param {*} accessToken - The access token provided to the CDS Hooks Sandbox by the FHIR server
 * @param {*} patientId - The identifier of the patient in context
 * @param {*} fhirBaseUrl - The base URL of the FHIR server in context
 */
function retrieveLaunchContext(link, accessToken, patientId, fhirBaseUrl) {
  return new Promise((resolve, reject) => {
    const headers = Object.assign({
      Accept: 'application/json',
    }, accessToken ? {
      Authorization: `Bearer ${accessToken.access_token}`,
    } : {});

    const launchParameters = {
      patient: patientId,
    };

    if (link.appContext) {
      launchParameters.appContext = link.appContext;
    }

    // May change when the launch context creation endpoint becomes a standard endpoint for all EHR providers
    axios({
      method: 'post',
      url: `${fhirBaseUrl}/_services/smart/Launch`,
      headers,
      data: {
        launchUrl: link.url,
        parameters: launchParameters,
      },
    }).then((result) => {
      if (result.data && Object.prototype.hasOwnProperty.call(result.data, 'launch_id')) {
        if (link.url.indexOf('?') < 0) {
          link.url += '?';
        } else {
          link.url += '&';
        }
        link.url += `launch=${result.data.launch_id}`;
        link.url += `&iss=${fhirBaseUrl}`;
        return resolve(link);
      }
      console.error('FHIR server endpoint did not return a launch_id to launch the SMART app. See network calls to the Launch endpoint for more details');
      link.error = true;
      return reject(link);
    }).catch((err) => {
      console.error('Cannot grab launch context from the FHIR server endpoint to launch the SMART app. See network calls to the Launch endpoint for more details', err);
      link.error = true;
      return reject(link);
    });
  });
}

export default retrieveLaunchContext;
