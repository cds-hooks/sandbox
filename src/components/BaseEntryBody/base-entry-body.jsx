import React from 'react';
import PropTypes from 'prop-types';
import Text from 'terra-text';
import Field from 'terra-form-field';
import Input from 'terra-form-input';
import SelectField from 'terra-form/lib/SelectField';

import styles from './base-entry-body.css';

const propTypes = {
  /**
   * If the modal needs to present the current FHIR server at the top, pass this prop in
   */
  currentFhirServer: PropTypes.string,
  /**
   * The field label for the Field component (i.e. "Change Patient")
   */
  formFieldLabel: PropTypes.string.isRequired,
  /**
   * A boolean flag to display an error if needed on the Field component
   */
  shouldDisplayError: PropTypes.bool.isRequired,
  /**
   * If a error needs to be displayed in the Field component, accompany it with a message
   */
  errorMessage: PropTypes.string,
  /**
   * If the Input component needs placeholder text or the defaultValue of Select component (usually to help the user with example values), pass this prop in
   */
  placeholderText: PropTypes.string,
  /**
   * If the value in the Input/Select component changes (i.e user adds text or changes the selection), pass in a function callback to handle the text
   */
  inputOnChange: PropTypes.func.isRequired,
  /**
   * The name attribute for the Input/Select component
   */
  inputName: PropTypes.string,
  /**
   * Array of options to be displayed for selection. If this prop is not provided, a textfield input is displayed instead of a select component
   */
  selectOptions: PropTypes.arrayOf(PropTypes.shape({
    display: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  })),
};

/**
 * BaseEntryBody (functional component) serves as the base UI inside modal interactions like "Change FHIR Server" or "Change Patient".
 * It contains a Field for displaying any field text for an associated input (i.e. "Enter a Patient ID), and an Input for
 * allowing users to input text below its associated Field. Additionally, if relevant, the modal may present Text at the top which
 * displays the current FHIR server in context (useful for "Change Patient" and "Change FHIR Server" modals).
 *
 * How to use: Use this component if a modal needs to have some base UI for allowing a user to input text in an Input field, given some
 * Field text (i.e. "Enter a FHIR Server URL")
 *
 */
const BaseEntryBody = ({
  currentFhirServer, formFieldLabel, shouldDisplayError,
  errorMessage, placeholderText, inputOnChange, inputName, selectOptions,
}) => {
  let fhirServerDisplay;
  if (currentFhirServer) {
    fhirServerDisplay = (
      <div>
        <Text weight={400} fontSize={16}>Current FHIR server</Text><br />
        <Text weight={200} fontSize={14}>{currentFhirServer}</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {fhirServerDisplay}
      <div className={styles['vertical-separation']}>
        <Field
          label={formFieldLabel}
          isInvalid={shouldDisplayError}
          error={errorMessage}
          required
        > {selectOptions ?
            (<SelectField
              name={inputName}
              defaultValue={placeholderText}
              onChange={inputOnChange}
              options={selectOptions}
              required
            />) :
            (<Input
              name={inputName}
              placeholder={placeholderText}
              onChange={inputOnChange}
              required
            />)
        }
        </Field>
      </div>
    </div>
  );
};

BaseEntryBody.propTypes = propTypes;

export default BaseEntryBody;
