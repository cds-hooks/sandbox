import _ from 'lodash';
import callServices from '../retrieve-data-helpers/service-exchange';

// Maintain an increasing trigger count, for each time we do a round
// of CDS service invocations ("exchanges"). If we call 3 services
// in response to a user clicking a button, all 3 invocations are
// part of a single "exchange round"
let exchangeRoundCounter = 0;
const incrementExchangeRound = () => {
  exchangeRoundCounter += 1;
  return exchangeRoundCounter;
};

// CDS Triggers are areas within a given Screen that can invoke
// decision support. Each trigger is associated with a single
// hook type, and is responsible for maintaining its own handlers,
// which include the following:
// * generateContext: a function to generate the `context` for a hook invocation
// * onSystemActions: a function to handle systemActions from a CDS respons
//      (e.g., extracting data or updating an order entry screen)
// * onWebMessagd: a function to handle Web messages
const triggerHandlers = [];
const registerTriggerHandler = (triggerPoint, handler) => {
  triggerHandlers[triggerPoint] = handler;
  return () => {
    delete triggerHandlers[triggerPoint];
  };
};

const windowsRegistered = {};
const getRegisteredWindow = id => windowsRegistered[id];
const registerWindow = (triggerPoint, origin, sourceWindow) => {
  const windowId = Object.entries(windowsRegistered).length;
  windowsRegistered[windowId] = {
    origin,
    triggerPoint,
    sourceWindow,
  };
  return windowId;
};

// external hook context is universal: we'll need to re-trigger any
// service invocations whenever any of these properties changes
const externalHookContext = state => [
  state.hookState.configuredServices,
  state.hookState.currentScreen,
  state.hookState.currentHook,
  state.fhirServerState.currentFhirServer,
  state.patientState,
];

// TODO write better
const anyChange = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

// Given an action and a trigger point determine whether this trigger point
// nees a new CDS invocation based on one of the following criteria
// * External triggers are global page context: server, patient, etc
// * Internal triggers can be implicit (anything that would change the request context)
// * Internal triggers can also be explicit (like a "user clicked sign button")
const shouldCallCds = ({
  action, pre, post, handler,
}) => {
  const contextPre = handler.generateContext(pre);
  const contextPost = handler.generateContext(post);
  const externalTrigger = anyChange(
    externalHookContext(pre),
    externalHookContext(post),
  );
  const implicitTrigger = anyChange(contextPre, contextPost);
  const explicitTrigger = action.type === handler.needExplicitTrigger;
  const shouldUpdate =
    explicitTrigger ||
    (!handler.needExplicitTrigger && (implicitTrigger || externalTrigger));

  // Call any service if there has been an external trigger
  // or if internal triggers meet requirements
  return shouldUpdate;
};

// Given an action, determine which trigger points require a CDS invocation
const activeTriggers = ({
  action, triggerPoints, pre, post,
}) =>
  Object.entries(triggerPoints || {})
    .map(([triggerPoint, triggerDetails]) => ({
      action,
      triggerPoint,
      pre,
      post,
      handler: triggerHandlers[triggerPoint],
      hook: triggerDetails.hook,
    }))
    .filter(({ handler }) => handler)
    .filter(shouldCallCds);

// turn an object like {a:1} into a list like [{key: "a", value: 1}]
const explode = context =>
  Object.entries(context).map(([key, value]) => ({
    key,
    value,
  }));

const activeServicesFor = (hook, allServices) =>
  Object.entries(allServices || {}).filter(([, details]) => details.hook === hook && details.enabled);

const evaluateCdsTriggers = (action, next, pre, post) => {
  const { currentScreen } = post.hookState;
  const { triggerPoints } = post.hookState.screens[currentScreen];

  activeTriggers({
    action,
    pre,
    post,
    triggerPoints,
  }).forEach(({ triggerPoint, hook, handler }) => {
    const exchangeRound = incrementExchangeRound();

    // TODO action creator
    next({
      type: 'CREATE_EXCHANGE_ROUND',
      id: exchangeRound,
      screen: currentScreen,
      triggerPoint,
    });

    const context = handler.generateContext(post);

    activeServicesFor(hook, post.cdsServicesState.configuredServices).forEach(([serviceUrl]) =>
      // TODO replace with a callServices that doesn't need direct store access
      callServices(next, post, serviceUrl, explode(context), exchangeRound));
  });
};

const onSystemActions = (action, next, pre, post) => {
  // TODO add action creator
  if (action.type === 'STORE_SERVICE_EXCHANGE') {
    const { currentScreen } = post.hookState;
    const exchange = post.serviceExchangeState.exchanges[action.url];
    if (exchange.responseStatus === 200) {
      Object.entries(post.hookState.screens[currentScreen].triggerPoints)
        .filter(([, details]) => details.lastExchangeRound === action.exchangeRound)
        .forEach(([triggerPoint]) => {
          const handler = triggerHandlers[triggerPoint];
          const systemActions = _.get(exchange, [
            'response',
            'extension',
            'systemActions',
          ]);
          if (systemActions && handler && handler.onSystemActions) {
            handler.onSystemActions(systemActions, post, next);
          }
        });
    }
  }
};

const webMessageMiddleware = store => (next) => {
  window.addEventListener('message', ({ data, origin, source }) => {
    console.log(
      'Received window messaage',
      data,
      origin,
      source,
      windowsRegistered,
      triggerHandlers,
    );
    Object.entries(windowsRegistered)
      .filter(([windowId, w]) => w.sourceWindow === source)
      .map(([windowId, w]) => w.triggerPoint)
      .map(triggerPoint => triggerHandlers[triggerPoint])
      .forEach(handler =>
        handler.onMessage({
          data,
          origin,
          source,
          dispatch: next,
        }));
  });
  return next;
};

// wrapper to expose the redux middleware signature from a function
// that expects to receive: action, dispatch fn, previous state, current state
const middlewareFor = fn => store => next => (action) => {
  const pre = store.getState();
  next(action);
  const post = store.getState();

  fn(action, next, pre, post);
};

export default {
  middlewareFor,
  evaluateCdsTriggers,
  onSystemActions,
  webMessageMiddleware,
  registerTriggerHandler,
  registerWindow,
  getRegisteredWindow,
};
