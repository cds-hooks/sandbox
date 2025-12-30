import React, { Component } from 'react';
import PropTypes from 'prop-types';

import MuiButton from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';

import styles from './services-entry.css';
import BaseEntryBody from '../BaseEntryBody/base-entry-body';
import retrieveDiscoveryServices from '../../retrieve-data-helpers/discovery-services-retrieval';

const propTypes = {
  /**
   * Flag to determine if the modal is open
   */
  isOpen: PropTypes.bool,
  /**
   * Callback function to close the modal
   */
  closePrompt: PropTypes.func,
};

export class ServicesEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /**
       * Flag to determine if this modal is open
       */
      isOpen: props.isOpen,
      /**
       * Tracks the user input for the CDS service entry
       */
      userInput: '',
      /**
       * Flag to determine if the modal should display an error to the user face-up
       */
      shouldDisplayError: false,
      /**
       * Error message to display in the modal
       */
      errorMessage: '',
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

  handleCloseModal() {
    this.setState({ isOpen: false, shouldDisplayError: false, errorMessage: '' });
    if (this.props.closePrompt) { this.props.closePrompt(); }
  }

  handleChange(e) {
    this.setState({ userInput: e.target.value });
  }

  /**
   * Trim the user input and test to make sure the URL is valid before setting state with the value.
   * Once the URL is sanitized, check and make sure it is a valid discovery endpoint before storing the
   * services in the Redux store. If the discovery endpoint fails, display an error message face-up to the user
   */
  async handleSubmit() {
    if (this.state.userInput === '' || !this.state.userInput || !this.state.userInput.trim()) {
      this.setState({ shouldDisplayError: true, errorMessage: 'Enter a valid discovery endpoint' });
    }
    let checkUrl = this.state.userInput.trim();
    if (!/^(https?:)?\/\//i.test(checkUrl)) {
      checkUrl = `http://${checkUrl}`;
      this.setState({
        userInput: checkUrl,
      });
    }
    try {
      await retrieveDiscoveryServices(checkUrl).then(() => {
        this.handleCloseModal();
      });
    } catch (e) {
      this.setState({
        shouldDisplayError: true,
        errorMessage: 'Failed to connect to the discovery endpoint. See console for details.',
      });
    }
  }

  render() {
    return (
      <Dialog
        open={this.state.isOpen}
        onClose={this.handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography fontWeight={700} fontSize={20}>Add CDS Services</Typography>
        </DialogTitle>
        <DialogContent>
          <BaseEntryBody
            formFieldLabel="Enter discovery endpoint url"
            shouldDisplayError={this.state.shouldDisplayError}
            errorMessage={this.state.errorMessage}
            placeholderText="https://example-services.com/cds-services"
            inputOnChange={this.handleChange}
            inputName="discovery-endpoint-input"
          />
          <Typography fontStyle="italic">
            Note: See&nbsp;
            <a
              href="https://cds-hooks.org/specification/current/#discovery"
              rel="noreferrer noopener"
              target="_blank"
            >
              documentation
            </a>
&nbsp;for more details regarding the Discovery endpoint.
          </Typography>
        </DialogContent>
        <DialogActions className={styles['right-align']}>
          <MuiButton onClick={this.handleCloseModal}>Cancel</MuiButton>
          <MuiButton variant="contained" onClick={this.handleSubmit}>Save</MuiButton>
        </DialogActions>
      </Dialog>
    );
  }
}

ServicesEntry.propTypes = propTypes;

export default ServicesEntry;
