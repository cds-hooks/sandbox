/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import map from 'lodash/map';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MuiButton from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import styles from './configure-services.css';
import ServiceDisplay from './ServiceDisplay/service-display';

const propTypes = {
  /**
   * Callback function to close the modal prompt
   */
  closePrompt: PropTypes.func,
  /**
   * Flag to see if the modal is open or not initially
   */
  isOpen: PropTypes.bool,
  /**
   * Services configured on the Sandbox
   */
  services: PropTypes.object,
};

export class ConfigureServices extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: props.isOpen,
    };

    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.isOpen !== prevState.isOpen) {
      return ({ isOpen: nextProps.isOpen });
    }
    return null;
  }

  handleCloseModal() {
    this.setState({ isOpen: false });
    if (this.props.closePrompt) { this.props.closePrompt(); }
  }

  render() {
    return (
      <Dialog
        open={this.state.isOpen}
        onClose={this.handleCloseModal}
        fullScreen
      >
        <DialogTitle>
          <Typography fontWeight={700} fontSize={20}>Configure CDS Services</Typography>
          <IconButton
            aria-label="close"
            onClick={this.handleCloseModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {map(this.props.services, (service, ind) => (
            <ServiceDisplay
              definition={service}
              serviceUrl={ind}
              key={ind}
            />
          ))}
        </DialogContent>
        <DialogActions className={styles['right-align']}>
          <MuiButton onClick={this.handleCloseModal}>Cancel</MuiButton>
        </DialogActions>
      </Dialog>
    );
  }
}

ConfigureServices.propTypes = propTypes;

const mapStateToProps = (store) => ({
  services: store.cdsServicesState.configuredServices,
});

export default connect(mapStateToProps)(ConfigureServices);
