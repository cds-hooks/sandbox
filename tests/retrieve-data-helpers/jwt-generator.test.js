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
      aud: audience,
      exp: Math.round((Date.now() / 1000) + 300),
      iat: Math.round((Date.now() / 1000)),
      jti: mockUUID,
    });

    const expectedHeader = JSON.stringify({
      alg: 'ES384',
      typ: 'JWT',
      kid: '44823f3d-0b01-4a6c-a80e-b9d3e8a7226f',
      jku: 'https://sandbox.cds-hooks.org/.well-known/jwks.json'
    });
    expect(generateJWT(audience)).toEqual(signedJwtMock);
    expect(signMethodMock).toHaveBeenCalledWith(null, expectedHeader, expectedPayload, mockPrivateKey);
  });
});
