import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes';
import HookStore from '../stores/HookStore';
import striptags from 'striptags';
import {Modal, Button, Alert, DropdownButton, MenuItem} from 'react-bootstrap';
import $ from 'jquery';

const OneHook = React.createClass({
  getInitialState() {
    return {};
  },
  componentWillMount() {
    this.componentWillReceiveProps(this.props);
  },
  componentWillReceiveProps(newProps) {
    var newVal = JSON.stringify(newProps.hook, null, 2);
    if (newVal !== this.state.original) {
      this.setState({
        original: newVal,
        current: newVal,
        enabled: newProps.hook.enabled
      });
    }
  },
  toggleHook() {
    AppDispatcher.dispatch({
      type: ActionTypes.TOGGLE_ENABLED,
      id: this.props.hook.id
    })
  },
   deleteHook() {
    AppDispatcher.dispatch({
      type: ActionTypes.DELETE_HOOK,
      id: this.props.hook.id
    })
  },
  saveHook() {
    AppDispatcher.dispatch({
      type: ActionTypes.SAVE_HOOK,
      id: this.props.hook.id,
      value: JSON.parse(this.state.current)
    })
  },
  getCurrent() {
    var val = this.refs.content.getDOMNode().innerHTML.replace(/\&nbsp;/g, " ");
    var stripped = striptags(val).replace(/&amp;/g, "&");
    var current;
    try {
      current = JSON.stringify(JSON.parse(stripped), null, 2);
    } catch (e) {
      current = stripped;
    }
    return current;
  },

  triggerUpdate() {
    this.setState({
      current: this.getCurrent()
    });
  },

  render() {
    var toggleButton = (this.props.hook.id === "new") ? null : <button className='btn btn-warning btn-sm toggle-hook' onClick={this.toggleHook}>Enabled?
        <span className={"glyphicon " + (this.state && this.state.enabled ? "glyphicon-check" : "glyphicon-unchecked")} aria-hidden="true"></span>
      </button>
    var delButton = (this.props.hook.id === "new") ? null :
      <button className='delete-hook btn btn-danger btn-sm' onClick={this.deleteHook}>Delete</button>;

    var className = "edit-hook";
    if (this.props.hook.id == "new")
      className += " new-hook";

    return (
      <div className={className}>
        {toggleButton}
        <button className='save-hook btn btn-success btn-sm' disabled={this.state.original == this.state.current} onClick={this.saveHook}>Save</button>
        {delButton}
        <div contentEditable
          className="edit-hook-inner"
          ref='content'
          onInput={this.triggerUpdate}
          key={this.state.original}
          dangerouslySetInnerHTML={{
            __html: this.state.original
              .replace(/\n/g, "<br/>")
              .replace(/ /g, "&nbsp;")
          }} />
        </div>
      );
  }
});

const HookEditor = React.createClass({
  getInitialState() {
    return {
      showModal: false,
      showUrlBannerError: false,
      discoveryEndpoint: '',
      isNewInputWindow: true,
      showConnectionModal: false
    };
  },
  componentWillReceiveProps(nextProps) {},
  showModal() {
    this.setState({showModal: true});
  },
  hideModal() {
    this.setState({showModal: false});
    this.setState({isNewInputWindow: true});
  },
  handleChange(event) {
    this.setState({discoveryEndpoint: event.target.value.toString().trim() });
  },
  isValidDiscoveryEndpoint() {
    var url = this.state.discoveryEndpoint;
    var endpoint = "/cds-services";
    if (url.length < endpoint.length) return false;

    // Check if the url ends with the '/cds-services' endpoint
    return url.lastIndexOf(endpoint) === (url.length - endpoint.length);
  },
  hideAlert() {
    if (this.state.isNewInputWindow) return 'remove-display';
    return this.state.showUrlBannerError ? '' : 'remove-display';
  },

  resetHooks(){
    AppDispatcher.dispatch({
      type: ActionTypes.RESET_HOOKS
    })
  },

  setServiceResponseBanner(response) {
    if (response === 'success') {
      this.setState({
        serviceConfigResponse: 'success',
        showConnectionModal: true
      });
    } else if (response === 'failure') {
      this.setState({
        serviceConfigResponse: 'failure',
        showConnectionModal: true
      });
    } else if (response === 'empty') {
      this.setState({
        serviceConfigResponse: 'empty',
        showConnectionModal: true
      });
    } else {
      this.setState({
        serviceConfigResponse: 'none',
        showConnectionModal: false
      })
    }
  },

  hideConnectionModal() {
    this.setState({
      showConnectionModal: false
    });
  },

  addHook(){
    this.setState({isNewInputWindow: false});
    if (this.isValidDiscoveryEndpoint()) {
      var dfd = $.Deferred();
      this.hideModal();
      this.setState({showUrlBannerError: false});

      var checkUrl = this.state.discoveryEndpoint.trim();
      if (!/^(https?:)?\/\//i.test(checkUrl)) {
        checkUrl = 'http://' + checkUrl;
        this.setState({
          discoveryEndpoint: checkUrl
        });
      }

      var serviceFetchResponse = HookStore.checkValidService(checkUrl, dfd);

      serviceFetchResponse.then(function(result) {
        if (result.status === 200) {
          if (result.hasOwnProperty('data') && result.data.hasOwnProperty('services')) {
            var services = result.data.services;
            if (services.length === 0) {
              this.setServiceResponseBanner('empty');
            } else {
              this.setServiceResponseBanner('success');
              AppDispatcher.dispatch({
                type: ActionTypes.QUICK_ADD_HOOK,
                url: this.state.discoveryEndpoint
              });
            }
          }
          dfd = $.Deferred();
          this.setState({ discoveryEndpoint: '' });
        } else {
          this.setServiceResponseBanner('failure');
          dfd = $.Deferred();
          this.setState({discoveryEndpoint: ''});
        }
      }.bind(this));
    } else {
      this.setState({showUrlBannerError: true});
    }
  },

  startEditing() {
    if (!this.props.editing) {
      document.getElementById("hook-container").classList.add("editor-open");
      return AppDispatcher.dispatch({
        type: ActionTypes.NEW_HOOK
      })
    } else {
      document.getElementById("hook-container").classList.remove("editor-open");
    }
    return AppDispatcher.dispatch({
      type: ActionTypes.SAVE_HOOK,
      discard: true
    })
  },

  render() {
    var current = this.props.editing && this.props.hooks.map((h, hname) => <OneHook key={h.get('id')} hook={h.toJS()}/>).valueSeq().toJS() || [];

    var addServiceModal = (<Modal show={this.state.showModal} onHide={this.hideModal}>
      <Modal.Header closeButton>
        <Modal.Title>Add CDS Service</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert bsStyle="danger" className={this.hideAlert()}>
          <i className="glyphicon glyphicon-exclamation-sign" /> <strong>Invalid endpoint: </strong>URL must end at <i>/cds-services</i>
        </Alert>
        <div className="input-container">
          <label>Discovery Endpoint URL:</label>
          <input className="form-control"
                 autofocus={true}
                 placeholder={"https://example-service.com/cds-services"}
                 type="text"
                 onChange={this.handleChange}
          />
        </div>
        <div>
          <i>Note: See <a href='http://cds-hooks.org/#discovery'>documentation</a> for more details regarding the Discovery endpoint.</i>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button bsStyle="primary" onClick={this.addHook}>Save</Button>
        <Button onClick={this.hideModal}>Close</Button>
      </Modal.Footer>
    </Modal>);

    var serviceConnectionBannerFail = (
      <div className="remove-margin">
        <Alert bsStyle="danger">
          <i className="glyphicon glyphicon-exclamation-sign" />
          <strong> Error: </strong>
          Cannot connect to the discovery endpoint. See console for details.
        </Alert>
      </div>
    );

    var serviceConnectionBannerSuccess = (
      <div className="remove-margin">
        <Alert bsStyle="success">
          <i className="glyphicon glyphicon-ok" />
          <strong> Success: </strong>
          Configured CDS Service(s) found at the discovery endpoint.
        </Alert>
      </div>
    );

    var serviceConnectionBannerWarning = (
      <div className="remove-margin">
        <Alert bsStyle="warning">
          <i className="glyphicon glyphicon-warning-sign" />
          <strong> Warning: </strong>
          There is a successful connection to the discovery endpoint, but there are no CDS Services to configure.
        </Alert>
      </div>
    );

    var bannerToUse;

    switch (this.state.serviceConfigResponse) {
      case "success":
        bannerToUse = serviceConnectionBannerSuccess;
        break;
      case "failure":
        bannerToUse = serviceConnectionBannerFail;
        break;
      case "empty":
        bannerToUse = serviceConnectionBannerWarning;
        break;
      default:
        bannerToUse = '';
    }

    var serviceConnectionModal = (
      <Modal show={this.state.showConnectionModal} onHide={this.hideConnectionModal}>
        <Modal.Header closeButton>
          <Modal.Title>Discovery Endpoint Result</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bannerToUse}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.hideConnectionModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    );

    if (this.props.editing)
      current.push(<OneHook key="new" className="new-hook" hook={{
        id: "new",
        enabled: "true"
      }}/>)

      return (<div id="hook-container" className="hook-editor">
        <span className="hook-buttons">
          <DropdownButton className="glyphicon configure-hooks"
                          title={<span><i className="glyphicon glyphicon-wrench"></i>CDS Services</span>}
                          id='dropdownConfigureButton' pullRight>
            <MenuItem className="dropdown-config-item" onClick={this.showModal} eventKey="1">
              <i className="glyphicon glyphicon-plus" />
                Add CDS Service
            </MenuItem>
            <MenuItem divider />
            <MenuItem className="dropdown-config-item" onClick={this.resetHooks} eventKey="2">
              <i className="glyphicon glyphicon-leaf" />
                Reset Configuration
            </MenuItem>
            <MenuItem divider />
            <MenuItem className="dropdown-config-item" onClick={this.startEditing} eventKey="3">
              <i className="glyphicon glyphicon-cog" />
                Configure CDS Services
            </MenuItem>
          </DropdownButton>
          {addServiceModal}
          {serviceConnectionModal}
        </span>
        {current}
      </div>);
  }

});

module.exports = HookEditor;

