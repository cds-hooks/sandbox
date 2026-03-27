import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

let mockDiscoveryFn = jest.fn(() => Promise.resolve(1));

jest.mock('../../../src/retrieve-data-helpers/discovery-services-retrieval', () => {
  return (...args) => mockDiscoveryFn(...args);
});

import ServicesEntryView from '../../../src/components/ServicesEntry/services-entry';

describe('ServicesEntry component', () => {
  console.error = jest.fn();

  function renderWithTheme(ui, options) {
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>, options);
  }

  beforeEach(() => {
    mockDiscoveryFn = jest.fn(() => Promise.resolve(1));
  });

  it('dialog closes when isOpen prop changes to false via rerender', () => {
    const { unmount } = renderWithTheme(<ServicesEntryView isOpen={true} />);
    expect(screen.getByText('Add CDS Services')).toBeDefined();
    unmount();
    // Render with isOpen=false and verify dialog is not shown
    renderWithTheme(<ServicesEntryView isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('dialog opens when isOpen prop changes to true via rerender', () => {
    const { rerender } = renderWithTheme(<ServicesEntryView isOpen={false} />);
    expect(screen.queryByText('Add CDS Services')).toBeNull();
    rerender(<ThemeProvider theme={theme}><ServicesEntryView isOpen={true} /></ThemeProvider>);
    expect(screen.getByText('Add CDS Services')).toBeDefined();
  });

  it('handles closing the modal via the Cancel button', async () => {
    const closePromptSpy = jest.fn();
    renderWithTheme(<ServicesEntryView isOpen={true} closePrompt={closePromptSpy} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(closePromptSpy).toHaveBeenCalled();
  });

  describe('User input', () => {
    const enterInputAndSave = (input) => {
      const textField = screen.getByLabelText('Enter discovery endpoint url *');
      fireEvent.change(textField, { target: { value: input } });
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
    };

    it('displays an error if input is empty', async () => {
      mockDiscoveryFn = jest.fn(() => new Promise(() => {}));
      renderWithTheme(<ServicesEntryView isOpen={true} />);
      enterInputAndSave('');
      await waitFor(() => {
        expect(screen.getByText('Enter a valid discovery endpoint')).toBeDefined();
      });
    });

    it('displays an error message if retrieving discovery endpoint fails', async () => {
      mockDiscoveryFn = jest.fn(() => { throw new Error(1); });
      renderWithTheme(<ServicesEntryView isOpen={true} />);
      enterInputAndSave('test');
      await waitFor(() => {
        expect(screen.getByText('Failed to connect to the discovery endpoint. See console for details.')).toBeDefined();
      });
    });

    it('closes the modal, resolves passed in prop promise if applicable, and closes prompt if possible', async () => {
      const closePromptSpy = jest.fn();
      renderWithTheme(<ServicesEntryView isOpen={true} closePrompt={closePromptSpy} />);
      const textField = screen.getByLabelText('Enter discovery endpoint url *');
      fireEvent.change(textField, { target: { value: 'https://test.com' } });
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(closePromptSpy).toHaveBeenCalled();
      });
      expect(screen.queryByText('Enter a valid discovery endpoint')).toBeNull();
    });
  });
});
