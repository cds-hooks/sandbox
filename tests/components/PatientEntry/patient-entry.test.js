import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

let mockPatientFn = jest.fn();
let mockAllPatientFn = jest.fn(() => Promise.resolve([]));

jest.mock('../../../src/retrieve-data-helpers/patient-retrieval', () => {
  return (...args) => mockPatientFn(...args);
});

jest.mock('../../../src/retrieve-data-helpers/all-patient-retrieval', () => {
  return (...args) => mockAllPatientFn(...args);
});

import { PatientEntry } from '../../../src/components/PatientEntry/patient-entry';

describe('PatientEntry component', () => {
  let storeState;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  let mockResolve;
  let mockClosePrompt;
  let isEntryRequired;

  function renderComponent(overrides = {}) {
    const props = {
      currentFhirServer: storeState.fhirServerState.currentFhirServer,
      currentPatientId: storeState.patientState.currentPatient.id,
      resolve: mockResolve,
      isOpen: true,
      isEntryRequired: isEntryRequired,
      closePrompt: mockClosePrompt,
      ...overrides,
    };
    return render(<ThemeProvider theme={theme}><PatientEntry {...props} /></ThemeProvider>);
  }

  beforeEach(() => {
    storeState = {
      patientState: {
        currentPatient: { id: 'test-1' }
      },
      fhirServerState: { currentFhirServer: 'http://test-fhir.com' },
      patients: ["test-1", "test-2", "test-3"],
    };
    mockPatientFn = jest.fn();
    mockAllPatientFn = jest.fn(() => Promise.resolve([]));
    mockResolve = jest.fn();
    mockClosePrompt = jest.fn();
    isEntryRequired = true;
  });

  it('renders the dialog when isOpen is true', () => {
    renderComponent();
    expect(screen.getByText('Change Patient')).toBeDefined();
  });

  it('dialog closes when isOpen prop changes to false via rerender', () => {
    const { unmount } = renderComponent();
    expect(screen.getByText('Change Patient')).toBeDefined();
    unmount();
    renderComponent({ isOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('handles closing the modal via the Cancel button', async () => {
    isEntryRequired = false;
    renderComponent();
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockClosePrompt).toHaveBeenCalled();
  });

  it('shows Cancel and Save buttons when entry is not required', () => {
    isEntryRequired = false;
    renderComponent();
    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Save')).toBeDefined();
  });

  it('does not show Cancel button when entry is required', () => {
    isEntryRequired = true;
    renderComponent();
    expect(screen.queryByText('Cancel')).toBeNull();
    expect(screen.getByText('Save')).toBeDefined();
  });

  describe('User input', () => {
    it('displays an error if input is empty and Save is clicked', async () => {
      renderComponent();
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(screen.getByText('Enter a valid patient ID')).toBeDefined();
      });
    });

    it('displays an error message if retrieving patient fails', async () => {
      mockPatientFn = jest.fn(() => { throw new Error(1); });
      renderComponent();
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(screen.getByText('Enter a valid patient ID')).toBeDefined();
      });
    });
  });
});
