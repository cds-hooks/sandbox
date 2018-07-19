import privKey from '../../keys/ecprivkey.pem';
import { productionClientId } from '../config/fhir-config';

const JWT = require('jsrsasign');
const uuid = require('uuid/v4');

/**
 * Generates a JWT for a CDS service call, given the audience (the URL endpoint). The JWT is signed using a private key stored on the repository.
 *
 * Note: In production environments, the JWT should be signed on a secured server for best practice. The private key is exposed on the repository
 * as it is an open source client-side project and tool.
 * @param {*} audience - URL endpoint acting as the audience
 */
function generateJWT(audience) {
  const jwtPayload = JSON.stringify({
    iss: 'https://sandbox.cds-hooks.org',
    sub: productionClientId,
    aud: audience,
    exp: Math.round((Date.now() / 1000) + 300),
    iat: Math.round((Date.now() / 1000)),
    jti: uuid(),
  });

  const jwtHeader = JSON.stringify({
    alg: 'ES256',
    typ: 'JWT',
    kid: 'd9cd3c4f-eb08-4304-b973-44f352fd2ca2',
    jku: 'https://sandbox.cds-hooks.org/.well-known/jwks.json',
  });

  return JWT.jws.JWS.sign(null, jwtHeader, jwtPayload, privKey);
}

export default generateJWT;
