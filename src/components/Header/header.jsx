/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import ApplicationHeaderLayout from 'terra-application-header-layout';
import IconSettings from 'terra-icon/lib/icon/IconSettings';
import IconChevronDown from 'terra-icon/lib/icon/IconChevronDown';
import Menu from 'terra-menu';

import { setHook } from '../../actions/hook-actions';
import cdsHooksLogo from '../../assets/cds-hooks-logo.png';
import styles from './header.css';

export class Header extends Component {
  constructor(props) {
    super(props);

    this.state = {
      settingsOpen: false,
    };

    this.switchHook = this.switchHook.bind(this);
    this.getNavClasses = this.getNavClasses.bind(this);
    this.setSettingsNode = this.setSettingsNode.bind(this);
    this.getSettingsNode = this.getSettingsNode.bind(this);
    this.openSettingsMenu = this.openSettingsMenu.bind(this);
    this.closeSettingsMenu = this.closeSettingsMenu.bind(this);
    this.addCDSServices = this.addCDSServices.bind(this);
  }

  setSettingsNode(node) { this.settingsNode = node; }
  getSettingsNode() { return this.settingsNode; }

  getNavClasses(hook) {
    return this.props.hook === hook ? cx(styles['nav-links'], styles['active-link']) : styles['nav-links'];
  }

  closeSettingsMenu() { this.setState({ settingsOpen: false }); }
  openSettingsMenu() { this.setState({ settingsOpen: true }); }

  switchHook(hook) { this.props.setHook(hook); }

  addCDSServices() {
    // TODO: Prompt user to add CDS Service Endpoint
    this.closeSettingsMenu();
  }

  render() {
    const logo = <div><span><img src={cdsHooksLogo} alt="" height="30" width="30" /></span><b className={styles['logo-title']}>CDS Hooks Sandbox</b></div>;
    const gearMenu = (
      <Menu
        isOpen={this.state.settingsOpen}
        onRequestClose={this.closeSettingsMenu}
        targetRef={this.getSettingsNode}
        isArrowDisplayed
      >
        <Menu.Item text="Add CDS Services (placeholder)" key="add-services" onClick={this.addCDSServices} />
        <Menu.Item text="Change Patient (placeholder)" key="change-patient" />
        <Menu.Item text="Change FHIR Server (placeholder)" key="change-fhir-server" />
      </Menu>);

    const navigation = (
      <div className={styles['nav-tabs']}>
        <div className={styles['nav-container']}>
          <button className={this.getNavClasses('patient-view')} onClick={() => this.switchHook('patient-view')}>Patient View</button>
          <button className={this.getNavClasses('medication-prescribe')} onClick={() => this.switchHook('medication-prescribe')}>Rx View</button>
        </div>
      </div>);
    const utilities = (
      <div className={styles.icon} onClick={this.openSettingsMenu}>
        <span className={styles['padding-right']}><IconSettings height="1.2em" width="1.2em" /></span>
        <span className={styles['padding-right']} ref={this.setSettingsNode} ><IconChevronDown height="1em" width="1em" /></span>
      </div>);

    return (
      <div>
        <ApplicationHeaderLayout logo={logo} navigation={navigation} utilities={utilities} style={{ backgroundColor: '#384e77' }} />
        {gearMenu}
      </div>
    );
  }
}

const mapStateToProps = store => ({
  hook: store.hookState.currentHook,
});

const mapDispatchToProps = dispatch => ({
  setHook: (hook) => {
    dispatch(setHook(hook));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
