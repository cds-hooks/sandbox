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
        medicationOrder={medicationOrder} medicationInstructions={medicationInstructions} prescriptionDates={prescriptionDates}  />;
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

  it('contains relevant patient information if patient is in context', () => {
    setup(patient, medListPhase, medications, prescription);
    expect(renderedComponent.find('.patient-data-text').text()).toContain(patient.name);
    expect(renderedComponent.find('.patient-data-text').text()).toContain(patient.id);
  });

  it('has default view elements', () => {
    setup(patient, medListPhase, medications, prescription);
    expect(renderedComponent.find('Field').at(0).find('SelectOption').length).toEqual(1);
    expect(renderedComponent.find('[name="medication-input"]').length).toEqual(1);
    expect(renderedComponent.find('ListItem').length).toEqual(0);
    expect(renderedComponent.find('NumberField').length).toEqual(1);
    expect(renderedComponent.find('[label="Frequency"]').find('SelectOption').length).toEqual(4);
    expect(renderedComponent.find('DatePicker').length).toEqual(2);
  });

  it('allows for selecting a condition', () => {
    setup(patient, medListPhase, medications, prescription);
    renderedComponent.find('Field').at(0).find('Select').simulate('change', { target: { value: 'condition-123' } }, 'condition-123');
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
    renderedComponent.find('NumberField').simulate('change', { target: { value: '4' } });
    expect(updateDosageInstructions).toHaveBeenCalledWith(4, 'daily');
    renderedComponent.find('NumberField').simulate('change', { target: { value: '6' } });
    expect(updateDosageInstructions).toHaveBeenCalledWith(5, 'daily');
    renderedComponent.find('NumberField').simulate('change', { target: { value: '0' } });
    expect(updateDosageInstructions).toHaveBeenCalledWith(1, 'daily');
  });

  it('allows for choosing dosage frequency', () => {
    setup(patient, medListPhase, medications, prescription);
    renderedComponent.find('.dose-instruction').find('Select').simulate('change', { target: { value: 'tid' } });
    expect(updateDosageInstructions).toHaveBeenCalled();
  });

  it('allows for selecting date ranges', () => {
    setup(patient, medListPhase, medications, prescription);
    renderedComponent.find('.dosage-timing').find('DatePicker').at(0).simulate('change', { target: { value: '2018-04-13' } });
    renderedComponent.find('.dosage-timing').find('Field').at(0).dive().find('Checkbox').simulate('change', { target: { value: false } });
    expect(updateDate).toHaveBeenCalled();
    expect(toggleEnabledDate).toHaveBeenCalled();
    renderedComponent.find('.dosage-timing').find('DatePicker').at(1).simulate('change', { target: { value: '2018-04-14' } });
    expect(updateDate).toHaveBeenCalled();
  });

  it('updates the FHIR resource and calls CDS Services if a prescription is selected', async (done) => {
    setup(patient, medListPhase, medications, prescription);
    prescription = {
      name: 'another prescribable med',
      id: '456',
    };
    let newComponent = await renderedComponent.setProps({ prescription: prescription });
    Promise.resolve(newComponent).then(() => {
      expect(mockSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'http://example.com/cds-services/id-1', [{
        key: 'selections',
        value: [
          'MedicationRequest/123'
        ],
      },
      {
        key: 'draftOrders',
        value: {
          resourceType: 'Bundle',
          entry: [{
            resource: medicationOrder,
          }],
        },
      }]);
      done();
    });
  });

  it('updates medication order FHIR resource if a medication was chosen but the FHIR resource was not updated', () => {
    medicationOrder = null;
    setup(patient, medListPhase, medications, prescription);
    expect(updateFhirResource).toHaveBeenCalled();
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
          enabled: true,
        },
        end: {
          value: '2018-06-01',
          enabled: true,
        },
      },
    });
    expect(renderedComponent.state('conditionCode')).toEqual('123123');
    expect(renderedComponent.state('dosageAmount')).toEqual(3);
    expect(renderedComponent.state('dosageFrequency')).toEqual('bid');
    expect(renderedComponent.state('startRange')).toEqual({
      enabled: true,
      value: '2018-05-20',
    });
    expect(renderedComponent.state('endRange')).toEqual({
      enabled: true,
      value: '2018-06-01',
    });
  });
});
