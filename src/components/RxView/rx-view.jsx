/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';
import pickBy from 'lodash/pickBy';
import forIn from 'lodash/forIn';
import isEqual from 'lodash/isEqual';

import Field from 'terra-form-field';
import Checkbox from 'terra-form-checkbox';
import Select from 'terra-form-select';
import NumberField from 'terra-form/lib/NumberField';
import Text from 'terra-text';
import Input from 'terra-form-input';
import DatePicker from 'terra-date-picker';
import List from 'terra-list';

import debounce from 'debounce';

import CardList from '../CardList/card-list';
import styles from './rx-view.css';
import callServices from '../../retrieve-data-helpers/service-exchange';
import { storeUserMedInput, storeUserChosenMedication,
  updateFhirMedicationOrder, storeUserCondition,
  storeMedDosageAmount, storeDate, toggleDate } from '../../actions/medication-select-actions';

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
   * URL of the FHIR server in context
   */
  fhirServer: PropTypes.string.isRequired,
  /**
   * FHIR version in context based on the FHIR server
   */
  fhirVersion: PropTypes.string.isRequired,
  /**
   * Hash containing a list of CDS services applicable to this hook
   */
  services: PropTypes.object,
  /**
   * Array of medications a user may choose from at a given moment
   */
  medications: PropTypes.arrayOf(PropTypes.object),
  /**
   * Prescribed medicine chosen by the user for the patient
   */
  prescription: PropTypes.object,
  /**
   * Hash detailing the dosage and frequency of the prescribed medicine
   */
  medicationInstructions: PropTypes.object,
  /**
   * Hash detailing the start/end dates of the prescribed medication
   */
  prescriptionDates: PropTypes.object,
  /**
   * Coding code from the selected Condition resource in context
   */
  selectedConditionCode: PropTypes.string,
  /**
   * FHIR resource of the built-up medication order JSON to put in the context of the request to CDS services
   */
  medicationOrder: PropTypes.object,
  /**
   * Function for storing user input when the medication field changes
   */
  onMedicationChangeInput: PropTypes.func.isRequired,
  /**
   * Function to signal a chosen medication
   */
  chooseMedication: PropTypes.func.isRequired,
  /**
   * Function to signal a chosen condition
   */
  chooseCondition: PropTypes.func.isRequired,
  /**
   * Function to signal a change in the dosage instructions (amount or frequency)
   */
  updateDosageInstructions: PropTypes.func.isRequired,
  /**
   * Function to signal a change in a date (start or end)
   */
  updateDate: PropTypes.func.isRequired,
  /**
   * Function to signal a change in the toggled status of the date (start or end)
   */
  toggleEnabledDate: PropTypes.func.isRequired,
  /**
   * Function to update the FHIR resource for the medications field of the context in a CDS service request
   */
  updateFhirResource: PropTypes.func.isRequired,
};

/**
 * Left-hand side on the mock-EHR view that displays the cards and relevant UI for the order-select hook.
 * The services are not called until a medication is chosen, or a change in prescription is made
 */
export class RxView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /**
       * Value of the input box for medication
       */
      value: '',
      /**
       * Coding code of the Condition chosen from a dropdown list for the patient
       */
      conditionCode: '',
      /**
       * Tracks the dosage amount chosen from the form field
       */
      dosageAmount: 1,
      /**
       * Tracks the dosage frequency chosen from the form field
       */
      dosageFrequency: 'daily',
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

    this.executeRequests = this.executeRequests.bind(this);
    this.changeMedicationInput = this.changeMedicationInput.bind(this);
    this.selectCondition = this.selectCondition.bind(this);
    this.changeDosageAmount = this.changeDosageAmount.bind(this);
    this.changeDosageFrequency = this.changeDosageFrequency.bind(this);
    this.selectStartDate = this.selectStartDate.bind(this);
    this.selectEndDate = this.selectEndDate.bind(this);
    this.toggleEnabledDate = this.toggleEnabledDate.bind(this);
  }

  /**
   * If there is a prescription already chosen (through a value in the query params), update the context in the request
   * and call CDS services
   */
  async componentDidMount() {
    if (this.props.prescription) {
      if (!this.props.medicationOrder) {
        await this.props.updateFhirResource(this.props.fhirVersion, this.props.patient.id);
      }
      this.executeRequests();
    }
  }

  /**
   * Update any incoming values that change for state
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.medicationInstructions.number !== this.state.dosageAmount ||
      nextProps.medicationInstructions.frequency !== this.state.dosageFrequency ||
      nextProps.selectedConditionCode !== this.state.conditionCode ||
      nextProps.prescriptionDates.start.value !== this.state.startRange.value ||
      nextProps.prescriptionDates.end.value !== this.state.endRange.value) {
      this.setState({
        conditionCode: nextProps.selectedConditionCode,
        dosageAmount: nextProps.medicationInstructions.number,
        dosageFrequency: nextProps.medicationInstructions.frequency,
        startRange: {
          enabled: this.state.startRange.enabled,
          value: nextProps.prescriptionDates.start.value,
        },
        endRange: {
          enabled: this.state.endRange.enabled,
          value: nextProps.prescriptionDates.end.value,
        },
      });
    }
  }

  /**
   * If any prop values have changed, update the context data in the request, and call the CDS services
   */
  async componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.prescription, this.props.prescription) ||
        prevProps.patient !== this.props.patient ||
        prevProps.fhirServer !== this.props.fhirServer ||
        !isEqual(prevProps.services, this.props.services) ||
        !isEqual(prevProps.medicationInstructions, this.props.medicationInstructions) ||
        !isEqual(prevProps.prescriptionDates, this.props.prescriptionDates) ||
        prevProps.selectedConditionCode !== this.props.selectedConditionCode) {
      await this.props.updateFhirResource(this.props.fhirVersion, this.props.patient.id);
      if (this.props.prescription) {
        this.executeRequests();
      }
    }
    return null;
  }

  // Note: A second parameter (selected value) is supplied automatically by the Terra onChange function for the Form Select component
  selectCondition(event, value) {
    this.props.chooseCondition(value);
    this.setState({ conditionCode: value });
  }

  changeMedicationInput(event) {
    this.setState({ value: event.target.value });
    debounce(this.props.onMedicationChangeInput(event.target.value), 50);
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

  /**
   * Create the context property that goes in a CDS service request before calling out to the CDS servies
   */
  executeRequests() {
    if (Object.keys(this.props.services).length) {

      const resource = this.props.medicationOrder;
      const selection = resource.resourceType + '/' + resource.id;

      // For each service, call service for request/response exchange
      forIn(this.props.services, (val, key) => {
        const context = [
          {
            key: 'selections',
            value: [selection]
          },
          {
          key: 'draftOrders',
          value: {
            resourceType: 'Bundle',
            entry: [{
              resource: resource,
            }],
          },
        }];
        callServices(key, context);
      });
    }
  }

  render() {
    const name = this.props.patient.name || 'Missing Name';
    const pid = this.props.patient.id || 'Missing Patient ID';

    const isHalfView = this.props.isContextVisible ? styles['half-view'] : '';
    const medicationArray = this.props.medications;

    return (
      <div className={cx(styles['rx-view'], isHalfView)}>
        <h1 className={styles['view-title']}>Rx View</h1>
        <div className={styles['patient-data-text']}>
          <p><strong>Patient: </strong> {name} <strong>ID: </strong> {pid}</p>
        </div>
        <form>
          <Field
            label="Treating"
            labelAttrs={{ className: styles['condition-select'] }}
          >
            <Select name="condition-select" value={this.state.conditionCode} onChange={this.selectCondition}>
              {this.props.patient.conditionsResources.map((c) => {
                const { code } = c.resource.code.coding[0];
                return (
                  <Select.Option
                    key={code}
                    value={code}
                    display={c.resource.code.text}
                  />);
              })}
            </Select>
          </Field>
          <Field
            label="Medication"
            labelAttrs={{ className: styles['medication-field'] }}
          >
            <Input
              name="medication-input"
              value={this.state.value}
              onChange={this.changeMedicationInput}
            />
            <List isDivided>
              {medicationArray.map(med =>
                (<List.Item
                  key={med.id}
                  content={<p>{med.name}</p>}
                  isSelectable
                  onClick={() => { this.props.chooseMedication(med); }}
                />))
              }
            </List>
          </Field>
          {this.props.prescription ? <Text isItalic fontSize={16}>{this.props.prescription.name}</Text> : null}
          <div className={styles['dose-instruction']}>
            <NumberField
              label="Number"
              name="dosage-amount"
              className={styles['dosage-amount']}
              value={this.state.dosageAmount}
              onChange={this.changeDosageAmount}
              max={5}
              min={1}
              step={1}
              isInline
            />
            <Field label="Frequency" isInline>
              <Select name="dosage-frequency" onChange={this.changeDosageFrequency} value={this.state.dosageFrequency}>
                <Select.Option key="daily" value="daily" display="daily" />
                <Select.Option key="twice-daily" value="bid" display="twice daily" />
                <Select.Option key="three-daily" value="tid" display="three times daily" />
                <Select.Option key="four-daily" value="qid" display="four times daily" />
              </Select>
            </Field>
          </div>
          <div className={styles['dosage-timing']}>
            <Field
              label={
                <div>
                  Start Date
                  <Checkbox defaultChecked isInline isLabelHidden labelText="" onChange={e => this.toggleEnabledDate(e, 'start')} />
                </div>}
              isInline
            >
              <DatePicker
                name="start-date"
                selectedDate={this.state.startRange.value}
                onChange={this.selectStartDate}
              />
            </Field>
            <Field
              label={
                <div>
                  End Date
                  <Checkbox defaultChecked isInline isLabelHidden labelText="" onChange={e => this.toggleEnabledDate(e, 'end')} />
                </div>}
              isInline
            >
              <DatePicker
                name="end-date"
                selectedDate={this.state.endRange.value}
                onChange={this.selectEndDate}
              />
            </Field>
          </div>
        </form>
        {Object.keys(this.props.services).length ? <CardList /> : ''}
      </div>
    );
  }
}

RxView.propTypes = propTypes;

const mapStateToProps = (store) => {
  function isValidService(service) {
    return service.hook === 'order-select' && service.enabled;
  }

  return {
    isContextVisible: store.hookState.isContextVisible,
    patient: store.patientState.currentPatient,
    fhirServer: store.fhirServerState.currentFhirServer,
    fhirVersion: store.fhirServerState.fhirVersion,
    services: pickBy(store.cdsServicesState.configuredServices, isValidService),
    medications: store.medicationState.options[store.medicationState.medListPhase] || [],
    prescription: store.medicationState.decisions.prescribable,
    medicationInstructions: store.medicationState.medicationInstructions,
    prescriptionDates: store.medicationState.prescriptionDates,
    selectedConditionCode: store.medicationState.selectedConditionCode,
    medicationOrder: store.medicationState.fhirResource,
  };
};

const mapDispatchToProps = dispatch => (
  {
    onMedicationChangeInput: (input) => {
      dispatch(storeUserMedInput(input));
    },
    chooseMedication: (medication) => {
      dispatch(storeUserChosenMedication(medication));
    },
    chooseCondition: (condition) => {
      dispatch(storeUserCondition(condition));
    },
    updateDosageInstructions: (amount, frequency) => {
      dispatch(storeMedDosageAmount(amount, frequency));
    },
    updateDate: (range, date) => {
      dispatch(storeDate(range, date));
    },
    toggleEnabledDate: (range) => {
      dispatch(toggleDate(range));
    },
    updateFhirResource: (fhirVersion, patientId) => {
      dispatch(updateFhirMedicationOrder(fhirVersion, patientId));
    },
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(RxView);
