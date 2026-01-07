/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import forIn from 'lodash/forIn';
import cx from 'classnames';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import MuiSelect from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import MuiButton from '@mui/material/Button';
// import Checkbox from 'terra-form-checkbox';
import Select from 'react-select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';

import debounce from 'debounce';

import cdsExecution from '../../middleware/cds-execution';
import CardList from '../CardList/card-list';
import PatientBanner from '../PatientBanner/patient-banner';
import styles from './rx-sign.css';
import { createFhirResource } from '../../reducers/medication-reducers';

import {
  storeUserMedInput, storeUserChosenMedication,
  storeMedDosageAmount, storeDispenseRequest, storeDate, toggleDate,
  takeSuggestion, signOrder,
} from '../../actions/medication-sign-actions';

import * as types from '../../actions/action-types';

cdsExecution.registerTriggerHandler('rx-sign/order-sign', {
  needExplicitTrigger: types.ORDER_SIGN_BUTTON_PRESS,
  onSystemActions: () => { },
  onMessage: () => { },
  generateContext: (state) => {
    const { fhirVersion } = state.fhirServerState;
    const resource = createFhirResource(fhirVersion, state.patientState.currentPatient.id, state.medicationState);

    return {
      draftOrders: {
        resourceType: 'Bundle',
        entry: [{ resource }],
      },
    };
  },
});

const propTypes = {
  /**
     * Flag to determine if the CDS Developer Panel view is visible
     */
  isContextVisible: PropTypes.bool.isRequired,
  /**
     * Patient resource in context
     */
  patient: PropTypes.object,
  /**
     * Array of medications a user may choose from at a given moment
     */
  medications: PropTypes.arrayOf(PropTypes.object),
  /**
     * Hash detailing the dosage and frequency of the prescribed medicine
     */
  medicationInstructions: PropTypes.object,
  /**
     * Hash detailing the supply duration of the prescribed medicine
     */
  dispenseRequest: PropTypes.object,
  /**
     * Hash detailing the start/end dates of the prescribed medication
     */
  prescriptionDates: PropTypes.object,
  /**
     * Current user input value for the medication field
     */
  userInput: PropTypes.string,
  /**
     * Function for storing user input when the medication field changes
     */
  onMedicationChangeInput: PropTypes.func.isRequired,
  /**
     * Function to signal a chosen medication
     */
  chooseMedication: PropTypes.func.isRequired,
  /**
     * Function to signal a change in the dosage instructions (amount or frequency)
     */
  updateDosageInstructions: PropTypes.func.isRequired,
  /**
     * Function to signal a change in the dispense request (supplyDuration)
     */
  updateDispenseRequest: PropTypes.func.isRequired,
  /**
     * Function to signal a change in a date (start or end)
     */
  updateDate: PropTypes.func.isRequired,
  /**
     * Function to signal a change in the toggled status of the date (start or end)
     */
  toggleEnabledDate: PropTypes.func.isRequired,
  /**
     * Function to signal the selected service to be called
     */
  signOrder: PropTypes.func.isRequired,
  /**
     * Function callback to take a specific suggestion from a card
     */
  takeSuggestion: PropTypes.func.isRequired,
};

/**
 * Left-hand side on the mock-EHR view that displays the cards and relevant UI for the order-select hook.
 * The services are not called until a medication is chosen, or a change in prescription is made
 */
export class RxSign extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /**
         * Value of the input box for medication
         */
      value: '',
      /**
         * Coding display of the Condition chosen from a dropdown list for the patient
         */
      conditionDisplay: '',
      /**
         * Tracks the dosage amount chosen from the form field
         */
      dosageAmount: 1,
      /**
         * Tracks the dosage frequency chosen from the form field
         */
      dosageFrequency: 'daily',
      /**
         * Tracks the supply duration chosen from the form field
         */
      supplyDuration: 30,
      /**
         * Tracks the start date value and toggle of the prescription
         */
      startRange: {
        enabled: true,
        value: undefined,
      },
      /**
         * Tracks the end date value and toggle of the prescription
         */
      endRange: {
        enabled: true,
        value: undefined,
      },
    };

    this.changeMedicationInput = this.changeMedicationInput.bind(this);
    this.selectCondition = this.selectCondition.bind(this);
    this.changeDosageAmount = this.changeDosageAmount.bind(this);
    this.changeDosageFrequency = this.changeDosageFrequency.bind(this);
    this.changeSupplyDuration = this.changeSupplyDuration.bind(this);
    this.selectStartDate = this.selectStartDate.bind(this);
    this.selectEndDate = this.selectEndDate.bind(this);
    this.toggleEnabledDate = this.toggleEnabledDate.bind(this);
    this.signOrder = this.signOrder.bind(this);

    // Create debounced version of the medication input handler
    this.debouncedMedicationInput = debounce((value) => {
      this.props.onMedicationChangeInput(value);
    }, 150);
  }

  /**
     * Update any incoming values that change for state
     */
  static getDerivedStateFromProps(nextProps, prevState) {
    const updates = {};
    let hasUpdates = false;

    if (nextProps.medicationInstructions.number !== prevState.dosageAmount) {
      updates.dosageAmount = nextProps.medicationInstructions.number;
      hasUpdates = true;
    }
    if (nextProps.medicationInstructions.frequency !== prevState.dosageFrequency) {
      updates.dosageFrequency = nextProps.medicationInstructions.frequency;
      hasUpdates = true;
    }
    if (nextProps.dispenseRequest.supplyDuration !== prevState.supplyDuration) {
      updates.supplyDuration = nextProps.dispenseRequest.supplyDuration;
      hasUpdates = true;
    }
    if (nextProps.prescriptionDates.start.value !== prevState.startRange.value) {
      updates.startRange = {
        value: nextProps.prescriptionDates.start.value,
      };
      hasUpdates = true;
    }
    if (nextProps.prescriptionDates.end.value !== prevState.endRange.value) {
      updates.endRange = {
        value: nextProps.prescriptionDates.end.value,
      };
      hasUpdates = true;
    }
    // Sync input value with userInput from Redux state
    if (nextProps.userInput !== prevState.value) {
      updates.value = nextProps.userInput;
      hasUpdates = true;
    }

    return hasUpdates ? updates : null;
  }

  changeMedicationInput(event) {
    const { value } = event.target;
    this.setState({ value });
    this.debouncedMedicationInput(value);
  }

  // Note: A second parameter (selected value) is supplied automatically by the Terra onChange function for the Form Select component
  selectCondition(event) {
    this.props.chooseCondition(event.value);
    this.setState({ conditionDisplay: event.label });
  }

  // Note: Bound the dosage amount to a value between 1 and 5
  changeDosageAmount(event) {
    let transformedNumber = Number(event.target.value) || 1;
    if (transformedNumber > 5) { transformedNumber = 5; }
    if (transformedNumber < 1) { transformedNumber = 1; }
    this.setState({ dosageAmount: transformedNumber });
    this.props.updateDosageInstructions(transformedNumber, this.state.dosageFrequency);
  }

  // Note: A second parameter (selected value) is supplied automatically by the Terra onChange function for the Form Select component
  changeDosageFrequency(event, value) {
    this.setState({ dosageFrequency: value });
    this.props.updateDosageInstructions(this.state.dosageAmount, value);
  }

  changeSupplyDuration(event) {
    const value = Number(event.target.value);
    this.setState({ supplyDuration: value });
    this.props.updateDispenseRequest(value);
  }

  // Note: A second parameter (date value) is supplied automatically by the Terra onChange function for the DatePicker component
  selectStartDate(event, value) {
    const newStartRange = {
      enabled: this.state.startRange.enabled,
      value,
    };
    this.setState({
      startRange: newStartRange,
    });
    this.props.updateDate('start', newStartRange);
  }

  // Note: A second parameter (date value) is supplied automatically by the Terra onChange function for the DatePicker component
  selectEndDate(event, value) {
    const newEndRange = {
      enabled: this.state.endRange.enabled,
      value,
    };
    this.setState({
      endRange: newEndRange,
    });
    this.props.updateDate('end', newEndRange);
  }

  toggleEnabledDate(event, range) {
    this.setState({ [`${range}Range`]: event.target.value });
    this.props.toggleEnabledDate(range);
  }

  signOrder(event) {
    this.props.signOrder(event);
  }

  /**
    *   Create an array of key-value pair objects that React Select component understands
    *   given the Conditions present for the patient
    */
  createDropdownConditions() {
    const conditions = [];
    forIn(this.props.patient.conditionsResources, (c) => {
      const { code } = c.resource.code.coding[0];
      conditions.push({
        value: code,
        label: c.resource.code.text,
      });
    });
    return conditions;
  }

  render() {
    const isHalfView = this.props.isContextVisible ? styles['half-view'] : '';
    const medicationArray = this.props.medications;

    return (
      <div className={cx(styles['rx-sign'], isHalfView)}>
        <h1 className={styles['view-title']}>Rx Sign</h1>
        <PatientBanner />
        <form>
          <FormControl fullWidth margin="normal" className={styles['condition-select']}>
            <FormLabel>Treating</FormLabel>
            <Select
              placeholder={this.state.conditionDisplay}
              value={this.state.conditionDisplay}
              options={this.createDropdownConditions()}
              onChange={this.selectCondition}
            />
          </FormControl>
          <FormControl fullWidth margin="normal" className={styles['medication-field']}>
            <FormLabel>Medication</FormLabel>
            <TextField
              name="medication-input"
              value={this.state.value}
              onChange={this.changeMedicationInput}
              fullWidth
            />
            <List>
              {medicationArray.map((med) => (
                <ListItemButton
                  key={med.id}
                  onClick={() => { this.props.chooseMedication(med); }}
                >
                  {med.name}
                </ListItemButton>
              ))}
            </List>
          </FormControl>
          <div className={styles['dose-instruction']}>
            <TextField
              id="dosage-amount"
              label="Number"
              type="number"
              value={this.state.dosageAmount}
              onChange={this.changeDosageAmount}
              name="dosage-amount"
              size="small"
              sx={{ mr: 2 }}
            />
            <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
              <InputLabel id="dosage-frequency-label">Frequency</InputLabel>
              <MuiSelect
                labelId="dosage-frequency-label"
                id="dosage-frequency"
                name="dosage-frequency"
                label="Frequency"
                onChange={(e) => this.changeDosageFrequency(e, e.target.value)}
                value={this.state.dosageFrequency}
              >
                <MenuItem value="daily">daily</MenuItem>
                <MenuItem value="bid">twice daily</MenuItem>
                <MenuItem value="tid">three times daily</MenuItem>
                <MenuItem value="qid">four times daily</MenuItem>
              </MuiSelect>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="supply-duration-label">Supply Duration</InputLabel>
              <MuiSelect
                labelId="supply-duration-label"
                id="supply-duration"
                name="supply-duration"
                label="Supply Duration"
                onChange={this.changeSupplyDuration}
                value={this.state.supplyDuration}
              >
                <MenuItem value={7}>7 days</MenuItem>
                <MenuItem value={14}>14 days</MenuItem>
                <MenuItem value={30}>30 days</MenuItem>
                <MenuItem value={60}>60 days</MenuItem>
                <MenuItem value={90}>90 days</MenuItem>
              </MuiSelect>
            </FormControl>
          </div>
          <div className={styles['dosage-timing']}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <FormControl sx={{ mr: 2 }}>
                <DatePicker
                  label="Start Date"
                  value={this.state.startRange.value || null}
                  onChange={(newValue) => this.selectStartDate(null, newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </FormControl>
              <FormControl>
                <DatePicker
                  label="End Date"
                  value={this.state.endRange.value || null}
                  onChange={(newValue) => this.selectEndDate(null, newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </FormControl>
            </LocalizationProvider>
          </div>
          <div>
            <MuiButton
              variant="contained"
              size="large"
              onClick={this.signOrder}
              sx={{ mt: 3 }}
            >
              Sign Order
            </MuiButton>
          </div>
        </form>
        <CardList takeSuggestion={this.props.takeSuggestion} />
      </div>
    );
  }
}

RxSign.propTypes = propTypes;

const mapStateToProps = (state) => ({
  isContextVisible: state.hookState.isContextVisible,
  patient: state.patientState.currentPatient,
  medications: state.medicationState.filteredPrescribables || [],
  prescription: state.medicationState.decisions.prescribable,
  medicationInstructions: state.medicationState.medicationInstructions,
  dispenseRequest: state.medicationState.dispenseRequest,
  prescriptionDates: state.medicationState.prescriptionDates,
  userInput: state.medicationState.userInput,
});

const mapDispatchToProps = (dispatch) => (
  {
    onMedicationChangeInput: (input) => {
      dispatch(storeUserMedInput(input));
    },
    chooseMedication: (medication) => {
      dispatch(storeUserChosenMedication(medication));
    },
    updateDosageInstructions: (amount, frequency) => {
      dispatch(storeMedDosageAmount(amount, frequency));
    },
    updateDispenseRequest: (supplyDuration) => {
      dispatch(storeDispenseRequest(supplyDuration));
    },
    updateDate: (range, date) => {
      dispatch(storeDate(range, date));
    },
    toggleEnabledDate: (range) => {
      dispatch(toggleDate(range));
    },
    signOrder: (event) => {
      dispatch(signOrder(event));
    },
    takeSuggestion: (suggestion) => {
      dispatch(takeSuggestion(suggestion));
    },
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(RxSign);
