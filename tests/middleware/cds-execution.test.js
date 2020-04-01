import cdsExecution from "../../src/middleware/cds-execution";
import * as types from "../../src/actions/action-types";
import callServices from "../../src/retrieve-data-helpers/service-exchange";
jest.mock("../../src/retrieve-data-helpers/service-exchange");

describe("CDS Execution Middleware", () => {
  let createMock;

  afterEach(() => {});

  it("Registers and unregisters handlers", async () => {
    let onSystemActions;
    const onSystemActionsPromise = new Promise(resolve => {
      onSystemActions = resolve;
    });

    let onMessage;
    const onMessagePromise = new Promise(resolve => {
      onMessage = resolve;
    });

    const iframe = document.createElement("iframe");
    window.document.body.appendChild(iframe);

    cdsExecution.webMessageMiddleware("fake-store")("fake-dispatch");

    let contextCalledCount = 0;
    let unregisterHandler = cdsExecution.registerTriggerHandler(
      "example-trigger-point",
      {
        onMessage: onMessage,
        onSystemActions: onSystemActions,
        generateContext: () => ({
          i: contextCalledCount++
        })
      }
    );

    expect(cdsExecution.debug.triggerHandlers).toHaveProperty(
      "example-trigger-point"
    );

    let {
      windowId,
      unregister: unregisterWindow
    } = cdsExecution.registerWindow(
      "example-trigger-point",
      "",  // jsdom makes the origin look empty
      null // jsdom makes the source window look `null`
    );

    expect(cdsExecution.debug.windowsRegistered[windowId]).toBeTruthy();

    iframe.contentWindow.parent.postMessage("sample-smart-message", "*");
    await onMessagePromise;

    const fakeServiceUrl = "http://example-service-url";

    cdsExecution.onSystemActions(
      {
        type: types.STORE_SERVICE_EXCHANGE,
        url: fakeServiceUrl,
        exchangeRound: 0
      },
      "fake-dispatch",
      "fake-pre-store",
      {
        hookState: {
          currentScreen: "example-screen",
          screens: {
            "example-screen": {
              triggerPoints: {
                "example-trigger-point": {
                  lastExchangeRound: 0
                }
              }
            }
          }
        },
        serviceExchangeState: {
          exchanges: {
            [fakeServiceUrl]: {
              responseStatus: 200,
              response: { extension: { systemActions: ["example-actions"] } }
            }
          }
        }
      }
    );

    expect(await onSystemActionsPromise).toEqual(["example-actions"]);

    expect(callServices).not.toBeCalled();
    cdsExecution.evaluateCdsTriggers(
      {
        type: types.STORE_SERVICE_EXCHANGE,
        url: fakeServiceUrl,
        exchangeRound: 0
      },
      jest.fn(),
      {
        fhirServerState: {},
        cdsServicesState: {},
        hookState: {}
      },
      {
        fhirServerState: {},
        hookState: {
          currentScreen: "example-screen",
          screens: {
            "example-screen": {
              triggerPoints: {
                "example-trigger-point": {
                  lastExchangeRound: 0,
                  hook: "order-select"
                }
              }
            }
          }
        },
        cdsServicesState: {
          configuredServices: {
            [fakeServiceUrl]: {
              enabled: true,
              hook: "order-select"
            }
          }
        }
      }
    );

    expect(callServices).toBeCalledWith(
      expect.anything(),
      expect.anything(),
      fakeServiceUrl,
      [{ key: "i", value: 2 }],
      expect.anything()
    );

    unregisterWindow();
    expect(cdsExecution.debug.windowsRegistered[windowId]).not.toBeTruthy();

    unregisterHandler();
    expect(cdsExecution.debug.triggerHandlers).not.toHaveProperty(
      "example-trigger-point"
    );
  });
});
