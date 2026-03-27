import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import moment from 'moment';

const theme = createTheme();

let mockServiceExchangeFn = jest.fn();

jest.mock('../../../src/retrieve-data-helpers/service-exchange', () => {
  return (...args) => mockServiceExchangeFn(...args);
});

// CardList uses store directly
jest.mock('../../../src/store/store', () => ({
  getState: () => ({}),
  dispatch: jest.fn(),
  subscribe: jest.fn(),
}));

import { RxView } from '../../../src/components/RxView/rx-view';

describe('RxView component', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  window.matchMedia = window.matchMedia || (() => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
  let mockStoreWrapper = configureStore([]);
  let mockStore;

  let patient;
  let condition;
  let fhirServer;
  let services;
  let medListPhase;
  let medications;
  let prescription;
  let medicationInstructions;
  let prescriptionDates;
  let selectedConditionCode;

  let chooseCondition, onMedicationChangeInput, chooseMedication,
  updateDosageInstructions, updateDate, toggleEnabledDate, updateFhirResource, medicationOrder;

  function setup(patient, medListPhase, prescription) {
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
  }

  function renderComponent(propsOverride) {
    const storeState = {
      hookState: { currentHook: 'order-select' },
      patientState: { currentPatient: { name: patient.name, id: patient.id } },
      cdsServicesState: { configuredServices: services },
      serviceExchangeState: { exchanges: {}, hiddenCards: {}, launchLinks: {} },
    };
    mockStore = mockStoreWrapper(storeState);

    const defaultProps = {
      isContextVisible: true,
      patient,
      fhirServer,
      fhirVersion: '3.0.1',
      services,
      hook: 'order-select',
      medListPhase,
      medications,
      prescription,
      onMedicationChangeInput,
      chooseMedication,
      chooseCondition,
      updateDosageInstructions,
      updateDate,
      toggleEnabledDate,
      updateFhirResource,
      medicationOrder,
      medicationInstructions,
      prescriptionDates,
      selectedConditionCode,
      takeSuggestion: jest.fn(),
    };
    const props = { ...defaultProps, ...propsOverride };
    return render(
      <Provider store={mockStore}>
        <ThemeProvider theme={theme}>
          <IntlProvider locale="en">
            <RxView {...props} />
          </IntlProvider>
        </ThemeProvider>
      </Provider>
    );
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
        value: moment('2018-05-18'),
      },
      end: {
        enabled: true,
        value: moment('2019-05-18'),
      },
    };
    selectedConditionCode = 'condition-123';
    medListPhase = 'begin';
    medicationOrder = { resourceType: 'MedicationRequest', id: '123' };
    mockServiceExchangeFn = jest.fn();
    chooseCondition = jest.fn();
    onMedicationChangeInput = jest.fn();
    chooseMedication = jest.fn();
    updateDosageInstructions = jest.fn();
    updateDate = jest.fn();
    toggleEnabledDate = jest.fn();
    updateFhirResource = jest.fn(() => 1);
  });

  it('has default view elements', () => {
    setup(patient, medListPhase, prescription);
    const { container } = renderComponent();
    // PatientBanner
    expect(container.querySelector('.patient-banner-text')).toBeTruthy();
    // Condition select (react-select renders a hidden input with name attribute)
    expect(container.querySelector('[name="condition-input"]')).toBeTruthy();
    // Medication text field
    expect(container.querySelector('[name="medication-input"]')).toBeTruthy();
    // Dosage amount input
    expect(container.querySelector('[name="dosage-amount"]')).toBeTruthy();
    // Dosage frequency select
    expect(container.querySelector('[name="dosage-frequency"]')).toBeTruthy();
  });

  it('allows for choosing a medication', async () => {
    setup(patient, medListPhase, prescription);
    const { container } = renderComponent();
    const medicationInput = container.querySelector('[name="medication-input"]');
    fireEvent.change(medicationInput, { target: { value: 'ingredient med' } });
    // Wait for debounced handler (150ms delay)
    await waitFor(() => {
      expect(onMedicationChangeInput).toHaveBeenCalled();
      expect(onMedicationChangeInput).toHaveBeenCalledWith('ingredient med');
    });
  });

  it('allows for inputting a number for the dosage amount', () => {
    setup(patient, medListPhase, prescription);
    const { container } = renderComponent();
    const dosageAmount = container.querySelector('[name="dosage-amount"]');
    fireEvent.change(dosageAmount, { target: { value: '4' } });
    expect(updateDosageInstructions).toHaveBeenCalledWith(4, 'daily');
    fireEvent.change(dosageAmount, { target: { value: '6' } });
    expect(updateDosageInstructions).toHaveBeenCalledWith(5, 'daily');
    fireEvent.change(dosageAmount, { target: { value: '0' } });
    expect(updateDosageInstructions).toHaveBeenCalledWith(1, 'daily');
  });

  it('allows for choosing dosage frequency', () => {
    setup(patient, medListPhase, prescription);
    const { container } = renderComponent();
    // MUI Select with name="dosage-frequency" renders a hidden input
    const frequencyInput = container.querySelector('[name="dosage-frequency"]');
    // For MUI Select, we need to fire change on the hidden input
    fireEvent.change(frequencyInput, { target: { value: 'tid' } });
    expect(updateDosageInstructions).toHaveBeenCalled();
  });

  it('allows for selecting date ranges', () => {
    setup(patient, medListPhase, prescription);
    const { container } = renderComponent();
    const dateInputs = container.querySelectorAll('input[placeholder="MM/DD/YYYY"]');
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    fireEvent.change(dateInputs[0], { target: { value: '04/13/2018' } });
    expect(updateDate).toHaveBeenCalled();
    fireEvent.change(dateInputs[1], { target: { value: '04/14/2018' } });
    expect(updateDate).toHaveBeenCalledTimes(2);
  });

  it('allows for selecting a condition', () => {
    setup(patient, medListPhase, prescription);
    renderComponent();
    // Open the condition react-select dropdown via keyboard
    const selectInput = document.querySelector('input[id*="react-select"]');
    fireEvent.focus(selectInput);
    fireEvent.keyDown(selectInput, { key: 'ArrowDown' });
    // Select the condition option
    fireEvent.click(screen.getByText('mock condition'));
    expect(chooseCondition).toHaveBeenCalledWith('condition-123');
  });

  it('updates the form fields in the UI if incoming props for those values differ', () => {
    setup(patient, medListPhase, prescription);
    const { container, rerender } = renderComponent();

    // Rerender with updated props
    const newProps = {
      isContextVisible: true,
      patient,
      fhirServer,
      fhirVersion: '3.0.1',
      services,
      hook: 'order-select',
      medListPhase,
      medications,
      prescription,
      onMedicationChangeInput,
      chooseMedication,
      chooseCondition,
      updateDosageInstructions,
      updateDate,
      toggleEnabledDate,
      updateFhirResource,
      medicationOrder,
      medicationInstructions: {
        number: 3,
        frequency: 'bid'
      },
      selectedConditionCode: '123123',
      prescriptionDates: {
        start: {
          value: moment('2018-05-20'),
        },
        end: {
          value: moment('2018-06-01'),
        },
      },
      takeSuggestion: jest.fn(),
    };

    rerender(
      <Provider store={mockStore}>
        <ThemeProvider theme={theme}>
          <IntlProvider locale="en">
            <RxView {...newProps} />
          </IntlProvider>
        </ThemeProvider>
      </Provider>
    );

    // Verify rendered values reflect the updated props
    const dosageAmount = container.querySelector('[name="dosage-amount"]');
    expect(dosageAmount.value).toEqual('3');
  });
});
