import React from 'react';
import { render } from '@testing-library/react';
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

  describe('rendering', () => {
    it('renders without FHIR server display when currentFhirServer is not provided', () => {
      const { container, queryByText } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      // No FHIR server text should be present
      expect(queryByText('Current FHIR server')).toBeNull();
      // FormControl should be rendered (check for required label)
      expect(container.querySelector('.vertical-separation')).toBeTruthy();
    });

    it('renders with FHIR server display when currentFhirServer is provided', () => {
      const fhirServer = 'http://example.com/fhir';
      const { getByText } = render(
        <PatientSelect
          currentFhirServer={fhirServer}
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(getByText('Current FHIR server')).toBeTruthy();
      expect(getByText(fhirServer)).toBeTruthy();
    });

    it('renders the form field label correctly', () => {
      const label = 'Choose a Patient';
      const { getByText } = render(
        <PatientSelect
          formFieldLabel={label}
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      const formLabel = getByText(label);
      expect(formLabel).toBeTruthy();
    });

    it('renders with FormControl component', () => {
      const { container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      // MUI FormControl with fullWidth renders with MuiFormControl-fullWidth class
      expect(container.querySelector('.MuiFormControl-fullWidth')).toBeTruthy();
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
        />,
      );

      // MUI required FormLabel has an asterisk element
      const asterisk = container.querySelector('.MuiFormLabel-asterisk');
      expect(asterisk).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('does not display error message when shouldDisplayError is false', () => {
      const { container, queryByText } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          errorMessage="An error occurred"
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(queryByText('An error occurred')).toBeNull();
      // FormControl should not have error class
      expect(container.querySelector('.MuiFormControl-root.Mui-error')).toBeNull();
    });

    it('displays error message when shouldDisplayError is true', () => {
      const errorMsg = 'Please select a valid patient';
      const { getByText, container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError
          errorMessage={errorMsg}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(getByText(errorMsg)).toBeTruthy();
      // FormControl should have error class
      expect(container.querySelector('.Mui-error')).toBeTruthy();
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
        />,
      );

      // Component should render without errors
      expect(container.querySelector('.vertical-separation')).toBeTruthy();
    });

    it('renders with empty patient list', () => {
      const { container } = render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={[]}
        />,
      );

      expect(container.querySelector('.vertical-separation')).toBeTruthy();
    });
  });
});
