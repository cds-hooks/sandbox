import moment from 'moment';
import queryString from 'query-string';
import compareVersions from 'compare-versions';
import * as types from '../actions/action-types';
import rxnorm from '../assets/medication-list';
import { getConditionCodingFromCode } from './helpers/services-filter';

// Check if there is an associated name with the passed in drug ID to potentially create a prescribable object
const getPrescribableFromID = (id) => {
  const drugName = id ? rxnorm.cuiToName[id] : '';
  if (drugName) {
    return {
      name: drugName,
      id,
    };
  }
  return null;
};

const getQueryParam = (param) => {
  const parsedParams = queryString.parse(window.location.search);
  return parsedParams[param];
};

// Construct the FHIR resource for MedicationRequest/Order from a chosen condition and/or medication
export const createFhirResource = (fhirVersion, patientId, state, patientConditions) => {
  const isSTU3OrHigher = compareVersions(fhirVersion, '3.0.1') >= 0;

  const resource = {
    resourceType: isSTU3OrHigher ? 'MedicationRequest' : 'MedicationOrder',
    id: isSTU3OrHigher ? 'request-123' : 'order-123',
    status: 'draft',
  };

  resource[`${isSTU3OrHigher ? 'subject' : 'patient'}`] = {
    reference: `Patient/${patientId}`,
  };
  resource[`${isSTU3OrHigher ? 'authoredOn' : 'dateWritten'}`] = moment().format('YYYY-MM-DD');

  let startDate;
  let endDate;
  if (state.prescriptionDates.start.value && state.prescriptionDates.start.enabled) {
    startDate = moment(state.prescriptionDates.start.value).format('YYYY-MM-DD');
  }
  if (state.prescriptionDates.end.value && state.prescriptionDates.end.enabled) {
    endDate = moment(state.prescriptionDates.end.value).format('YYYY-MM-DD');
  }

  if (state.decisions.prescribable && state.medListPhase === 'done') {
    const freqs = {
      // Daily
      daily: 1,
      // Bi-Daily
      bid: 2,
      // Three times daily
      tid: 3,
      // Four times daily
      qid: 4,
    };

    if (state.medicationInstructions) {
      const { medicationInstructions } = state;

      const dosage = {
        timing: {
          repeat: {
            frequency: freqs[medicationInstructions.frequency],
            period: 1,
          },
        },
      };

      resource.dosageInstruction = [dosage];

      const doseQuantity = {
        value: medicationInstructions.number,
        system: 'http://unitsofmeasure.org',
        code: '{pill}',
      };

      const isR4OrHigher = compareVersions(fhirVersion, '4.0.0') >= 0;
      if (isR4OrHigher) {
        dosage.doseAndRate = [
          { doseQuantity },
        ];
      } else {
        dosage.doseQuantity = doseQuantity;
      }

      dosage.timing.repeat[`${isSTU3OrHigher ? 'periodUnit' : 'periodUnits'}`] = 'd';
      if (startDate || endDate) {
        dosage.timing.repeat.boundsPeriod = {
          start: startDate,
          end: endDate,
        };
      }
    }

    if (state.dispenseRequest) {
      const { dispenseRequest } = state;

      resource.dispenseRequest = {
        expectedSupplyDuration: {
          value: dispenseRequest.supplyDuration,
          unit: 'days',
          system: 'http://unitsofmeasure.org',
          code: 'd',
        },
      };

      resource.intent = 'order';
      resource.category = {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/medicationrequest-category',
            code: 'community',
          },
        ],
      };
    }

    const med = state.decisions.prescribable;

    resource.medicationCodeableConcept = {
      text: med.name,
      coding: [{
        display: med.name,
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: med.id,
      }],
    };
  }

  if (state.selectedConditionCode) {
    const chosenCondition = getConditionCodingFromCode(patientConditions, state.selectedConditionCode);
    if (chosenCondition && chosenCondition.resource && chosenCondition.resource.code) {
      resource[`${isSTU3OrHigher ? 'reasonCode' : 'reasonCodeableConcept'}`] = chosenCondition.resource.code;
    }
  }
  return resource;
};

// Build a flat list of all prescribable medications for direct search
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

const initialState = {
  /**
   * Flat list of all prescribable medications for direct search
   */
  allPrescribables: buildAllPrescribables(),
  /**
   * Total list of medications the user may select from (kept for backward compatibility)
   */
  medications: Object.keys(rxnorm.pillToComponentSets).map((pill) => (
    {
      id: pill,
      name: rxnorm.cuiToName[pill],
    }
  )),
  /**
   * Medication list phase - simplified to 'begin' or 'done'
   */
  medListPhase: getPrescribableFromID(getQueryParam('prescribedMedication')) ? 'done' : 'begin',
  /**
   * The input value the user types in for the medication input form
   */
  userInput: '',
  /**
   * Filtered list of prescribable medications based on user input
   */
  filteredPrescribables: [],
  /**
   * This property keeps track of the filtered options that remains face up for the user, in each of the
   * phases of the medication list (kept for backward compatibility)
   */
  options: {
    ingredient: [],
    components: [],
    prescribable: [],
  },
  /**
   * The medication the user selects in each of these phases will be stored in this property
   */
  decisions: {
    ingredient: null,
    components: null,
    prescribable: getPrescribableFromID(getQueryParam('prescribedMedication')) || null,
  },
  /**
   * The frequency of the medication the user may modify
   */
  medicationInstructions: {
    number: parseInt(getQueryParam('prescribedInstructionNumber'), 10) || 1,
    frequency: getQueryParam('prescribedInstructionFrequency') || 'daily',
  },
  /**
   * The dispense request information
   */
  dispenseRequest: {
    supplyDuration: parseInt(getQueryParam('prescribedSupplyDuration'), 10) || 30,
  },
  /**
   * The dates and enabled status of the medication start and end dates
   */
  prescriptionDates: {
    start: {
      enabled: true,
      value: getQueryParam('prescribedMedicationStartDate') || undefined,
    },
    end: {
      enabled: true,
      value: getQueryParam('prescribedMedicationEndDate') || undefined,
    },
  },
  /**
   * The code of the Condition the user selects associated with the Patient in context
   */
  selectedConditionCode: getQueryParam('prescribedReason') || '',
};

// Filter prescribable medications based on user input
const filterPrescribables = (input) => {
  const inputParts = input.split(/\s+/).filter((x) => x !== '');

  if (inputParts.length === 0) {
    return [];
  }

  // Search all prescribable medications and return matches (max 30)
  return initialState.allPrescribables
    .filter((med) => inputParts.map((part) => med.name
      .match(RegExp(`(?:^|\\s)${part}`, 'i')))
      .every((x) => x))
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, 30);
};

const medicationReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Store users input for a medication in store
      case types.STORE_USER_MED_INPUT: {
        return {
          ...state,
          userInput: action.input,
          filteredPrescribables: filterPrescribables(action.input),
          decisions: {
            ...state.decisions,
            prescribable: null,
          },
        };
      }

      // Store the medication choice the user settled on in Rx View
      case types.STORE_USER_CHOSEN_MEDICATION: {
        // Direct prescribable selection - simplified workflow
        return {
          ...state,
          medListPhase: 'done',
          userInput: action.medication.name,
          filteredPrescribables: [],
          decisions: {
            ...state.decisions,
            prescribable: action.medication,
          },
        };
      }

      // Stores the user-chosen condition from the list of conditions for the current patient
      case types.STORE_USER_CONDITION: {
        return { ...state, selectedConditionCode: action.condition };
      }

      // Stores the user-defined dosage amount and frequency
      case types.STORE_MED_DOSAGE_AMOUNT: {
        return {
          ...state,
          medicationInstructions: {
            number: action.amount,
            frequency: action.frequency,
          },
        };
      }

      // Stores the user-defined dispense request
      case types.STORE_DISPENSE_REQUEST: {
        return {
          ...state,
          dispenseRequest: {
            supplyDuration: action.supplyDuration,
          },
        };
      }

      // Stores the user-defined dates for the prescription (start and end)
      case types.STORE_DATE: {
        return {
          ...state,
          prescriptionDates: {
            ...state.prescriptionDates,
            [`${action.range}`]: {
              enabled: action.date.enabled,
              value: action.date.value,
            },
          },
        };
      }

      // Toggles the date feature (start and/or end) for the prescription
      case types.TOGGLE_DATE: {
        return {
          ...state,
          prescriptionDates: {
            ...state.prescriptionDates,
            [`${action.range}`]: {
              value: state.prescriptionDates[`${action.range}`].value,
              enabled: !state.prescriptionDates[`${action.range}`].enabled,
            },
          },
        };
      }

      // Updates the dynamically built FHIR Medication Order resource with a suggestion the user takes from a response card
      case types.TAKE_SUGGESTION: {
        if (action.suggestion && action.suggestion.actions) {
          const { actions } = action.suggestion;
          for (let i = 0; i < actions.length; i += 1) {
            if (actions[i].type) {
              if (!actions[i].description) {
                console.error('Missing required "description" field in suggestion action', actions[i]);
              }
              if (actions[i].type === 'create' || actions[i].type === 'update') {
                // Updating internal medication if new medication comes through suggestion
                if (actions[i].resource && actions[i].resource.medicationCodeableConcept) {
                  const newMedication = actions[i].resource.medicationCodeableConcept;
                  if (newMedication.text && newMedication.coding && newMedication.coding[0] && newMedication.coding[0].code) {
                    return {
                      ...state,
                      medListPhase: 'done',
                      decisions: {
                        ...state.decisions,
                        prescribable: {
                          name: newMedication.text,
                          id: newMedication.coding[0].code,
                        },
                      },
                    };
                  }
                  console.warn('Suggested resource does not have text and/or coding code in medicationCodeableConcept property', newMedication);
                } else if (!actions[i].resource) {
                  console.warn('Could not find an accompanying resource for the suggestion', actions[i]);
                } else if (!actions[i].resource.medicationCodeableConcept) {
                  console.warn('Suggested resource does not have a medicationCodeableConcept', actions[i].resource);
                }
              } else if (actions[i].type === 'delete') {
                return {
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
                };
              }
            } else {
              console.error('Missing required "type" field in suggestion action', actions[i]);
              if (!actions[i].description) {
                console.error('Missing required "description" field in suggestion action', actions[i]);
              }
            }
          }
        }
        return state;
      }

      // Clear medication form state when a new patient is selected
      case types.GET_PATIENT_SUCCESS: {
        return {
          ...state,
          medListPhase: 'begin',
          userInput: '',
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
          medicationInstructions: {
            number: 1,
            frequency: 'daily',
          },
          dispenseRequest: {
            supplyDuration: 30,
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
      }

      default:
        return state;
    }
  }
  return state;
};

export { medicationReducers };
