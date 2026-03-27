import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    const { container } = render(<BaseEntryBody currentFhirServer={currentFhirServer}
      formFieldLabel={formFieldLabel}
      shouldDisplayError={shouldDisplayError}
      errorMessage={errorMessage}
      placeholderText={placeholderText}
      inputOnChange={inputOnChange}
      inputName={inputName} />);
    expect(screen.getByText('Current FHIR server')).toBeInTheDocument();
    expect(screen.getByText(currentFhirServer)).toBeInTheDocument();
    expect(container.querySelector('input[name="input-name-field"]')).toBeInTheDocument();
  });

  it('should call onChange method when input is changed', () => {
    const { container } = render(<BaseEntryBody currentFhirServer={currentFhirServer}
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
    render(<BaseEntryBody formFieldLabel={formFieldLabel}
      shouldDisplayError={shouldDisplayError}
      errorMessage={errorMessage}
      placeholderText={placeholderText}
      inputOnChange={inputOnChange}
      inputName={inputName} />);
    expect(screen.queryByText('Current FHIR server')).not.toBeInTheDocument();
    expect(screen.queryByText(currentFhirServer)).not.toBeInTheDocument();
  });
});
