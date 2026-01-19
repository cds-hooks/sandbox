import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import BaseEntryBody from '../../../src/components/BaseEntryBody/base-entry-body';

describe('BaseEntryBody component', () => {

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
  });

  it('should render relevant child components', () => {
    const { container } = render(<BaseEntryBody
      currentFhirServer={currentFhirServer}
      formFieldLabel={formFieldLabel}
      shouldDisplayError={shouldDisplayError}
      errorMessage={errorMessage}
      placeholderText={placeholderText}
      inputOnChange={inputOnChange}
      inputName={inputName} />);

    // Check for FHIR server display
    expect(screen.getByText('fhir-example.com')).toBeInTheDocument();

    // Check for form field label
    expect(screen.getByLabelText(/example field label/i)).toBeInTheDocument();

    // Check for TextField (input element)
    const input = container.querySelector('input[name="input-name-field"]');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange method when input is changed', () => {
    const { container } = render(<BaseEntryBody
      currentFhirServer={currentFhirServer}
      formFieldLabel={formFieldLabel}
      shouldDisplayError={shouldDisplayError}
      errorMessage={errorMessage}
      placeholderText={placeholderText}
      inputOnChange={inputOnChange}
      inputName={inputName} />);

    const input = container.querySelector('input[name="input-name-field"]');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(inputOnChange).toHaveBeenCalled();
  });

  it('should not render text displaying the current fhir server if the prop is not passed in', () => {
    render(<BaseEntryBody
      formFieldLabel={formFieldLabel}
      shouldDisplayError={shouldDisplayError}
      errorMessage={errorMessage}
      placeholderText={placeholderText}
      inputOnChange={inputOnChange}
      inputName={inputName} />);

    // Should not find the FHIR server text
    expect(screen.queryByText(/fhir-example.com/i)).not.toBeInTheDocument();
  });
});
