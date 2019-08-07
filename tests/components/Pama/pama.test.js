import React from "react";
import { mount, shallow } from "enzyme";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import 'core-js/fn/array/flat-map';

describe("Pama component", () => {
  let storeState;
  let wrapper;
  let pureComponent;
  let mockStore;
  let mockStoreWrapper = configureStore([]);

  let ConnectedView;
  let Pama;
  let mockSpy;

  function setup(state) {
    mockStore = mockStoreWrapper(state);
    jest.setMock(
      "../../../src/retrieve-data-helpers/service-exchange",
      mockSpy
    );
    ConnectedView = require("../../../src/components/Pama/pama").default;
    Pama = require("../../../src/components/Pama/pama")["Pama"];

    let component = <ConnectedView store={mockStore} />;
    wrapper = shallow(component);
    pureComponent = wrapper.find(Pama);
  }

  beforeEach(() => {
    storeState = {
      patientState: { currentPatient: { id: 'patient-123' } },
      pama: {
        serviceRequest: {
          code: "1",
          reasonCode: "2"
        },
        pamaRating: "appropriate"
      }
    };
    mockSpy = jest.fn();
    setup(storeState);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("matches props passed down from Redux decorator", () => {
    expect(pureComponent.prop("pamaRating")).toEqual(
      storeState.pama.pamaRating
    );
    expect(pureComponent.prop("serviceRequest")).toEqual(
      storeState.pama.serviceRequest
    );
  });

  it("creates hook context correctly", () => {
    const generateContext = require("../../../src/components/Pama/pama").pamaTriggerHandler.generateContext
    const context = generateContext(storeState);
    expect(context.selections).toEqual(['ServiceRequest/example-request-id']);

    const expectedDraftOrders = {
      resourceType: 'Bundle',
      entry: [
        {
          resource: {
            resourceType: 'ServiceRequest',
            id: 'example-request-id',
            status: 'draft',
            intent: 'plan',
            code: {
              coding: [
                {
                  system: 'http://www.ama-assn.org/go/cpt',
                  code: '1',
                },
              ],
            },
            subject: {
              reference: 'Patient/patient-123',
            },
            reasonCode: [
              {
                coding: [
                  {
                    system: 'http://snomed.info/sct',
                    code: '2',
                  },
                ],
              },
            ],
          },
        },
      ],
    }

    expect(context.draftOrders).toEqual(expectedDraftOrders);
  });

  it("Handles onMessage payloads correctly", () => {
    const data = {
      messageType: "scratchpad.update",
      payload: {
        resource: {
          resourceType: "ServiceRequest",
          id: "example-request-id",
          code: {
            coding: [
              {
                system: "http://www.ama-assn.org/go/cpt",
                code: "72133"
              }
            ]
          },
          extension: [
            {
              url: "http://fhir.org/argonaut/Extension/pama-rating",
              valueCodeableConcept: {
                coding: [
                  {
                    system: "http://fhir.org/argonaut/CodeSystem/pama-rating",
                    code: "no-criteria-apply"
                  }
                ]
              }
            }
          ]
        }
      }
    };

    const onMessage = require("../../../src/components/Pama/pama").pamaTriggerHandler.onMessage
    const dispatch = jest.fn()
    onMessage({ data, dispatch })
    expect(dispatch).toHaveBeenCalled()

  });
});
