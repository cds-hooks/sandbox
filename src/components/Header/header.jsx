/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react/forbid-prop-types */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';
import ApplicationHeaderLayout from 'terra-application-header-layout';
import IconSettings from 'terra-icon/lib/icon/IconSettings';
import IconChevronDown from 'terra-icon/lib/icon/IconChevronDown';
import Menu from 'terra-menu';
import Button from 'terra-button';
import IconLeft from 'terra-icon/lib/icon/IconLeft';
import IconEdit from 'terra-icon/lib/icon/IconEdit';
import pickBy from 'lodash/pickBy';
import forIn from 'lodash/forIn';

import ConfigureServices from '../ConfigureServices/configure-services';
import ServicesEntry from '../ServicesEntry/services-entry';
import UserEntry from '../UserEntry/user-entry';
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
   * The name of the hook in context
   */
  hook: PropTypes.string.isRequired,
  /**
   * Function to set a hook in the store (i.e. 'patient-view' to 'medication-prescribe')
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
 * to select between different hook views (i.e. patient-view and medication-prescribe), and presents options to change the FHIR server and/or the patient in
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
       * Flag to determine if the Change User modal is open
       */
      isChangeUserOpen: false,
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
    this.openChangeUser = this.openChangeUser.bind(this);
    this.closeChangeUser = this.closeChangeUser.bind(this);
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
  getNavClasses(hook) {
    return this.props.hook === hook ? cx(styles['nav-links'], styles['active-link']) : styles['nav-links'];
  }

  closeSettingsMenu() { this.setState({ settingsOpen: false }); }
  openSettingsMenu() { this.setState({ settingsOpen: true }); }

  /**
   * Once a new tab (hook) is chosen, the Sandbox must grab the applicable services for that hook and invoke them.
   * In a special consideration for the Rx View (medication-prescribe), we see if a medication has already been chosen
   * from a previous selection, and if so, call the services immediately with that previously chosen medication in context
   */
  switchHook(hook) {
    const state = store.getState();
    const filterService = service => service.hook === hook && service.enabled;
    const services = pickBy(state.cdsServicesState.configuredServices, filterService);

    // If the current view tab is being clicked, re-invoke the configured services on this hook.
    // Otherwise, set the new hook/view.
    if (this.props.hook === hook) {
      if (services && Object.keys(services).length) {
        forIn(services, (val, key) => {
          // If the tab is clicked again, make sure the Sandbox is qualified to call out to EHR's based
          // on current context (i.e. for the Rx View, ensure a medication has been prescribed before
          // re-invoking the services on that hook if the Rx View tab is clicked multiple times)
          if (hook === 'medication-prescribe') {
            const medicationPrescribed = state.medicationState.decisions.prescribable &&
              state.medicationState.medListPhase === 'done';
            if (medicationPrescribed) {
              callServices(key);
            }
          } else {
            callServices(key);
          }
        });
      }
    } else {
      this.props.setHook(hook);
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

  async openChangeUser() {
    this.setState({ isChangeUserOpen: true });
    if (this.state.settingsOpen) { this.closeSettingsMenu(); }
  }
  closeChangeUser() { this.setState({ isChangeUserOpen: false }); }

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
    // Title and Logo
    const logo = <div><span><img src={cdsHooksLogo} alt="" height="30" width="30" /></span><b className={styles['logo-title']}>CDS Hooks Sandbox</b></div>;

    // Gear settings menu item options
    let menuItems = [
      <Menu.Item className={styles['add-services']} text="Add CDS Services" key="add-services" onClick={this.openAddServices} />,
      <Menu.Item className={styles['configure-services']} text="Configure CDS Services" key="configure-services" onClick={this.openConfigureServices} />,
      <Menu.Divider className={styles['divider-1']} key="Divider1" />,
      <Menu.Item className={styles['change-user']} text="Change User" key="change-user" onClick={this.openChangeUser} />,
      <Menu.Divider className={styles['divider-2']} key="Divider2" />,
      <Menu.Item className={styles['change-patient']} text="Change Patient" key="change-patient" onClick={this.openChangePatient} />,
    ];
    if (!this.props.isSecuredSandbox) {
      menuItems.push(<Menu.Item className={styles['change-fhir-server']} text="Change FHIR Server" key="change-fhir-server" onClick={this.openChangeFhirServer} />);
    }
    menuItems = menuItems.concat([
      <Menu.Divider className={styles['divider-3']} key="Divider3" />,
      <Menu.Item className={styles['reset-configuration']} text="Reset Configuration" key="reset-configuration" onClick={this.resetConfiguration} />,
    ]);

    // Gear settings menu
    const gearMenu = (
      <Menu
        isOpen={this.state.settingsOpen}
        onRequestClose={this.closeSettingsMenu}
        targetRef={this.getSettingsNode}
        isArrowDisplayed
      >
        {menuItems}
      </Menu>);

    // Navigation tabs (the hook views)
    const navigation = (
      <div className={styles['nav-tabs']}>
        <div className={styles['nav-container']}>
          <button className={this.getNavClasses('patient-view')} onClick={() => this.switchHook('patient-view')}>Patient View</button>
          <button className={this.getNavClasses('medication-prescribe')} onClick={() => this.switchHook('medication-prescribe')}>Rx View</button>
        </div>
      </div>);

    // Extension tabs (Card Demo view)
    const extensions = (
      <div className={styles.extensions}>
        <Button
          text=""
          isIconOnly
          icon={this.props.isCardDemoView ? <IconLeft /> : <IconEdit />}
          variant="action"
          onClick={this.props.toggleCardDemoView}
        />
      </div>
    );

    // The actual gear icon for the settings menu
    const utilities = (
      <div className={styles.icon} onClick={this.openSettingsMenu}>
        <span className={styles['padding-right']}><IconSettings height="1.2em" width="1.2em" /></span>
        <span className={styles['padding-right']} ref={this.setSettingsNode} ><IconChevronDown height="1em" width="1em" /></span>
      </div>);

    return (
      <div>
        <ApplicationHeaderLayout
          logo={logo}
          navigation={this.props.isCardDemoView ? null : navigation}
          extensions={extensions}
          utilities={utilities}
          style={{ backgroundColor: '#384e77' }}
        />
        {gearMenu}
        {this.state.isAddServicesOpen ? <ServicesEntry
          isOpen={this.state.isAddServicesOpen}
          closePrompt={this.closeAddServices}
        /> : null}
        {this.state.isConfigureServicesOpen ? <ConfigureServices
          isOpen={this.state.isConfigureServicesOpen}
          closePrompt={this.closeConfigureServices}
        /> : null}
        {this.state.isChangeUserOpen ? <UserEntry
          isOpen={this.state.isChangeUserOpen}
          closePrompt={this.closeChangeUser}
        /> : null}
        {this.state.isChangePatientOpen ? <PatientEntry
          isOpen={this.state.isChangePatientOpen}
          closePrompt={this.closeChangePatient}
        /> : null}
        {this.state.isChangeFhirServerOpen ? <FhirServerEntry
          isOpen={this.state.isChangeFhirServerOpen}
          closePrompt={this.closeChangeFhirServer}
          isEntryRequired={false}
          resolve={e => this.openChangePatient(e, true)}
        /> : null}
      </div>
    );
  }
}

Header.propTypes = propTypes;

const mapStateToProps = appStore => ({
  hook: appStore.hookState.currentHook,
  patientId: appStore.patientState.currentPatient.id,
  isCardDemoView: appStore.cardDemoState.isCardDemoView,
  isSecuredSandbox: appStore.fhirServerState.accessToken,
});

const mapDispatchToProps = dispatch => ({
  setHook: (hook) => {
    dispatch(setHook(hook));
  },
  toggleCardDemoView: () => {
    dispatch(toggleDemoView());
  },
  resetServices: () => {
    dispatch(resetServices());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
