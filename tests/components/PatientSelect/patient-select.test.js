import React from 'react';
import { shallow } from 'enzyme';
import PatientSelect from '../../../src/components/PatientSelect/patient-select';

describe('PatientSelect component', () => {
  let component;
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
      component = shallow(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(component.find('ForwardRef(Typography)').length).toEqual(0);
      expect(component.find('ForwardRef(FormControl)').length).toEqual(1);
    });

    it('renders with FHIR server display when currentFhirServer is provided', () => {
      const fhirServer = 'http://example.com/fhir';
      component = shallow(
        <PatientSelect
          currentFhirServer={fhirServer}
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(component.find('ForwardRef(Typography)').length).toEqual(2);
      expect(component.find('ForwardRef(Typography)').at(0).dive().text()).toEqual('Current FHIR server');
      expect(component.find('ForwardRef(Typography)').at(1).dive().text()).toEqual(fhirServer);
    });

    it('renders the form field label correctly', () => {
      const label = 'Choose a Patient';
      component = shallow(
        <PatientSelect
          formFieldLabel={label}
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      const formLabel = component.find('ForwardRef(FormLabel)');
      expect(formLabel.length).toEqual(1);
      expect(formLabel.prop('required')).toBe(true);
    });

    it('renders with FormControl component', () => {
      component = shallow(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(component.find('ForwardRef(FormControl)').length).toEqual(1);
      expect(component.find('ForwardRef(FormControl)').prop('fullWidth')).toBe(true);
    });

    it('renders with required FormLabel', () => {
      const placeholder = 'Start typing to search...';
      component = shallow(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          placeholderText={placeholder}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(component.find('ForwardRef(FormLabel)').length).toEqual(1);
      expect(component.find('ForwardRef(FormLabel)').prop('required')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('does not display error message when shouldDisplayError is false', () => {
      component = shallow(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          errorMessage="An error occurred"
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(component.find('ForwardRef(FormHelperText)').length).toEqual(0);
      expect(component.find('ForwardRef(FormControl)').prop('error')).toEqual(false);
    });

    it('displays error message when shouldDisplayError is true', () => {
      const errorMsg = 'Please select a valid patient';
      component = shallow(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError
          errorMessage={errorMsg}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      expect(component.find('ForwardRef(FormHelperText)').length).toEqual(1);
      expect(component.find('ForwardRef(FormHelperText)').dive().text()).toEqual(errorMsg);
      expect(component.find('ForwardRef(FormControl)').prop('error')).toEqual(true);
    });
  });

  describe('patient list handling', () => {
    it('renders with provided patient list', () => {
      component = shallow(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={patients}
        />,
      );

      // Component should render without errors
      expect(component.find('ForwardRef(FormControl)').length).toEqual(1);
    });

    it('renders with empty patient list', () => {
      component = shallow(
        <PatientSelect
          formFieldLabel="Select a Patient"
          shouldDisplayError={false}
          inputOnChange={inputOnChange}
          patients={[]}
        />,
      );

      expect(component.find('ForwardRef(FormControl)').length).toEqual(1);
    });
  });
});
