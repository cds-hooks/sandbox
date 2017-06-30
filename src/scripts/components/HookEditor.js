import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes';
import striptags from 'striptags';
import {Modal, Button, Alert, DropdownButton, MenuItem} from 'react-bootstrap';

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
  render() {
    var current = this.props.editing && this.props.hooks.map((h, hname) => <OneHook key={h.get('id')} hook={h.toJS()}/>).valueSeq().toJS() || [];

    var addServiceModal = <Modal show={this.state.showModal} onHide={this.hideModal}>
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
    </Modal>;

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
        </span>
        {current}
      </div>);
  },
   resetHooks(){
    AppDispatcher.dispatch({
      type: ActionTypes.RESET_HOOKS
    })
  },

  addHook(){
    this.setState({isNewInputWindow: false});
    if (this.isValidDiscoveryEndpoint()) {
      this.hideModal();
      this.setState({showUrlBannerError: false});
      AppDispatcher.dispatch({
        type: ActionTypes.QUICK_ADD_HOOK,
        url: this.state.discoveryEndpoint
      });
      this.setState({discoveryEndpoint: ''});
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
  }

});

module.exports = HookEditor;

