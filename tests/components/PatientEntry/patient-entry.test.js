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
    expect(screen.getByText('Change Patient')).toBeInTheDocument();
  });

  it('dialog closes when isOpen prop changes to false via rerender', async () => {
    const { rerender } = renderComponent();
    expect(screen.getByText('Change Patient')).toBeInTheDocument();
    rerender(
      <ThemeProvider theme={theme}>
        <PatientEntry
          currentFhirServer={storeState.fhirServerState.currentFhirServer}
          currentPatientId={storeState.patientState.currentPatient.id}
          resolve={mockResolve}
          isOpen={false}
          isEntryRequired={isEntryRequired}
          closePrompt={mockClosePrompt}
        />
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
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
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('does not show Cancel button when entry is required', () => {
    isEntryRequired = true;
    renderComponent();
    expect(screen.queryByText('Cancel')).toBeNull();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  describe('User input', () => {
    it('displays an error if input is empty and Save is clicked', async () => {
      renderComponent();
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(screen.getByText('Enter a valid patient ID')).toBeInTheDocument();
      });
    });

    it('displays an error message if retrieving patient fails', async () => {
      mockPatientFn = jest.fn(() => { throw new Error(1); });
      renderComponent();
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(screen.getByText('Enter a valid patient ID')).toBeInTheDocument();
      });
    });

    it('closes the modal and resolves when patient retrieval succeeds', async () => {
      mockPatientFn = jest.fn(() => Promise.resolve(1));
      mockAllPatientFn = jest.fn(() => Promise.resolve([
        { id: 'patient-1', name: 'John Doe', dob: '1990-01-01' },
      ]));
      const { container } = renderComponent();

      // Wait for componentDidMount to populate the patient list
      await waitFor(() => {
        expect(mockAllPatientFn).toHaveBeenCalled();
      });

      // Open react-select dropdown and pick the first option
      const selectInput = document.querySelector('input');
      fireEvent.focus(selectInput);
      fireEvent.keyDown(selectInput, { key: 'ArrowDown' });
      fireEvent.keyDown(selectInput, { key: 'Enter' });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(mockPatientFn).toHaveBeenCalledWith('patient-1');
        expect(mockResolve).toHaveBeenCalled();
        expect(mockClosePrompt).toHaveBeenCalled();
      });
    });
  });
});
