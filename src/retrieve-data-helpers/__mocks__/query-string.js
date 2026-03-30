const queryString = jest.createMockFromModule('query-string');
queryString.parse = jest.fn(val => val || 'default-patient-id');

module.exports = queryString;
