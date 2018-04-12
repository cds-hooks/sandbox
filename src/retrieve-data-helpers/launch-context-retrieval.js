/* eslint no-param-reassign: 0 */
import axios from 'axios';

function retrieveLaunchContext(link, accessToken, patientId, fhirBaseUrl) {
  return new Promise((resolve, reject) => {
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken.access_token}`,
    };

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
