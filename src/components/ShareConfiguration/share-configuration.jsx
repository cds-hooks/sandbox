import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Modal from 'terra-modal';
import Button from 'terra-button';
import Dialog from 'terra-dialog';
import Spacer from 'terra-spacer';
import Text from 'terra-text';
import Table from 'terra-table';
import Checkbox from 'terra-form-checkbox';

import styles from './share-configuration.css';

const propTypes = {
  closePrompt: PropTypes.func,
  currentFhirServer: PropTypes.string.isRequired,
  currentPatientId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool,
};

export class ShareConfiguration extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: this.props.isOpen,
      fhirServerChecked: true,
      patientChecked: true,
      hookChecked: true,
      servicesChecked: false,
    };

    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.toggleFhirServer = this.toggleFhirServer.bind(this);
    this.togglePatient = this.togglePatient.bind(this);
    this.toggleHook = this.toggleHook.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isOpen !== nextProps.isOpen) {
      this.setState({ isOpen: nextProps.isOpen });
    }
  }

  toggleFhirServer() {
    this.setState({ fhirServerChecked: !this.state.fhirServerChecked });
  }

  togglePatient() {
    this.setState({ patientChecked: !this.state.patientChecked });
  }

  toggleHook() {
    this.setState({ toggleHook: !this.state.toggleHook });
  }

  render() {
    const headerContainer = (
      <Text weight={700} fontSize={20}>Change Patient</Text>
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
        <Modal
          ariaLabel="Patient"
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
            <div className={styles.container}>
              <Table isStriped={false}>
                <Table.Header>
                  <Table.HeaderCell content="Property" key="property" minWidth="small" />
                  <Table.HeaderCell content="Value" key="value" minWidth="medium" />
                  <Table.HeaderCell content="Share in URL?" key="share-in-url" minWidth="small" />
                </Table.Header>
                <Table.Rows>
                  <Table.Row key="fhir-server">
                    <Table.Cell content="FHIR Server" key="fhir-server-property" />
                    <Table.Cell content={this.props.currentFhirServer} key="fhir-server-value" />
                    <Table.Cell
                      content={<Button
                        text="Enabled?"
                        icon={<Checkbox
                          checked={this.state.fhirServerChecked}
                          isLabelHidden
                          labelText="Enabled?"
                        />}
                        variant="emphasis"
                        onClick={this.toggleFhirServer}
                      />}
                      key="fhir-server-share-enabled"
                    />
                  </Table.Row>
                  <Table.Row key="patient">
                    <Table.Cell content="Patient ID" key="patient-property" />
                    <Table.Cell content={this.props.currentPatientId} key="patient-value" />
                    <Table.Cell
                      content={<Button
                        text="Enabled?"
                        icon={<Checkbox
                          checked={this.state.patientChecked}
                          isLabelHidden
                          labelText="Enabled?"
                        />}
                        variant="emphasis"
                        onClick={this.togglePatient}
                      />}
                      key="patient-share-enabled"
                    />
                  </Table.Row>
                  <Table.Row key="hook">
                    <Table.Cell content="Hook" key="hook-property" />
                    <Table.Cell content={this.props.currentHook} key="hook-value" />
                    <Table.Cell
                      content={<Button
                        text="Enabled?"
                        icon={<Checkbox
                          checked={this.state.hookChecked}
                          isLabelHidden
                          labelText="Enabled?"
                        />}
                        variant="emphasis"
                        onClick={this.toggleHook}
                      />}
                      key="hook-share-enabled"
                    />
                  </Table.Row>
                </Table.Rows>
              </Table>
            </div>
          </Dialog>
        </Modal>
      </div>
    );
  }
}

ShareConfiguration.propTypes = propTypes;

const mapStateToProps = store => ({
  currentFhirServer: store.fhirServerState.currentFhirServer,
  currentPatientId: store.patientState.currentPatient.id,
  currentHook: store.hookState.currentHook,
  currentServices: store.cdsServicesState.configuredServiceUrls,
});

export default connect(mapStateToProps)(ShareConfiguration);
