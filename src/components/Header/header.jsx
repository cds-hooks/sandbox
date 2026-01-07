/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/forbid-prop-types */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import pickBy from 'lodash/pickBy';
import forIn from 'lodash/forIn';
import {
  IconSettings, IconChevronDown, IconLeft, IconEdit,
} from '../../utils/iconMapping';

import ConfigureServices from '../ConfigureServices/configure-services';
import ServicesEntry from '../ServicesEntry/services-entry';
import PatientEntry from '../PatientEntry/patient-entry';
import FhirServerEntry from '../FhirServerEntry/fhir-server-entry';

import retrievePatient from '../../retrieve-data-helpers/patient-retrieval';
import retrieveDiscoveryServices from '../../retrieve-data-helpers/discovery-services-retrieval';
import retrieveFhirMetadata from '../../retrieve-data-helpers/fhir-metadata-retrieval';
import callServices from '../../retrieve-data-helpers/service-exchange';
import { setHook } from '../../actions/hook-actions';
import { toggleDemoView } from '../../actions/card-demo-actions';
import { resetServices } from '../../actions/cds-services-actions';
import cdsHooksLogo from '../../assets/cds-hooks-logo.png';
import styles from './header.css';

import store from '../../store/store';

const propTypes = {
  /**
   * The identifier of the Patient resource in context
   */
  patientId: PropTypes.string.isRequired,
  /**
   * The name of the screen in context
   */
  screen: PropTypes.string.isRequired,
  /**
   * The name of the hook in context
   */
  hook: PropTypes.string.isRequired,
  /**
   * Function to set a hook in the store (i.e. 'patient-view' to 'order-select')
   */
  setHook: PropTypes.func.isRequired,
  /**
   * Function to reset all CDS service configuration in the Sandbox (remove any added services, and keep default services)
   */
  resetServices: PropTypes.func.isRequired,
  /**
   * Flag to determine if the Sandbox in session is using a secured FHIR server (i.e. the Sandbox was launched as a SMART application)
   */
  isSecuredSandbox: PropTypes.object,
  /**
   * Flag to determine if the current view is the Card Demo view or the mock-EHR view
   */
  isCardDemoView: PropTypes.bool.isRequired,
  /**
   * Function to toggle the state of the Card Demo view or mock-EHR view
   */
  toggleCardDemoView: PropTypes.func.isRequired,
};

/**
 * This component represents the Header for the application, which encompasses the title, logo, and several configuration options. The header allows the user
 * to select between different hook views (i.e. patient-view and order-select), and presents options to change the FHIR server and/or the patient in
 * context, add CDS services, among other options.
 */
export class Header extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /**
       * Flag to determine if the settings menu is open
       */
      settingsOpen: false,
      /**
       * Flag to determine if the Change Patient modal is open
       */
      isChangePatientOpen: false,
      /**
       * Flag to determine if the Change FHIR Server modal is open
       */
      isChangeFhirServerOpen: false,
      /**
       * Flag to determine if the Add CDS Services modal is open
       */
      isAddServicesOpen: false,
      /**
       * Flag to determine if the Configure Services modal is open
       */
      isConfigureServicesOpen: false,
    };

    this.switchHook = this.switchHook.bind(this);
    this.getNavClasses = this.getNavClasses.bind(this);
    this.setSettingsNode = this.setSettingsNode.bind(this);
    this.getSettingsNode = this.getSettingsNode.bind(this);

    this.openSettingsMenu = this.openSettingsMenu.bind(this);
    this.closeSettingsMenu = this.closeSettingsMenu.bind(this);
    this.openAddServices = this.openAddServices.bind(this);
    this.closeAddServices = this.closeAddServices.bind(this);
    this.openChangePatient = this.openChangePatient.bind(this);
    this.closeChangePatient = this.closeChangePatient.bind(this);
    this.openChangeFhirServer = this.openChangeFhirServer.bind(this);
    this.closeChangeFhirServer = this.closeChangeFhirServer.bind(this);
    this.openConfigureServices = this.openConfigureServices.bind(this);
    this.closeConfigureServices = this.closeConfigureServices.bind(this);

    this.resetConfiguration = this.resetConfiguration.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.patientId !== this.props.patientId) { return false; }
    return true;
  }

  setSettingsNode(node) { this.settingsNode = node; }

  getSettingsNode() { return this.settingsNode; }

  /**
   * Determine how to make a hook tab display as the current or "active" tab or another tab
   * @param {*} hook - the name of the hook
   */
  getNavClasses(screen) {
    return this.props.screen === screen ? cx(styles['nav-links'], styles['active-link']) : styles['nav-links'];
  }

  closeSettingsMenu() { this.setState({ settingsOpen: false }); }

  openSettingsMenu() { this.setState({ settingsOpen: true }); }

  /**
   * Once a new tab (hook) is chosen, the Sandbox must grab the applicable services for that hook and invoke them.
   * In a special consideration for the Rx View (order-select), we see if a medication has already been chosen
   * from a previous selection, and if so, call the services immediately with that previously chosen medication in context
   */
  switchHook(hook, screen = hook) {
    const state = store.getState();
    const filterService = (service) => service.hook === hook && service.enabled;
    const services = pickBy(state.cdsServicesState.configuredServices, filterService);

    // If the current view tab is being clicked, re-invoke the configured services on this hook.
    // Otherwise, set the new hook/view.
    if (this.props.hook === hook && this.props.screen === screen) {
      this.props.dispatch({ type: 'EXPLICIT_HOOK_TRIGGER' });

      // TODO cut this logic out and use generic handers as for pama
      if (services && Object.keys(services).length) {
        forIn(services, (val, key) => {
          // If the tab is clicked again, make sure the Sandbox is qualified to call out to EHR's based
          // on current context (i.e. for the Rx View, ensure a medication has been prescribed before
          // re-invoking the services on that hook if the Rx View tab is clicked multiple times)
          if (hook === 'order-select' || hook === 'order-sign') {
            const medicationPrescribed = state.medicationState.decisions.prescribable
              && state.medicationState.medListPhase === 'done';
            if (medicationPrescribed) {
              callServices(this.props.dispatch, state, key);
            }
          } else {
            callServices(this.props.dispatch, state, key);
          }
        });
      }
    } else {
      this.props.setHook(hook, screen);
    }
  }

  /**
   * Clear all cached configuration by the user on the Sandbox, including any added CDS services,
   * changed FHIR servers, the current hook the user is on, and any changed patients in context.
   * Resets to default state and calls CDS services accordingly
   */
  async resetConfiguration() {
    // Temporary removal until all persisted values are refactored into one localStorage property
    this.closeSettingsMenu();
    localStorage.removeItem('PERSISTED_cdsServices');
    this.props.resetServices();
    retrieveDiscoveryServices();

    localStorage.removeItem('PERSISTED_fhirServer');
    await retrieveFhirMetadata();

    localStorage.removeItem('PERSISTED_hook');
    localStorage.removeItem('PERSISTED_screen');

    localStorage.removeItem('PERSISTED_patientId');
    await retrievePatient();
  }

  openConfigureServices() {
    this.setState({ isConfigureServicesOpen: true });
    if (this.state.settingsOpen) { this.closeSettingsMenu(); }
  }

  closeConfigureServices() { this.setState({ isConfigureServicesOpen: false }); }

  openAddServices() {
    this.setState({ isAddServicesOpen: true });
    if (this.state.settingsOpen) {
      this.closeSettingsMenu();
    }
  }

  closeAddServices() { this.setState({ isAddServicesOpen: false }); }

  /**
   * Open the Change Patient modal to allow for changing the patient ID in context.
   *
   * Note: If the current FHIR server has been changed, the testCurrentPatient parameter flag will be set to true,
   * and the current patient in context will be checked to see if it exists in the newly configured FHIR server.
   *
   * If the current patient DOES NOT align with the newly configured FHIR server, we open the Change Patient modal automatically
   * after the FHIR server has been entered, and allow the user to define a new patient ID in context that is associated with
   * the new FHIR server.
   *
   * If the current patient DOES align with the newly configured FHIR server, we allow the Change FHIR Server modal to close automatically,
   * and the Sandbox does not prompt the user to enter a new patient ID
   * @param {*} e - Event object from the onClick callback
   * @param {*} testCurrentPatient - Boolean flag to determine if the current patient ID should be checked against the current FHIR server
   */
  async openChangePatient(e, testCurrentPatient) {
    if (testCurrentPatient) {
      try {
        await retrievePatient(this.props.patientId);
      } catch (err) {
        this.setState({ isChangePatientOpen: true });
        if (this.state.settingsOpen) { this.closeSettingsMenu(); }
      }
    } else {
      this.setState({ isChangePatientOpen: true });
      if (this.state.settingsOpen) { this.closeSettingsMenu(); }
    }
  }

  closeChangePatient() { this.setState({ isChangePatientOpen: false }); }

  openChangeFhirServer() {
    this.setState({ isChangeFhirServerOpen: true });
    if (this.state.settingsOpen) { this.closeSettingsMenu(); }
  }

  closeChangeFhirServer() { this.setState({ isChangeFhirServerOpen: false }); }

  render() {
    // Gear settings menu item options
    let menuItems = [
      <MenuItem className={styles['add-services']} key="add-services" onClick={this.openAddServices}>Add CDS Services</MenuItem>,
      <MenuItem className={styles['configure-services']} key="configure-services" onClick={this.openConfigureServices}>Configure CDS Services</MenuItem>,
      <Divider className={styles['divider-1']} key="Divider1" />,
      <MenuItem className={styles['change-patient']} key="change-patient" onClick={this.openChangePatient}>Change Patient</MenuItem>,
    ];
    if (!this.props.isSecuredSandbox) {
      menuItems.push(<MenuItem className={styles['change-fhir-server']} key="change-fhir-server" onClick={this.openChangeFhirServer}>Change FHIR Server</MenuItem>);
    }
    menuItems = menuItems.concat([
      <Divider className={styles['divider-2']} key="Divider2" />,
      <MenuItem className={styles['reset-configuration']} key="reset-configuration" onClick={this.resetConfiguration}>Reset Configuration</MenuItem>,
    ]);

    // Gear settings menu
    const gearMenu = (
      <Menu
        anchorEl={this.settingsNode}
        open={this.state.settingsOpen}
        onClose={this.closeSettingsMenu}
      >
        {menuItems}
      </Menu>
    );

    return (
      <div>
        <AppBar position="static" sx={{ backgroundColor: '#384e77' }}>
          <Toolbar>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <img src={cdsHooksLogo} alt="" height="30" width="30" />
              <b className={styles['logo-title']}>CDS Hooks Sandbox</b>
            </Box>

            {/* Navigation tabs */}
            {!this.props.isCardDemoView && (
              <Box sx={{ flexGrow: 1 }}>
                <div className={styles['nav-tabs']}>
                  <div className={styles['nav-container']}>
                    <button className={this.getNavClasses('patient-view')} onClick={() => this.switchHook('patient-view')}>Patient View</button>
                    <button className={this.getNavClasses('rx-view')} onClick={() => this.switchHook('order-select', 'rx-view')}>Rx View</button>
                    <button className={this.getNavClasses('rx-sign')} onClick={() => this.switchHook('order-sign', 'rx-sign')}>Rx Sign</button>
                    <button className={this.getNavClasses('pama')} onClick={() => this.switchHook('order-select', 'pama')}>PAMA Imaging</button>
                  </div>
                </div>
              </Box>
            )}

            {this.props.isCardDemoView && <Box sx={{ flexGrow: 1 }} />}

            {/* Card Demo toggle button */}
            <IconButton
              onClick={this.props.toggleCardDemoView}
              sx={{ color: 'white', mr: 1 }}
            >
              {this.props.isCardDemoView ? <IconLeft /> : <IconEdit />}
            </IconButton>

            {/* Settings gear icon */}
            <IconButton
              onClick={this.openSettingsMenu}
              ref={this.setSettingsNode}
              sx={{ color: 'white' }}
            >
              <IconSettings height="1.2em" width="1.2em" />
              <IconChevronDown height="1em" width="1em" />
            </IconButton>
          </Toolbar>
        </AppBar>

        {gearMenu}
        {this.state.isAddServicesOpen ? (
          <ServicesEntry
            isOpen={this.state.isAddServicesOpen}
            closePrompt={this.closeAddServices}
          />
        ) : null}
        {this.state.isConfigureServicesOpen ? (
          <ConfigureServices
            isOpen={this.state.isConfigureServicesOpen}
            closePrompt={this.closeConfigureServices}
          />
        ) : null}
        {this.state.isChangePatientOpen ? (
          <PatientEntry
            isOpen={this.state.isChangePatientOpen}
            closePrompt={this.closeChangePatient}
          />
        ) : null}
        {this.state.isChangeFhirServerOpen ? (
          <FhirServerEntry
            isOpen={this.state.isChangeFhirServerOpen}
            closePrompt={this.closeChangeFhirServer}
            isEntryRequired={false}
            resolve={(e) => this.openChangePatient(e, true)}
          />
        ) : null}
      </div>
    );
  }
}

Header.propTypes = propTypes;

const mapStateToProps = (appStore) => ({
  hook: appStore.hookState.currentHook,
  screen: appStore.hookState.currentScreen,
  patientId: appStore.patientState.currentPatient.id,
  isCardDemoView: appStore.cardDemoState.isCardDemoView,
  isSecuredSandbox: appStore.fhirServerState.accessToken,
});

const mapDispatchToProps = (dispatch) => ({
  setHook: (hook, screen) => {
    dispatch(setHook(hook, screen));
  },
  toggleCardDemoView: () => {
    dispatch(toggleDemoView());
  },
  resetServices: () => {
    dispatch(resetServices());
  },
  dispatch,
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
