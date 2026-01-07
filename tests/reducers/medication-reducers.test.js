import moment from 'moment';
import { createFhirResource, medicationReducers as reducer} from '../../src/reducers/medication-reducers';
import * as types from '../../src/actions/action-types';
import rxnorm from '../../src/assets/medication-list';
import { getConditionCodingFromCode } from '../../src/reducers/helpers/services-filter';

describe('Medication Reducers', () => {
  let state = {};
  console.error = jest.fn();

  beforeEach(() => {
    // Build allPrescribables the same way the reducer does
    const buildAllPrescribables = () => {
      const allPrescribables = [];
      const seenIds = new Set();
      Object.keys(rxnorm.pillToComponentSets).forEach((pill) => {
        rxnorm.pillToComponentSets[pill].forEach((componentSet) => {
          const componentKey = componentSet.join(',');
          if (rxnorm.componentSetsToPrescribables[componentKey]) {
            rxnorm.componentSetsToPrescribables[componentKey].forEach((prescribableId) => {
              if (!seenIds.has(prescribableId)) {
                seenIds.add(prescribableId);
                allPrescribables.push({
                  id: prescribableId,
                  name: rxnorm.cuiToName[prescribableId],
                });
              }
            });
          }
        });
      });
      return allPrescribables.sort((a, b) => a.name.localeCompare(b.name));
    };

    state = {
      allPrescribables: buildAllPrescribables(),
      medications: Object.keys(rxnorm.pillToComponentSets).map(pill => (
        {
          id: pill,
          name: rxnorm.cuiToName[pill],
        }
      )),
      medListPhase: 'begin',
      userInput: '',
      filteredPrescribables: [],
      options: {
        ingredient: [],
        components: [],
        prescribable: [],
      },
      decisions: {
        ingredient: null,
        components: null,
        prescribable: null,
      },
      dispenseRequest: {
        supplyDuration: 30,
      },
      medicationInstructions: {
        number: 1,
        frequency: 'daily',
      },
      prescriptionDates: {
        start: {
          enabled: true,
          value: undefined,
        },
        end: {
          enabled: true,
          value: undefined,
        },
      },
      selectedConditionCode: '',
    };
  });

  it('returns the initial state without action', () => {
    expect(reducer(undefined, {})).toEqual(state);
  });

  describe('STORE_USER_MED_INPUT', () => {
    it('should handle the STORE_USER_MED_INPUT action with simplified workflow', () => {
      const input = 'acetaminophen';
      const action = {
        type: types.STORE_USER_MED_INPUT,
        input,
      };

      const result = reducer(state, action);

      // Verify userInput is set
      expect(result.userInput).toEqual(input);

      // Verify filteredPrescribables is populated (should have matches for "acetaminophen")
      expect(result.filteredPrescribables.length).toBeGreaterThan(0);

      // Verify prescribable decision is cleared
      expect(result.decisions.prescribable).toBeNull();

      // Verify medListPhase remains at 'begin' (simplified workflow)
      expect(result.medListPhase).toEqual('begin');
    });

    it('should clear filteredPrescribables when input is empty', () => {
      const action = {
        type: types.STORE_USER_MED_INPUT,
        input: '',
      };

      const result = reducer(state, action);
      expect(result.filteredPrescribables).toEqual([]);
      expect(result.userInput).toEqual('');
    });
  });

  describe('STORE_USER_CHOSEN_MEDICATION', () => {
    it('handles direct prescribable selection with simplified workflow', () => {
      const medication = {
        name: 'Carisoprodol 250 MG Oral Tablet [Soma]',
        id: '730918',
      };
      const action = {
        type: types.STORE_USER_CHOSEN_MEDICATION,
        medication,
      };

      const newState = Object.assign({}, state, {
        medListPhase: 'done',
        userInput: medication.name,
        filteredPrescribables: [],
        decisions: {
          ...state.decisions,
          prescribable: medication,
        },
      });

      expect(reducer(state, action)).toEqual(newState);
    });

    it('updates userInput to medication name when medication is chosen', () => {
      const medication = {
        name: 'Acetaminophen 500 MG Oral Tablet',
        id: '313782',
      };
      const action = {
        type: types.STORE_USER_CHOSEN_MEDICATION,
        medication,
      };

      const result = reducer(state, action);
      expect(result.userInput).toEqual(medication.name);
      expect(result.medListPhase).toEqual('done');
    });

    it('clears filteredPrescribables when medication is chosen', () => {
      state.filteredPrescribables = [
        { id: '123', name: 'Test Med 1' },
        { id: '456', name: 'Test Med 2' },
      ];
      const medication = {
        name: 'Carisoprodol 250 MG Oral Tablet [Soma]',
        id: '730918',
      };
      const action = {
        type: types.STORE_USER_CHOSEN_MEDICATION,
        medication,
      };

      const result = reducer(state, action);
      expect(result.filteredPrescribables).toEqual([]);
    });
  });

  describe('STORE_USER_CONDITION', () => {
    it('should handle the STORE_USER_CONDITION action', () => {
      const conditionCode = '123';
      const action = {
        type: types.STORE_USER_CONDITION,
        condition: conditionCode,
      };

      const newState = Object.assign({}, state, {
        selectedConditionCode: conditionCode,
      });

      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('STORE_MED_DOSAGE_AMOUNT', () => {
    it('should handle the STORE_MED_DOSAGE_AMOUNT action', () => {
      const amount = 3;
      const frequency = 'daily';
      const action = {
        type: types.STORE_MED_DOSAGE_AMOUNT,
        amount,
        frequency,
      };

      const newState = Object.assign({}, state, {
        medicationInstructions: {
          number: amount,
          frequency,
        },
      });

      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('STORE_DATE', () => {
    it('should handle the STORE_DATE action', () => {
      const range = 'start';
      const date = {
        value: '2018-04-13',
        enabled: true,
      };

      const action = {
        type: types.STORE_DATE,
        range,
        date,
      };

      const newState = Object.assign({}, state, {
        prescriptionDates: {
          ...state.prescriptionDates,
          start: {
            value: date.value,
            enabled: date.enabled,
          },
        },
      });

      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('TOGGLE_DATE', () => {
    it('should handle the TOGGLE_DATE action', () => {
      const range = 'end';
      const action = {
        type: types.TOGGLE_DATE,
        range,
      };

      const newState = Object.assign({}, state, {
        prescriptionDates: {
          ...state.prescriptionDates,
          end: {
            ...state.prescriptionDates.end,
            enabled: !state.prescriptionDates.end.enabled,
          },
        },
      });

      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('TAKE_SUGGESTION', () => {
    it('should handle the TAKE_SUGGESTION action for a "create" suggestion', () => {
      state.fhirResource = {
        medicationCodeableConcept: {
          foo: 'foo',
        },
      };
      let createSuggestion = {
        actions: [
          {
            type: 'create',
            description: 'test',
            resource: {
              medicationCodeableConcept: {
                text: 'new drug',
                coding: [
                  {
                    code: '999',
                  },
                ],
              },
            },
          },
        ],
      };
      const action = {
        type: types.TAKE_SUGGESTION,
        suggestion: createSuggestion,
      };

      const newState = Object.assign({}, state, {
        ...state,
        medListPhase: 'done',
        decisions: {
          ...state.decisions,
          prescribable: {
            name: 'new drug',
            id: '999',
          },
        },
      });
      expect(reducer(state, action)).toEqual(newState);
    });

    it('should handle the TAKE_SUGGESTION action for a "delete" suggestion', () => {
      const suggestion = {
        actions: [
          {
            type: 'delete',
            description: 'test',
          },
        ],
      };
      const action = {
        type: types.TAKE_SUGGESTION,
        suggestion,
      };

      const newState = Object.assign({}, state, {
        ...state,
        medListPhase: 'ingredient',
        options: {
          ingredient: [],
          components: [],
          prescribable: [],
        },
        decisions: {
          ingredient: null,
          components: null,
          prescribable: null,
        },
      });

      expect(reducer(state, action)).toEqual(newState);
    });
  });

  describe('Pass-through Actions', () => {
    it('should return state if an action should pass through this reducer without change to state', () => {
      const action = { type: 'SOME_OTHER_ACTION' };
      expect(reducer(state, action)).toEqual(state);
    });
  });

  describe('createFhirResource', () => {
    beforeEach(() => {
      state.medListPhase = 'done';
      state.decisions = {
        ...state.decisions,
        prescribable: {
          name: 'Carisoprodol 250 MG Oral Tablet [Soma]',
          id: '730918',
        },
      };
      // Set supplyDuration to 1 for these tests to match expected values
      state.dispenseRequest.supplyDuration = 1;
    });


    it('creates MedicationOrder for DSTU2', () => {
      const patientId = 'patient-123';
      const fhirVersion = '1.0.2';

      const fhirResource = {
        resourceType: 'MedicationOrder',
        id: 'order-123',
        dateWritten: moment().format('YYYY-MM-DD'),
        status: 'draft',
        intent: 'order',
        category: {
          coding: [
            {
              code: 'community',
              system: 'http://terminology.hl7.org/CodeSystem/medicationrequest-category',
            }
          ]
        },
        patient: {
          reference: `Patient/${patientId}`,
        },
        medicationCodeableConcept: {
          coding: [
            {
              system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
              code: '730918',
              display: 'Carisoprodol 250 MG Oral Tablet [Soma]'
            }
          ],
          text: 'Carisoprodol 250 MG Oral Tablet [Soma]'
        },
        dispenseRequest: {
          expectedSupplyDuration: {
            code: 'd',
            system: 'http://unitsofmeasure.org',
            unit: 'days',
            value: 1,
          }
        },
        dosageInstruction: [
          {
            doseQuantity: {
              value: 1,
              system: 'http://unitsofmeasure.org',
              code: '{pill}'
            },
            timing: {
              repeat: {
                frequency: 1,
                period: 1,
                periodUnits: 'd',
              }
            }
          }
        ],
      };

      expect(createFhirResource(fhirVersion, patientId, state)).toEqual(fhirResource);
    });

    it('creates MedicationRequest for STU3', () => {
      const patientId = 'patient-123';
      const fhirVersion = '3.0.1';

      const fhirResource = {
        resourceType: 'MedicationRequest',
        id: 'request-123',
        authoredOn: moment().format('YYYY-MM-DD'),
        status: 'draft',
        intent: 'order',
        category: {
          coding: [
            {
              code: 'community',
              system: 'http://terminology.hl7.org/CodeSystem/medicationrequest-category',
            }
          ]
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        medicationCodeableConcept: {
          coding: [
            {
              system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
              code: '730918',
              display: 'Carisoprodol 250 MG Oral Tablet [Soma]'
            }
          ],
          text: 'Carisoprodol 250 MG Oral Tablet [Soma]'
        },
        dispenseRequest: {
          expectedSupplyDuration: {
            code: 'd',
            system: 'http://unitsofmeasure.org',
            unit: 'days',
            value: 1,
          }
        },
        dosageInstruction: [
          {
            doseQuantity: {
              value: 1,
              system: 'http://unitsofmeasure.org',
              code: '{pill}'
            },
            timing: {
              repeat: {
                frequency: 1,
                period: 1,
                periodUnit: 'd',
              }
            }
          }
        ],
      };

      expect(createFhirResource(fhirVersion, patientId, state)).toEqual(fhirResource);
    });

    it('creates MedicationRequest for R4', () => {
      const patientId = 'patient-123';
      const fhirVersion = '4.0.0';

      const fhirResource = {
        resourceType: 'MedicationRequest',
        id: 'request-123',
        authoredOn: moment().format('YYYY-MM-DD'),
        status: 'draft',
        intent: 'order',
        category: {
          coding: [
            {
              code: 'community',
              system: 'http://terminology.hl7.org/CodeSystem/medicationrequest-category',
            }
          ]
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        medicationCodeableConcept: {
          coding: [
            {
              system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
              code: '730918',
              display: 'Carisoprodol 250 MG Oral Tablet [Soma]'
            }
          ],
          text: 'Carisoprodol 250 MG Oral Tablet [Soma]'
        },
        dispenseRequest: {
          expectedSupplyDuration: {
            code: 'd',
            system: 'http://unitsofmeasure.org',
            unit: 'days',
            value: 1,
          }
        },
        dosageInstruction: [
          {
            doseAndRate: [
              {
                doseQuantity: {
                  value: 1,
                  system: 'http://unitsofmeasure.org',
                  code: '{pill}'
                }
              }
            ],
            timing: {
              repeat: {
                frequency: 1,
                period: 1,
                periodUnit: 'd',
              }
            }
          }
        ],
      };

      expect(createFhirResource(fhirVersion, patientId, state)).toEqual(fhirResource);
    });
  });
});
