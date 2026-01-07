/* eslint-disable react/forbid-prop-types, react/no-danger */

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

import styles from './service-display.css';
import { toggleService, deleteService } from '../../../actions/cds-services-actions';

const propTypes = {
  /**
   * CDS service definition returned for a particular service at the discovery endpoint
   */
  definition: PropTypes.object,
  /**
   * The CDS service endpoint URL
   */
  serviceUrl: PropTypes.string,
  /**
   * Callback function to toggle the service in the Sandbox (inactivate, not remove)
   */
  toggle: PropTypes.func,
  /**
   * Callback function to remove the service from the Sandbox
   */
  remove: PropTypes.func,
};

export const ServiceDisplay = ({
  definition,
  serviceUrl,
  toggle,
  remove,
}) => {
  const definitionCopy = JSON.parse(JSON.stringify(definition));
  const str = JSON.stringify(definitionCopy, null, 2);
  return (
    <div className={styles.container}>
      <div className={styles['url-container']}>
        <Typography fontWeight={700} fontSize={14}>{serviceUrl}</Typography>
      </div>
      <div className={styles['btn-container']}>
        <FormControlLabel
          control={(
            <Switch
              checked={definition.enabled}
              onChange={() => toggle(serviceUrl)}
              color="primary"
            />
          )}
          label="Enabled"
        />
        <MuiButton
          variant="outlined"
          color="error"
          onClick={() => remove(serviceUrl)}
          sx={{ ml: 2 }}
        >
          Delete
        </MuiButton>
      </div>
      <div
        className={styles['definition-body']}
        dangerouslySetInnerHTML={{
          __html: str.replace(/\n/g, '<br/>')
            .replace(/ /g, '&nbsp;'),
        }}
      />
    </div>
  );
};

ServiceDisplay.propTypes = propTypes;

const mapDispatchToProps = (dispatch) => ({
  toggle: (service) => {
    dispatch(toggleService(service));
  },
  remove: (service) => {
    dispatch(deleteService(service));
  },
});

export default connect(null, mapDispatchToProps)(ServiceDisplay);
