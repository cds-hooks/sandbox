import { productionClientId } from '../../src/config/fhir-config';

describe('JWT Generator', () => {
  let generateJWT;
  let signedJwtMock = '1234';
  let mockUUID = 'mock-uuid';
  let mockPrivateKey = 'private-key';
  let signMethodMock = jest.fn(() => signedJwtMock);

  beforeEach(() => {
    jest.setMock('uuid/v4', (() => mockUUID));
    jest.setMock('../../keys/ecprivkey.pem', mockPrivateKey);
    jest.setMock('jsrsasign', {
      jws: { JWS: { sign: signMethodMock  } }
    });
    generateJWT = require('../../src/retrieve-data-helpers/jwt-generator').default;
  });

  afterEach(() => {
    jest.resetModules();
  })

  it('generates a JWT with the given audience', () => {
    const audience = 'http://example-services.com/cds-services/1';
    const expectedPayload = JSON.stringify({
      iss: `https://sandbox.cds-hooks.org`,
      sub: productionClientId,
      aud: audience,
      exp: Math.round((Date.now() / 1000) + 300),
      iat: Math.round((Date.now() / 1000)),
      jti: mockUUID,
    });

    const expectedHeader = JSON.stringify({
      alg: 'ES256',
      typ: 'JWT',
      kid: 'd9cd3c4f-eb08-4304-b973-44f352fd2ca2',
      jku: 'https://raw.githubusercontent.com/cds-hooks/sandbox-2.0/master/keys/jwk-keypair.json'
    });
    expect(generateJWT(audience)).toEqual(signedJwtMock);
    expect(signMethodMock).toHaveBeenCalledWith(null, expectedHeader, expectedPayload, mockPrivateKey);
  });
});
