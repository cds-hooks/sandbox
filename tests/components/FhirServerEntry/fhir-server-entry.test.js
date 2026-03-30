import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

let mockMetadataFn = jest.fn();

jest.mock('../../../src/retrieve-data-helpers/fhir-metadata-retrieval', () => {
  return (...args) => mockMetadataFn(...args);
});

import { FhirServerEntry } from '../../../src/components/FhirServerEntry/fhir-server-entry';

describe('FhirServerEntry component', () => {
  let storeState;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  let mockResolve;
  let mockClosePrompt;
  let isEntryRequired;
  let initialError;

  function renderComponent(overrides = {}) {
    const props = {
      currentFhirServer: storeState.fhirServerState.currentFhirServer,
      defaultFhirServer: storeState.fhirServerState.defaultFhirServer,
      resolve: mockResolve,
      isOpen: true,
      isEntryRequired: isEntryRequired,
      initialError: initialError,
      closePrompt: mockClosePrompt,
      ...overrides,
    };
    return render(<ThemeProvider theme={theme}><FhirServerEntry {...props} /></ThemeProvider>);
  }

  beforeEach(() => {
    storeState = {
      fhirServerState: {
        currentFhirServer: 'http://test-fhir.com',
        defaultFhirServer: 'http://default-fhir-server.com',
      },
    };
    mockMetadataFn = jest.fn();
    mockResolve = jest.fn();
    mockClosePrompt = jest.fn();
    initialError = '';
    isEntryRequired = true;
  });

  it('renders the dialog when isOpen is true', () => {
    renderComponent();
    expect(screen.getByText('Change FHIR Server')).toBeInTheDocument();
  });

  it('dialog closes when isOpen prop changes to false via rerender', async () => {
    const { rerender } = renderComponent();
    expect(screen.getByText('Change FHIR Server')).toBeInTheDocument();
    rerender(
      <ThemeProvider theme={theme}>
        <FhirServerEntry
          currentFhirServer={storeState.fhirServerState.currentFhirServer}
          defaultFhirServer={storeState.fhirServerState.defaultFhirServer}
          resolve={mockResolve}
          isOpen={false}
          isEntryRequired={isEntryRequired}
          initialError={initialError}
          closePrompt={mockClosePrompt}
        />
      </ThemeProvider>
    );
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('handles resetting the fhir server and closes the modal', async () => {
    isEntryRequired = false;
    mockMetadataFn = jest.fn(() => Promise.resolve(1));
    renderComponent();
    const resetButton = screen.getByText('Reset to default FHIR server');
    fireEvent.click(resetButton);
    await waitFor(() => {
      expect(mockClosePrompt).toHaveBeenCalled();
      expect(mockResolve).toHaveBeenCalled();
      expect(mockMetadataFn).toHaveBeenCalled();
    });
  });

  it('handles closing the modal via the Cancel button', async () => {
    isEntryRequired = false;
    renderComponent();
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockClosePrompt).toHaveBeenCalled();
  });

  describe('User input', () => {
    const enterInputAndSave = (input) => {
      const textField = screen.getByLabelText('Enter a FHIR Server URL *');
      fireEvent.change(textField, { target: { value: input } });
      const saveButton = screen.getByText('Next');
      fireEvent.click(saveButton);
    };

    it('displays an error if input is empty', async () => {
      mockMetadataFn = jest.fn(() => new Promise(() => {}));
      renderComponent();
      enterInputAndSave('');
      await waitFor(() => {
        expect(screen.getByText('Enter a valid FHIR server base url')).toBeInTheDocument();
      });
    });

    it('displays an error message if retrieving fhir server metadata fails', async () => {
      mockMetadataFn = jest.fn(() => { throw new Error(1); });
      renderComponent();
      enterInputAndSave('test');
      await waitFor(() => {
        expect(screen.getByText('Failed to connect to the FHIR server. See console for details.')).toBeInTheDocument();
      });
    });

    it('displays an error message if input resolves to a 401 error', async () => {
      mockMetadataFn = jest.fn(() => {
        throw Object.assign(new Error('Unauthorized'), {
          response: { status: 401 },
        });
      });
      renderComponent();
      enterInputAndSave('http://secured-fhir-endpoint.com');
      await waitFor(() => {
        expect(screen.getByText('Cannot configure secured FHIR endpoints. Please use an open (unsecured) FHIR endpoint.')).toBeInTheDocument();
      });
    });

    it('closes the modal, resolves passed in prop promise if applicable, and closes prompt if possible', async () => {
      mockMetadataFn = jest.fn(() => { return Promise.resolve(1) });
      renderComponent();
      const textField = screen.getByLabelText('Enter a FHIR Server URL *');
      fireEvent.change(textField, { target: { value: 'test' } });
      const saveButton = screen.getByText('Next');
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(mockClosePrompt).toHaveBeenCalled();
        expect(mockResolve).toHaveBeenCalled();
      });
      // Error message should not be displayed on success
      expect(screen.queryByText('Enter a valid FHIR server base url')).toBeNull();
    });
  });
});
