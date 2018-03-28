import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Modal from 'terra-modal';
import Button from 'terra-button';
import Dialog from 'terra-dialog';
import Spacer from 'terra-spacer';
import Text from 'terra-text';

import styles from './patient-entry.css';
import BaseEntryBody from '../BaseEntryBody/base-entry-body';
import retrievePatient from '../../retrieve-data-helpers/patient-retrieval';

const propTypes = {
  closePrompt: PropTypes.func,
  currentFhirServer: PropTypes.string.isRequired,
  currentPatientId: PropTypes.string.isRequired,
  isEntryRequired: PropTypes.bool,
  isOpen: PropTypes.bool,
  resolve: PropTypes.func,
};

export class PatientEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: this.props.isOpen,
      userInput: '',
      shouldDisplayError: false,
      errorMessage: '',
    };

    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isOpen !== nextProps.isOpen) {
      this.setState({ isOpen: nextProps.isOpen });
    }
  }

  handleCloseModal() {
    this.setState({ isOpen: false, shouldDisplayError: false, errorMessage: '' });
    if (this.props.closePrompt) this.props.closePrompt();
  }

  handleChange(e) {
    this.setState({ userInput: e.target.value });
  }

  async handleSubmit() {
    if (this.state.userInput === '' || !this.state.userInput || !this.state.userInput.trim()) {
      this.setState({ shouldDisplayError: true, errorMessage: 'Enter a valid patient ID' });
      return;
    }

    try {
      await retrievePatient(this.state.userInput).then(() => {
        if (this.props.resolve) this.props.resolve();
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
        {this.props.isEntryRequired ? '' :
        <Spacer marginLeft="small" isInlineBlock>
          <Button text="Cancel" onClick={this.handleCloseModal} />
        </Spacer>}
      </div>);

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
            <BaseEntryBody
              currentFhirServer={this.props.currentFhirServer}
              formFieldLabel="Enter a Patient ID"
              shouldDisplayError={this.state.shouldDisplayError}
              errorMessage={this.state.errorMessage}
              placeholderText={this.props.currentPatientId}
              inputOnChange={this.handleChange}
              inputName="patient-input"
            />
          </Dialog>
        </Modal>
      </div>
    );
  }
}

PatientEntry.propTypes = propTypes;

const mapStateToProps = store => ({
  currentFhirServer: store.fhirServerState.currentFhirServer,
  currentPatientId: store.patientState.currentPatient.id,
});

export default connect(mapStateToProps)(PatientEntry);
