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
  if (isSTU3OrHigher) {
    resource.intent = 'proposal'; //proposal | plan | order | instance-order
  }

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

const initialState = {
  /**
   * Total list of medications the user may select from
   */
  medications: Object.keys(rxnorm.pillToComponentSets).map((pill) => (
    {
      id: pill,
      name: rxnorm.cuiToName[pill],
    }
  )),
  /**
   * With the rxnorm library of medications, there are three phases to a medication that may be specified:
   * 1) Ingredient (i.e. Tylenol pill)
   * 2) Components (i.e. Acetaminophen 650 MG [Tylenol])
   * 3) Prescribable (i.e. 8 HR Acetaminophen 650 MG Extended Release Oral Tablet [Tylenol])
   * A user may have to drill down to the specific medication if multiple components are encompassed
   * within an ingredient, and posisble multiple prescribables per component. This property should
   * keep track of what stage the medication-selection is in (any of the 3 strings above, or 'begin' and 'done'),
   * in order to get the right rx code
   */
  medListPhase: getPrescribableFromID(getQueryParam('prescribedMedication')) ? 'done' : 'begin',
  /**
   * The input value the user types in for the medication input form
   */
  userInput: '',
  /**
   * This property keeps track of the filtered options that remains face up for the user, in each of the
   * phases of the medication list
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
    supplyDuration: parseInt(getQueryParam('prescribedSupplyDuration'), 10) || 1,
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

const filterSearch = (input) => {
  // Break the user input for medication into an array of strings separated by whitespace and filter out any empty strings
  const inputParts = input.split(/\s+/).filter((x) => x !== '');

  let newIngredients;
  if (inputParts.length === 0) {
    newIngredients = [];
  } else {
    // For each medication in our "database", filter to get an array of medications (max 30) matching the user-input string
    // and sort the medications accordingly by name
    newIngredients = initialState.medications
      .filter((med) => inputParts.map((part) => med.name
        .match(RegExp(`(?:^|\\s)${part}`, 'i')))
        .every((x) => x))
      .sort((b, a) => b.name.length - a.name.length)
      .slice(0, 30)
      .map((med) => ({
        name: med.name.slice(0, -5),
        id: med.id,
      }));
  }
  return newIngredients;
};

// Converts string numbers that contain decimals into Number objects to use for sorting medications
const toNumbers = (medication) => (
  medication.name.match(/(\d*\.?\d*)/g)
    .filter((v) => v.length > 0)
    .map((d) => Number(d))
    .filter((n) => !Number.isNaN(n))
);

const compareArrays = (a, b) => {
  if (a.length === 0 && b.length === 0) {
    return 0;
  }
  if (a.length === 0) {
    return 1;
  }
  if (b.length === 0) {
    return -1;
  }
  if (a[0] < b[0]) {
    return -1;
  }
  if (a[0] > b[0]) {
    return 1;
  }
  return compareArrays(a.slice(1), b.slice(1));
};

const compareDrugNames = (a, b) => (compareArrays(toNumbers(a), toNumbers(b)));

const getMedicationComponentsList = (input) => (
  rxnorm.pillToComponentSets[input.id].map((medSet) => (
    {
      name: medSet.map((id) => rxnorm.cuiToName[id]).join(' / '),
      id: medSet,
    }
  )).sort(compareDrugNames)
);

const getMedicationPrescribableList = (input) => (
  rxnorm.componentSetsToPrescribables[input.id.join(',')].map((medSet) => (
    {
      name: rxnorm.cuiToName[medSet],
      id: medSet,
    }
  )).sort(compareDrugNames)
);

const medicationReducers = (state = initialState, action) => {
  if (action.type) {
    switch (action.type) {
      // Store users input for a medication in store
      case types.STORE_USER_MED_INPUT: {
        return {
          ...state,
          medListPhase: 'ingredient',
          options: {
            ingredient: filterSearch(action.input),
            components: [],
            prescribable: [],
          },
          decisions: {
            ingredient: null,
            components: null,
            prescribable: null,
          },
          userInput: action.input,
        };
      }

      // Store the medication choice the user settled on in Rx View
      case types.STORE_USER_CHOSEN_MEDICATION: {
        if (state.medListPhase === 'ingredient') {
          return {
            ...state,
            medListPhase: 'components',
            decisions: {
              ...state.decisions,
              ingredient: action.medication,
            },
            options: {
              ...state.options,
              components: getMedicationComponentsList(action.medication),
            },
          };
        } if (state.medListPhase === 'components') {
          return {
            ...state,
            medListPhase: 'prescribable',
            decisions: {
              ...state.decisions,
              components: action.medication,
            },
            options: {
              ...state.options,
              prescribable: getMedicationPrescribableList(action.medication),
            },
          };
        } if (state.medListPhase === 'prescribable') {
          return {
            ...state,
            medListPhase: 'done',
            userInput: '',
            decisions: {
              ...state.decisions,
              prescribable: action.medication,
            },
          };
        }
        return state;
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

      default:
        return state;
    }
  }
  return state;
};

export { medicationReducers };
