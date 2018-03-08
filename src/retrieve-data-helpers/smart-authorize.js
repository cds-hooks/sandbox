import { localhostClientId as clientId, allScopes } from '../config/fhir-config';

FHIR.oauth2.authorize({
  client_id: clientId,
  scope: allScopes,
});
