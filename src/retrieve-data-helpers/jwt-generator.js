import privKey from '../../keys/ecprivkey.pem';

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
    aud: audience,
    exp: Math.round((Date.now() / 1000) + 300),
    iat: Math.round((Date.now() / 1000)),
    jti: uuid(),
  });

  const jwtHeader = JSON.stringify({
    alg: 'ES384',
    typ: 'JWT',
    kid: '44823f3d-0b01-4a6c-a80e-b9d3e8a7226f',
    jku: 'https://sandbox.cds-hooks.org/.well-known/jwks.json',
  });

  return JWT.jws.JWS.sign(null, jwtHeader, jwtPayload, privKey);
}

export default generateJWT;
