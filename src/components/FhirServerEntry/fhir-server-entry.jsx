import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Modal from 'terra-modal';
import Button from 'terra-button';
import Dialog from 'terra-dialog';
import Spacer from 'terra-spacer';
import Text from 'terra-text';

import styles from './fhir-server-entry.css';
import BaseEntryBody from '../BaseEntryBody/base-entry-body';
import retrieveFhirMetadata from '../../retrieve-data-helpers/fhir-metadata-retrieval';

const propTypes = {
  /**
   * The FHIR server URL in context
   */
  currentFhirServer: PropTypes.string.isRequired,
  /**
   * The FHIR server URL for default cases
   */
  defaultFhirServer: PropTypes.string.isRequired,
  /**
   * Flag to determine if user input is required to input a FHIR server. This is set to true if upon Sandbox
   * startup, the default FHIR server errors out and is unable to be used. This is set to false if after startup of the Sandbox,
   * the user decides to "Change FHIR Server" for their own preferences. The flag is used to determine whether or not a user
   * can "cancel" or exit out of the FHIR server modal
   */
  isEntryRequired: PropTypes.bool,
  /**
   * Flag to determine if the modal is open or not
   */
  isOpen: PropTypes.bool,
  /**
   * Callback function that gets invoked once setting the FHIR server to a user-submitted FHIR server URL is successful.
   * This is only used when on Sandbox startup, the default FHIR server fails to load and the user must enter a valid
   * FHIR server to proceed within the tool.
   */
  resolve: PropTypes.func,
  /**
   * Callback function to close the FHIR server entry modal once either a valid FHIR server has been stored, or when
   * the user cancels out of the modal
   */
  closePrompt: PropTypes.func,
};

/**
 * User entry modal component specifically for entering a FHIR server URL to switch FHIR servers
 */
export class FhirServerEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /**
       * Flag to determine if the component is open or closed
       */
      isOpen: Boolean(props.isOpen),
      /**
       * User input text tracked inside the input box for FHIR server URL entry
       */
      userInput: '',
      /**
       * Flag to determine if the modal must display an error due to user input
       */
      shouldDisplayError: Boolean(props.initialError),
      /**
       * Message to display in an error field on the input
       */
      errorMessage: props.initialError || '',
    };

    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleResetDefaultServer = this.handleResetDefaultServer.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.isOpen !== prevState.isOpen) {
      return ({ isOpen: nextProps.isOpen });
    }
    return null;
  }

  handleCloseModal() {
    this.setState({ isOpen: false, shouldDisplayError: false, errorMessage: '' });
    if (this.props.closePrompt) { this.props.closePrompt(); }
  }

  handleChange(e) {
    this.setState({ userInput: e.target.value });
  }

  /**
   * Sanitize user input before pinging the FHIR server to see if it is valid. Once tested, the retrieveFhirMetadata function
   * will set state with the new FHIR server in context and closes the modal. If an error occurs when checking the FHIR server
   * entered by the user, an appropriate error message will be displayed
   */
  async handleSubmit() {
    if (this.state.userInput === '' || !this.state.userInput || !this.state.userInput.trim()) {
      this.setState({ shouldDisplayError: true, errorMessage: 'Enter a valid FHIR server base url' });
      return;
    }
    let checkUrl = this.state.userInput.trim();
    if (!/^(https?:)?\/\//i.test(checkUrl)) {
      checkUrl = `http://${checkUrl}`;
      this.setState({
        userInput: checkUrl,
      });
    }
    try {
      await retrieveFhirMetadata(checkUrl).then(() => {
        if (this.props.resolve) { this.props.resolve(); }
        this.handleCloseModal();
      });
    } catch (err) {
      if (err && err.response && err.response.status === 401) {
        this.setState({
          shouldDisplayError: true,
          errorMessage: 'Cannot configure secured FHIR endpoints. Please use an open (unsecured) FHIR endpoint.',
        });
      } else {
        this.setState({
          shouldDisplayError: true,
          errorMessage: 'Failed to connect to the FHIR server. See console for details.',
        });
      }
    }
  }

  /**
   * Reset the FHIR server in context to that of the default FHIR server and close the modal
   */
  async handleResetDefaultServer() {
    await retrieveFhirMetadata(this.props.defaultFhirServer);
    if (this.props.resolve) { this.props.resolve(); }
    this.handleCloseModal();
  }

  render() {
    const headerContainer = (
      <Text weight={700} fontSize={20}>Change FHIR Server</Text>
    );

    const footerContainer = (
      <div className={styles['right-align']}>
        {this.props.isEntryRequired ? ''
          : (
            <div className={styles['left-aligned-text']}>
              <Button
                text="Reset to default FHIR server"
                variant="de-emphasis"
                onClick={this.handleResetDefaultServer}
              />
            </div>
          )}
        <Button text="Next" variant="emphasis" onClick={this.handleSubmit} />
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
          ariaLabel="FHIR Server"
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
              formFieldLabel="Enter a FHIR Server URL"
              shouldDisplayError={this.state.shouldDisplayError}
              errorMessage={this.state.errorMessage}
              placeholderText={this.props.currentFhirServer}
              inputOnChange={this.handleChange}
              inputName="fhir-server-input"
            />
          </Dialog>
        </Modal>
      </div>
    );
  }
}

FhirServerEntry.propTypes = propTypes;

const mapStateToProps = (store) => ({
  currentFhirServer: store.fhirServerState.currentFhirServer,
  defaultFhirServer: store.fhirServerState.defaultFhirServer,
});

export default connect(mapStateToProps)(FhirServerEntry);
