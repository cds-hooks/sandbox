import React from 'react';
import { render, screen } from '@testing-library/react';
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
      render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      // No FHIR server text should be present
      expect(screen.queryByText('Current FHIR server')).toBeNull();
      // FormControl should be rendered with the label
      expect(screen.getByText('Select a Patient')).toBeInTheDocument();
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
      render(
        <PatientSelect
          formFieldLabel={label}
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it('renders with FormControl component', () => {
      render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      // FormControl renders with the label and required marker
      expect(screen.getByText('Select a Patient')).toBeInTheDocument();
    });

    it('renders with required FormLabel', () => {
      const placeholder = 'Start typing to search...';
      render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          placeholderText={placeholder}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      // MUI required FormLabel renders with asterisk text
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('does not display error message when shouldDisplayError is false', () => {
      render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          errorMessage="An error occurred"
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(screen.queryByText('An error occurred')).toBeNull();
    });

    it('displays error message when shouldDisplayError is true', () => {
      const errorMsg = 'Please select a valid patient';
      render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError
          errorMessage={errorMsg}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });

  describe('patient list handling', () => {
    it('renders with provided patient list', () => {
      render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(screen.getByText('Select a Patient')).toBeInTheDocument();
    });

    it('renders with empty patient list', () => {
      render(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={[]}
        />,
      );

      expect(screen.getByText('Select a Patient')).toBeInTheDocument();
    });
  });
});
