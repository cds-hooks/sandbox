import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';
import intlContexts from './intl-context-setup';

describe('RxView component', () => {
  console.error = jest.fn();
  window.matchMedia = () => ({ matches: true });
  let RxView;
  let component;
  let renderedComponent;
  let mockSpy;

  let patient;
  let condition;
  let fhirServer;
  let services;
  let medListPhase;
  let medications;
  let prescription;
  let medicationInstructions;
  let prescriptionDates;
  let selectedConditionCode

  let chooseCondition, onMedicationChangeInput, chooseMedication,
  updateDosageInstructions, updateDate, toggleEnabledDate, updateFhirResource, medicationOrder;

  function setup(patient, medListPhase, prescription) {
    jest.setMock('../../../src/retrieve-data-helpers/service-exchange', mockSpy);
    RxView = require('../../../src/components/RxView/rx-view')['RxView'];
    if (medListPhase === 'ingredient') {
      medications = [{
        name: 'ingredient med',
        id: '123',
      }];
    } else if (medListPhase === 'components') {
      medications = [{
        name: 'components med',
        id: '234',
      }];
    } else if (medListPhase === 'prescribable') {
      medications = [{
        name: 'prescribable med',
        id: '345',
      }];
    } else {
      medications = [];
    }
    component = <RxView isContextVisible patient={patient} fhirServer={fhirServer} fhirVersion={'3.0.1'} 
        services={services} hook={'order-select'} medListPhase={medListPhase} 
        medications={medications} prescription={prescription} onMedicationChangeInput={onMedicationChangeInput} 
        chooseMedication={chooseMedication} chooseCondition={chooseCondition} updateDosageInstructions={updateDosageInstructions} 
        updateDate={updateDate} toggleEnabledDate={toggleEnabledDate} updateFhirResource={updateFhirResource}
        medicationOrder={medicationOrder} medicationInstructions={medicationInstructions} prescriptionDates={prescriptionDates}
        selectedConditionCode={selectedConditionCode}  />;
    renderedComponent = shallow(component, intlContexts.shallowContext);
  }

  beforeEach(() => {
    condition = {
      resource: {
        code: {
          text: 'mock condition',
          coding: [
            {
              code: 'condition-123',
            },
          ],
        },
      },
    };
    patient = {
      name: 'Test',
      id: 'test-patient',
      conditionsResources: [condition],
    }
    fhirServer = 'http://fhir.com';
    services = {
      'http://example.com/cds-services/id-1': {
        url: 'http://example.com/cds-services/id-1',
        id: 'id-1',
        hook: 'order-select',
        enabled: true,
      },
    };
    prescription = {
      name: 'prescribable med',
      id: '345',
    };
    medicationInstructions = {
      number: '1',
      frequency: 'daily',
    };
    prescriptionDates = {
      start: {
        enabled: true,
        value: '2018-05-18',
      },
      end: {
        enabled: true,
        value: '2019-05-18',
      },
    };
    selectedConditionCode = 'condition-123';
    medListPhase = 'begin';
    medicationOrder = { resourceType: 'MedicationRequest', id: '123' };
    mockSpy = jest.fn();
    chooseCondition = jest.fn();
    onMedicationChangeInput = jest.fn(); 
    chooseMedication = jest.fn();
    updateDosageInstructions = jest.fn(); 
    updateDate = jest.fn();
    toggleEnabledDate = jest.fn();
    updateFhirResource = jest.fn(() => 1);
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('has default view elements', () => {
    setup(patient, medListPhase, medications, prescription);
    expect(renderedComponent.find('Connect(PatientBanner)').length).toEqual(1);
    expect(renderedComponent.find('[name="condition-input"]').length).toEqual(1);
    expect(renderedComponent.find('[name="medication-input"]').length).toEqual(1);
    expect(renderedComponent.find('List').length).toEqual(0);
    expect(renderedComponent.find('Input').length).toEqual(1);
    expect(renderedComponent.find('[label="Frequency"]').find('[name="dosage-frequency"]').children().length).toEqual(4);
    expect(renderedComponent.find('[label="Start Date"]').exists('DatePicker'));
    expect(renderedComponent.find('[label="End Date"]').exists('DatePicker'));
  });

  it('allows for selecting a condition', () => {
    setup(patient, medListPhase, medications, prescription);
    renderedComponent.find('[name="condition-input"]').simulate('change', { value: 'condition-123', label: 'mock condition' } );
    expect(chooseCondition).toHaveBeenCalled();
    expect(renderedComponent.state('conditionCode')).toEqual('condition-123');
  });

  it('allows for choosing a medication', () => {
    setup(patient, medListPhase, medications, prescription);
    renderedComponent.find('Field').at(1).find('Input').simulate('change', { target: { value: 'ingredient med' } });
    expect(onMedicationChangeInput).toHaveBeenCalled();
  });

  it('allows for inputting a number for the dosage amount', () => {
    setup(patient, medListPhase, medications, prescription);
    renderedComponent.find('InputField').simulate('change', { target: { value: '4' } });
    expect(updateDosageInstructions).toHaveBeenCalledWith(4, 'daily');
    renderedComponent.find('InputField').simulate('change', { target: { value: '6' } });
    expect(updateDosageInstructions).toHaveBeenCalledWith(5, 'daily');
    renderedComponent.find('InputField').simulate('change', { target: { value: '0' } });
    expect(updateDosageInstructions).toHaveBeenCalledWith(1, 'daily');
  });

  it('allows for choosing dosage frequency', () => {
    setup(patient, medListPhase, medications, prescription);
    renderedComponent.find('.dose-instruction').find('Select').simulate('change', { target: { value: 'tid' } });
    expect(updateDosageInstructions).toHaveBeenCalled();
  });

  it('allows for selecting date ranges', () => {
    setup(patient, medListPhase, medications, prescription);
    renderedComponent.find('[name="start-date"]').simulate('change', { target: { value: '2018-04-13' } });
    expect(updateDate).toHaveBeenCalled();
    renderedComponent.find('[name="end-date"]').simulate('change', { target: { value: '2018-04-14' } });
    expect(updateDate).toHaveBeenCalled();
  });

  it('updates the form fields in the UI if incoming props for those values differ', async () => {
    setup(patient, medListPhase, medications, prescription);
    let newComponent = await renderedComponent.setProps({ 
      medicationInstructions: {
        number: 3,
        frequency: 'bid'
      },
      selectedConditionCode: '123123',
      prescriptionDates: {
        start: {
          value: '2018-05-20',
        },
        end: {
          value: '2018-06-01',
        },
      },
    });
    expect(renderedComponent.state('conditionCode')).toEqual('123123');
    expect(renderedComponent.state('dosageAmount')).toEqual(3);
    expect(renderedComponent.state('dosageFrequency')).toEqual('bid');
    expect(renderedComponent.state('startRange')).toEqual({
      value: '2018-05-20',
    });
    expect(renderedComponent.state('endRange')).toEqual({
      value: '2018-06-01',
    });
  });
});
