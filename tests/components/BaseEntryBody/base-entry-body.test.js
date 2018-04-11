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
    expect(wrapper.find('Text')).toHaveLength(2);
    expect(wrapper.find('Field')).toHaveLength(1);
    expect(wrapper.find('Input')).toHaveLength(1);
  });

  it('should call onChange method when input is changed', () => {
    wrapper.find('Input').simulate('change', {'target': {'value': 'test'}});
    expect(inputOnChange).toHaveBeenCalled();
  });
});
