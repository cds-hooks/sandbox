const queryString = jest.genMockFromModule('query-string');
queryString.parse = jest.fn(val => val || 'default-patient-id');

module.exports = queryString;
