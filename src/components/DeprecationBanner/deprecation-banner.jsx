import React, { Component } from 'react';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';

/**
 * localStorage key used to remember that the user has dismissed the banner.
 * Bump the suffix if the banner message changes so the new message is shown again.
 */
export const DISMISS_KEY = 'PERSISTED_deprecationBannerDismissed_r4';

/**
 * A dismissible banner informing users that FHIR DSTU2 (R2) is deprecated in the
 * Sandbox and that the default FHIR server now uses FHIR R4. Once dismissed, the
 * banner stays hidden via localStorage.
 */
class DeprecationBanner extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: localStorage.getItem(DISMISS_KEY) !== 'true',
    };

    this.dismiss = this.dismiss.bind(this);
  }

  dismiss() {
    localStorage.setItem(DISMISS_KEY, 'true');
    this.setState({ isOpen: false });
  }

  render() {
    return (
      <Collapse in={this.state.isOpen} unmountOnExit>
        <Alert severity="warning" onClose={this.dismiss}>
          FHIR DSTU2 (R2) is deprecated in this Sandbox. The default FHIR server now uses FHIR R4.
        </Alert>
      </Collapse>
    );
  }
}

export default DeprecationBanner;
