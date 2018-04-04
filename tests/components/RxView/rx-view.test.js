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

  let chooseCondition, onMedicationChangeInput, chooseMedication,
  updateDosageInstructions, updateDate, toggleEnabledDate;

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
        services={services} hook={'medication-prescribe'} medListPhase={medListPhase} 
        medications={medications} prescription={prescription} onMedicationChangeInput={onMedicationChangeInput} 
        chooseMedication={chooseMedication} chooseCondition={chooseCondition} updateDosageInstructions={updateDosageInstructions} 
        updateDate={updateDate} toggleEnabledDate={toggleEnabledDate} />;
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
        hook: 'medication-prescribe',
        enabled: true,
      },
    };
    prescription = {
      name: 'prescribable med',
      id: '345',
    };
    medListPhase = 'begin';
    mockSpy = jest.fn();
    chooseCondition = jest.fn();
    onMedicationChangeInput = jest.fn(); 
    chooseMedication = jest.fn();
    updateDosageInstructions = jest.fn(); 
    updateDate = jest.fn();
    toggleEnabledDate = jest.fn();
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
    renderedComponent.find('Field').at(0).find('Select').simulate('change', { target: { value: 'condition-123' } });
    expect(chooseCondition).toHaveBeenCalled();
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
    renderedComponent.find('.dosage-timing').find('Field').at(0).dive().find('Checkbox').simulate('change', { target: { checked: false } });
    expect(updateDate).toHaveBeenCalled();
    expect(toggleEnabledDate).toHaveBeenCalled();
    renderedComponent.find('.dosage-timing').find('DatePicker').at(1).simulate('change', { target: { value: '2018-04-14' } });
    expect(updateDate).toHaveBeenCalled();
  });
});
