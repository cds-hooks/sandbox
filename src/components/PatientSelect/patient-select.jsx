import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Select from 'react-select';

import styles from './patient-select.css';

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
   * If the Input component needs placeholder text (usually to help the user with example values), pass this prop in
   */
  placeholderText: PropTypes.string,
  /**
   * If the value in the Input component changes (i.e user selects option), pass in a function callback to handle the text
   */
  inputOnChange: PropTypes.func.isRequired,
  /**
   * A list of the Patient identifiers that populate the select options
   */
  patients: PropTypes.instanceOf(Array).isRequired,
};

/**
 * PatientSelect (functional component) serves as the base UI inside modal interactions like "Change Patient".
 * It contains a Field for selecting an associated input (i.e. "Select a Patient"), and an Input for
 * allowing users to input text below its associated Field. Additionally, if relevant, the modal may present Text at the top which
 * displays the current FHIR server in context (useful for "Select a Patient" modals).
 *
 * How to use: Use this component if a modal needs to have some base UI for allowing a user to select an option, given some
 * Field text (i.e. "Select a Patient")
 *
 */
const PatientSelect = ({
  currentFhirServer, formFieldLabel, shouldDisplayError,
  errorMessage, placeholderText, inputOnChange,
  patients,
}) => {
  let fhirServerDisplay;
  if (currentFhirServer) {
    fhirServerDisplay = (
      <div>
        <Typography fontWeight={400} fontSize={16}>Current FHIR server</Typography>
        <br />
        <Typography fontWeight={200} fontSize={14}>{currentFhirServer}</Typography>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {fhirServerDisplay}
      <div className={styles['vertical-separation']}>
        <FormControl fullWidth error={shouldDisplayError} required>
          <FormLabel required>{formFieldLabel}</FormLabel>
          <Select
            placeholder={placeholderText}
            value={placeholderText}
            onChange={inputOnChange}
            options={patients}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
          {shouldDisplayError && <FormHelperText>{errorMessage}</FormHelperText>}
        </FormControl>
      </div>
    </div>
  );
};

PatientSelect.propTypes = propTypes;

export default PatientSelect;
