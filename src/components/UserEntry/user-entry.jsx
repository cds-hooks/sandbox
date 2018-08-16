import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import map from 'lodash/map';

import Modal from 'terra-modal';
import Button from 'terra-button';
import Dialog from 'terra-dialog';
import Spacer from 'terra-spacer';
import Text from 'terra-text';

import styles from './user-entry.css';
import switchUser from '../../actions/user-actions';
import BaseEntryBody from '../BaseEntryBody/base-entry-body';
import retrievePractitionerList from '../../retrieve-data-helpers/userlist-retrieval';

const propTypes = {
  /**
   * Callback function to close the UserEntry prompt
   */
  closePrompt: PropTypes.func,
  /**
   * The URL of the current FHIR server in context
   */
  currentFhirServer: PropTypes.string.isRequired,
  /**
   * The identifier of the current User resource
   */
  currentUser: PropTypes.string.isRequired,
  /**
   * Flag to determine if the UserEntry modal can be closed, or must have valid input from the user to continue
   */
  isEntryRequired: PropTypes.bool,
  /**
   * Flag to determine if the modal is open
   */
  isOpen: PropTypes.bool,
  /**
   * Function to switch current user
   */
  switchUser: PropTypes.func,
};

/**
 * User entry modal component specifically for entering a patient ID to switch the patient in context
 */
export class UserEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /**
       * Flag to determine if the modal is open
       */
      isOpen: this.props.isOpen,
      /**
       * String to keep track of user input for the user ID
       */
      selectedUser: this.props.currentUser,
      /**
       * Flag to determine if an error needs to be displayed on the Field
       */
      shouldDisplayError: false,
      /**
       * Error message to display on the Field
       */
      errorMessage: '',
      userList: [],
      isLoading: true,
    };

    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async componentDidMount() {
    await retrievePractitionerList().then((entries) => {
      const selectFieldOptions = map(entries, ({ resource: { resourceType, id, name } }) => Object.assign({}, {
        display: `${name.family.toString()}, ${name.given.toString()}`,
        key: `${resourceType}/${id}`,
        value: `${resourceType}/${id}`,
      }));
      this.setState({ userList: selectFieldOptions, isLoading: false });
    }).catch(error => console.log('Error occured while trying to get the Practitioners list', error));
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isOpen !== nextProps.isOpen) {
      this.setState({ isOpen: nextProps.isOpen });
    }
  }

  handleCloseModal() {
    this.setState({ isOpen: false, shouldDisplayError: false, errorMessage: '' });
    if (this.props.closePrompt) { this.props.closePrompt(); }
  }

  handleChange(e) {
    this.setState({ selectedUser: e.target.value });
  }

  async handleSubmit() {
    if (this.state.selectedUser === '' || !this.state.selectedUser || !this.state.selectedUser.trim()) {
      this.setState({ shouldDisplayError: true, errorMessage: 'Enter a valid patient ID' });
      return;
    }
    this.props.switchUser(this.state.selectedUser);
    this.handleCloseModal();
  }

  render() {
    const headerContainer = (
      <Text weight={700} fontSize={20}>Change User</Text>
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
        {!this.state.isLoading &&
        <Modal
          ariaLabel="User"
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
              formFieldLabel="Select a User"
              shouldDisplayError={this.state.shouldDisplayError}
              errorMessage={this.state.errorMessage}
              placeholderText={this.props.currentUser}
              inputOnChange={this.handleChange}
              inputName="user-input"
              selectOptions={this.state.userList}
            />
          </Dialog>
        </Modal>
      }
        {this.state.isLoading && 'Its loading...'}
      </div>
    );
  }
}

UserEntry.propTypes = propTypes;

const mapStateToProps = store => ({
  currentFhirServer: store.fhirServerState.currentFhirServer,
  currentUser: store.patientState.currentUser || store.patientState.defaultUser,
});

const mapDispatchToProps = dispatch => ({
  switchUser: (user) => {
    dispatch(switchUser(user));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(UserEntry);
