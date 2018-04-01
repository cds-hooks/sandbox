import configureStore from 'redux-mock-store';

describe('Services Filters', () => {
  let filters;
  let completeServiceExchange;
  let exampleServiceExchange;
  let noResponseExchange;
  let emptyResponseExchange;
  let noCardsExchange;
  let emptyCardsExchange;
  let testStore;
  let testValidCondition;
  let testInvalidCondition;

  beforeEach(() => {
    completeServiceExchange = 'http://complete-exchange.com/id';
    exampleServiceExchange = 'http://example-service-exchange.com/id';
    noResponseExchange = 'http://no-response-exchange.com/id';
    emptyResponseExchange = 'http://empty-response-exchange.com/id';
    noCardsExchange = 'http://no-cards-exchange.com/id';
    emptyCardsExchange = 'http://empty-cards-exchange/id';
    testValidCondition = {
      resource: {
        code: {
          coding: [
            {
              code: 'valid-code',
            },
          ],
        },
      },
    };
    testInvalidCondition = {
      resource: {
        code: {
          coding: [{
            code: 'invalid-code',
          }],
        },
      },
    };
    testStore = {
      patientState: {
        currentPatient: {
          conditionsResources: [
            testValidCondition,
            testInvalidCondition,
          ],
        },
      },
      serviceExchangeState: {
        exchanges: {
          [noResponseExchange]: {},
          [emptyResponseExchange]: {response: {}},
          [noCardsExchange]: { response: {decisions: []} },
          [emptyCardsExchange]: { response: {cards: []} },
          [completeServiceExchange]: {
            response: {
              cards: [{ summary: 'test' }],
            },
          },
          [exampleServiceExchange]: {
            response: {
              cards: [{ summary: 'another-test' }],
            },
          },
        },
      },
    };
    const mockStoreWrapper = configureStore([]);
    const mockStore = mockStoreWrapper(testStore);
    jest.setMock('../../../src/store/store', mockStore);
    filters = require('../../../src/reducers/helpers/services-filter');
  });

  describe('getServicesByHook', () => {
    let getServicesByHook;
    let matchUrl = 'http://matched-hook.com/id';
    let extraMatchUrl = 'http://not-enabled.com/id';
    let noMatchUrl = 'http://no-match-hook.com/id';
    let serviceMatchesHook = { hook: 'patient-view', enabled: true };
    let serviceNotEnabled = { hook: 'patient-view', enabled: false };
    let serviceNoMatchHook = { hook: 'not-match', enabled: true };
    let configuredServices = {
      [matchUrl]: serviceMatchesHook,
      [noMatchUrl]: serviceNoMatchHook,
      [extraMatchUrl]: serviceNotEnabled,
    };

    beforeEach(() => {
      getServicesByHook = filters.getServicesByHook;
    });

    it('returns relevant services by hook', () => {
      expect(getServicesByHook('patient-view', configuredServices)).toEqual({[matchUrl]: serviceMatchesHook});
    });


  });

  describe('getCardsFromServices', () => {
    let getCardsFromServices;
    let arrayOfServices;

    beforeEach(() => {
      arrayOfServices = [completeServiceExchange, exampleServiceExchange, noResponseExchange, 
        emptyResponseExchange, noCardsExchange, emptyCardsExchange, 'http://no-exchange-url.com/id'];
      getCardsFromServices = filters.getCardsFromServices;
    });

    it('gathers all cards into one cards array from passed in services', () => {
      expect(getCardsFromServices(arrayOfServices)).toEqual({
        cards: [
          testStore.serviceExchangeState.exchanges[completeServiceExchange].response.cards[0],
          testStore.serviceExchangeState.exchanges[exampleServiceExchange].response.cards[0],
        ]
      })
    });
  });

  describe('getConditionCodingFromCode', () => {
    let getConditionCodingFromCode;
    beforeEach(() => {
      getConditionCodingFromCode = filters.getConditionCodingFromCode;
    });
    it('filters conditions based on passed in code', () => {
      expect(getConditionCodingFromCode('valid-code')).toEqual(testValidCondition);
    });
  });
});
