import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Modal from 'terra-modal';
import Button from 'terra-button';
import Dialog from 'terra-dialog';
import Spacer from 'terra-spacer';
import Text from 'terra-text';

import styles from './patient-entry.css';
import PatientSelect from '../PatientSelect/patient-select';
import retrievePatient from '../../retrieve-data-helpers/patient-retrieval';
import retrieveAllPatientIds from '../../retrieve-data-helpers/all-patient-retrieval';

const propTypes = {
  /**
   * Callback function to close the PatientEntry prompt
   */
  closePrompt: PropTypes.func,
  /**
   * The URL of the current FHIR server in context
   */
  currentFhirServer: PropTypes.string.isRequired,
  /**
   * The identifier of the current Patient resource in context
   */
  currentPatientId: PropTypes.string.isRequired,
  /**
   * Flag to determine if the PatientEntry modal can be closed, or must have valid input from the user to continue
   */
  isEntryRequired: PropTypes.bool,
  /**
   * Flag to determine if the modal is open
   */
  isOpen: PropTypes.bool,
  /**
   * Function to resolve data after grabbing a patient resource from the current FHIR server
   */
  resolve: PropTypes.func,
};

/**
 * User entry modal component specifically for entering a patient ID to switch the patient in context
 */
export class PatientEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /**
       * Flag to determine if the modal is open
       */
      isOpen: this.props.isOpen,
      /**
       * String to keep track of user input for the patient ID
       */
      userInput: '',
      /**
       * Flag to determine if an error needs to be displayed on the Field
       */
      shouldDisplayError: false,
      /**
       * Error message to display on the Field
       */
      errorMessage: '',
      /**
       * The ID of the current Patient resource in context
       */
      currentPatient: this.props.currentPatientId,
      /**
       * The list of the Patient identifiers populated from the currentFhirServer
       */
      patients: [],
    };

    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.isOpen !== prevState.isOpen) {
      return ({ isOpen: nextProps.isOpen });
    }
    return null;
  }

  async componentDidMount() {
    try {
      const data = await retrieveAllPatientIds();
      const patients = [];
      data.forEach((patient) => patients.push({ value: patient, label: patient }));
      this.setState({ patients: patients });
    } catch (error) {
      this.setState({ shouldDisplayError: true, errorMessage: 'Error fetching patients from FHIR Server' });
      return;
    }
  }

  handleCloseModal() {
    this.setState({ isOpen: false, shouldDisplayError: false, errorMessage: '' });
    if (this.props.closePrompt) { this.props.closePrompt(); }
  }

  handleChange(e) {
    this.setState({ userInput: e.value });
    this.setState({ currentPatient: e.value });
  }

  async handleSubmit() {
    if (this.state.userInput === '' || !this.state.userInput || !this.state.userInput.trim()) {
      this.setState({ shouldDisplayError: true, errorMessage: 'Enter a valid patient ID' });
      return;
    }

    try {
      await retrievePatient(this.state.userInput).then(() => {
        if (this.props.resolve) { this.props.resolve(); }
        this.handleCloseModal();
      });
    } catch (e) {
      this.setState({
        shouldDisplayError: true,
        errorMessage: 'Failed to retrieve patient from FHIR server. See console for details.',
      });
    }
  }

  render() {
    const headerContainer = (
      <Text weight={700} fontSize={20}>Change Patient</Text>
    );

    const footerContainer = (
      <div className={styles['right-align']}>
        <Button text="Save" variant="emphasis" onClick={this.handleSubmit} />
        {this.props.isEntryRequired ? ''
          : (
            <Spacer marginLeft="small" isInlineBlock>
              <Button text="Cancel" onClick={this.handleCloseModal} />
            </Spacer>
          )}
      </div>
    );

    return (
      <div>
        <Modal
          ariaLabel="Patient"
          isOpen={this.state.isOpen}
          closeOnEsc={!this.props.isEntryRequired}
          closeOnOutsideClick={!this.props.isEntryRequired}
          onRequestClose={this.handleCloseModal}
          classNameModal={styles['fixed-size']}
        >
          <Dialog
            header={headerContainer}
            footer={footerContainer}
            onClose={this.props.isEntryRequired ? null : this.handleCloseModal}
          >
            <PatientSelect
                currentFhirServer={this.props.currentFhirServer}
                formFieldLabel="Select a Patient"
                shouldDisplayError={this.state.shouldDisplayError}
                errorMessage={this.state.errorMessage}
                placeholderText={this.state.currentPatient}
                inputOnChange={this.handleChange}
                inputName="patient-input"
                patients={this.state.patients}
            />
          </Dialog>
        </Modal>
      </div>
    );
  }
}

PatientEntry.propTypes = propTypes;

const mapStateToProps = (store) => ({
  currentFhirServer: store.fhirServerState.currentFhirServer,
  currentPatientId: store.patientState.currentPatient.id,
});

export default connect(mapStateToProps)(PatientEntry);
