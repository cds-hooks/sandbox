import React from 'react';
import { shallow } from 'enzyme';
import BaseEntryBody from '../../../src/components/BaseEntryBody/base-entry-body';

describe('BaseEntryBody component', () => {
  
  let wrapper;
  let currentFhirServer = 'fhir-example.com';
  let formFieldLabel;
  let shouldDisplayError;
  let errorMessage;
  let placeholderText;
  let inputOnChange;
  let inputName;

  beforeEach(() => {
    formFieldLabel = 'example field label';
    shouldDisplayError = false;
    errorMessage = '';
    placeholderText = 'example placeholder text';
    inputOnChange = jest.fn();
    inputName = 'input-name-field';
    wrapper = shallow(<BaseEntryBody currentFhirServer={currentFhirServer} 
      formFieldLabel={formFieldLabel} 
      shouldDisplayError={shouldDisplayError} 
      errorMessage={errorMessage} 
      placeholderText={placeholderText} 
      inputOnChange={inputOnChange} 
      inputName={inputName} />);
  });

  it('should render relevant child components', () => {
    expect(wrapper.find('ForwardRef(Typography)')).toHaveLength(2);
    expect(wrapper.find('ForwardRef(TextField)')).toHaveLength(1);
  });

  it('should call onChange method when input is changed', () => {
    wrapper.find('ForwardRef(TextField)').simulate('change', {'target': {'value': 'test'}});
    expect(inputOnChange).toHaveBeenCalled();
  });

  it('should not render text displaying the current fhir server if the prop is not passed in', () => {
    wrapper = shallow(<BaseEntryBody formFieldLabel={formFieldLabel}
      shouldDisplayError={shouldDisplayError}
      errorMessage={errorMessage}
      placeholderText={placeholderText}
      inputOnChange={inputOnChange}
      inputName={inputName} />);

    expect(wrapper.find('ForwardRef(Typography)').length).toEqual(0);
  });
});
