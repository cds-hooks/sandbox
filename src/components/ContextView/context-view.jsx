/* eslint-disable react/forbid-prop-types */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';
import forIn from 'lodash/forIn';

import SelectField from 'terra-form/lib/SelectField';
import ExchangePanel from '../ExchangePanel/exchange-panel';
import MessagePanel from '../MessagePanel/message-panel';

import styles from './context-view.css';

import { selectService } from '../../actions/service-exchange-actions';
import { setContextVisibility } from '../../actions/ui-actions';
import { getServicesByHook } from '../../reducers/helpers/services-filter';

const propTypes = {
  /**
   * Callback function that sets the user-selected CDS service from the dropdown of available services to display
   * a request and response for
   */
  selectService: PropTypes.func.isRequired,
  /**
   * Function to toggle the context view visibility (hide/show button)
   */
  toggleContext: PropTypes.func.isRequired,
  /**
   * Hash of available CDS services configured in the Sandbox
   */
  services: PropTypes.object,
  /**
   * User-selected CDS service to display a request/response for in the context view
   */
  selectedService: PropTypes.string,
  /**
   * Default CDS service to display a request/response for in the context view
   */
  initialService: PropTypes.string,
  /**
   * Hash containing the service exchanges per service (request and response)
   */
  exchanges: PropTypes.object,
  /**
   * Flag to determine if the context view will be visible or not (via the slide out button)
   */
  isContextVisible: PropTypes.bool.isRequired,
};

/**
 * The right hand side of the Sandbox that displays the CDS Developer Panel. It encompasses
 * ExchangePanel components that display the request/response. This view may be toggled by the user
 * to hide/show this view.
 */
export class ContextView extends Component {
  constructor(props) {
    super(props);
    this.onSelectChange = this.onSelectChange.bind(this);
    this.createDropdownServices = this.createDropdownServices.bind(this);
    this.onContextToggle = this.onContextToggle.bind(this);
  }

  /**
   * When a CDS Service is selected from the dropdown of services, this triggers a state
   * update so that a new request/response will appear in the appropriate exchange panels
   */
  onSelectChange(e) {
    this.props.selectService(e.target.value);
  }

  /**
   * When the Context View toggle is clicked, this triggers a state update so that the
   * Context View is hidden or expanded to allow the EHR view to take 100% width
   */
  onContextToggle() {
    this.props.toggleContext();
  }

  /**
   * Create an array of key-value pair objects that Terra SelectField component understands
   * given the CDS Services allowed to be selected for this hook
   */
  createDropdownServices() {
    const services = [];
    forIn(this.props.services, (service, key) => {
      services.push({
        value: key,
        display: `${service.id} - ${key}`,
      });
    });
    return services;
  }

  render() {
    let serviceExchange;
    const serviceInContext = this.props.selectedService || this.props.initialService;
    if (serviceInContext) {
      serviceExchange = this.props.exchanges[serviceInContext];
    }

    let contextToggledClass = '';
    if (this.props.isContextVisible) {
      contextToggledClass = styles['context-open'];
    }

    return (
      <div className={cx(styles.container, contextToggledClass)}>
        <div className={styles['wrap-context']}>
          <h1 className={styles.title}>CDS Developer Panel</h1>
          <SelectField
            label={<b>Select a Service</b>}
            value={`${serviceInContext}`}
            options={this.createDropdownServices()}
            onChange={this.onSelectChange}
          />
          <ExchangePanel
            panelHeader=" Request"
            panelText={serviceExchange ? serviceExchange.request : 'No request made to CDS Service'}
            isExpanded={false}
          />
          <ExchangePanel
            panelHeader=" Response"
            panelText={serviceExchange ? serviceExchange.response : 'No response made to CDS Service'}
            isExpanded
          />
          <hr />
          <MessagePanel
            panelHeader=" Messages"
            isExpanded
          />
        </div>
        <button onClick={this.onContextToggle} className={styles['context-toggle']}>
          CDS Developer Panel
        </button>
      </div>
    );
  }
}

ContextView.propTypes = propTypes;

const mapStateToProps = (store) => {
  function getFirstServiceForHook(services) {
    const serviceKeys = Object.keys(services);
    if (serviceKeys.length) {
      return serviceKeys[0];
    }
    return null;
  }

  return {
    isContextVisible: store.hookState.isContextVisible,
    services: getServicesByHook(store.hookState.currentHook, store.cdsServicesState.configuredServices),
    selectedService: store.serviceExchangeState.selectedService,
    initialService: getFirstServiceForHook(getServicesByHook(store.hookState.currentHook, store.cdsServicesState.configuredServices)),
    exchanges: store.serviceExchangeState.exchanges,
  };
};

const mapDispatchToProps = dispatch => ({
  selectService: (service) => {
    dispatch(selectService(service));
  },
  toggleContext: () => {
    dispatch(setContextVisibility());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ContextView);
