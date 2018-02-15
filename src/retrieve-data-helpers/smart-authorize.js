import { localhostClientId as clientId } from '../config/client-id';

FHIR.oauth2.authorize({
  client_id: clientId,
  scope: 'patient/*.* user/*.* launch openid profile online_access',
});
