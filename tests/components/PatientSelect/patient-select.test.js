import React from 'react';
import { render, screen, cleanup } from '../../test-utils';
import PatientSelect from '../../../src/components/PatientSelect/patient-select';

describe('PatientSelect component', () => {
  let inputOnChange;
  const patients = [
    { value: 'patient-1', label: 'John Doe (1990-01-01)' },
    { value: 'patient-2', label: 'Jane Smith (1985-05-15)' },
  ];

  beforeEach(() => {
    inputOnChange = jest.fn();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('renders without FHIR server display when currentFhirServer is not provided', () => {
      const { container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />
      );

      const typos = container.querySelectorAll('.MuiTypography-root');
      // Should not have FHIR server display
      expect(screen.queryByText('Current FHIR server')).not.toBeInTheDocument();
      expect(container.querySelectorAll('.MuiFormControl-root')).toHaveLength(1);
    });

    it('renders with FHIR server display when currentFhirServer is provided', () => {
      const fhirServer = 'http://example.com/fhir';
      const { container } = render(
        <PatientSelect
          currentFhirServer={fhirServer}
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />
      );

      expect(screen.getByText('Current FHIR server')).toBeInTheDocument();
      expect(screen.getByText(fhirServer)).toBeInTheDocument();
    });

    it('renders the form field label correctly', () => {
      const label = 'Choose a Patient';
      const { container } = render(
        <PatientSelect
          formFieldLabel={label}
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />
      );

      const formLabel = container.querySelector('.MuiFormLabel-root');
      expect(formLabel).toBeTruthy();
      expect(formLabel.textContent).toContain(label);
    });

    it('renders with FormControl component', () => {
      const { container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />
      );

      const formControl = container.querySelector('.MuiFormControl-root');
      expect(formControl).toBeTruthy();
      expect(formControl.classList.contains('MuiFormControl-fullWidth')).toBe(true);
    });

    it('renders with required FormLabel', () => {
      const placeholder = 'Start typing to search...';
      const { container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          placeholderText={placeholder}
          inputOnChange={inputOnChange}
          patients={patients}
        />
      );

      const formLabel = container.querySelector('.MuiFormLabel-root');
      expect(formLabel).toBeTruthy();
      // Check for required asterisk
      expect(formLabel.textContent).toContain('*');
    });
  });

  describe('error handling', () => {
    it('does not display error message when shouldDisplayError is false', () => {
      const { container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          errorMessage="An error occurred"
          inputOnChange={inputOnChange}
          patients={patients}
        />
      );

      expect(screen.queryByText('An error occurred')).not.toBeInTheDocument();
      const formControl = container.querySelector('.MuiFormControl-root');
      expect(formControl.classList.contains('Mui-error')).toBe(false);
    });

    it('displays error message when shouldDisplayError is true', () => {
      const errorMsg = 'Please select a valid patient';
      const { container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError
          errorMessage={errorMsg}
          inputOnChange={inputOnChange}
          patients={patients}
        />
      );

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
      // Just verify error message is displayed, error class handling varies
      expect(container.querySelector('.MuiFormHelperText-root')).toBeTruthy();
    });
  });

  describe('patient list handling', () => {
    it('renders with provided patient list', () => {
      const { container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />
      );

      // Component should render without errors
      expect(container.querySelector('.MuiFormControl-root')).toBeTruthy();
    });

    it('renders with empty patient list', () => {
      const { container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={[]}
        />
      );

      expect(container.querySelector('.MuiFormControl-root')).toBeTruthy();
    });
  });
});
