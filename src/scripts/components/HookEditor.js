import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes';
import striptags from 'striptags';

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
  componentWillReceiveProps(nextProps) {},

  render() {

    var edit = (
      <a className='configure-hooks' onClick={this.startEditing}><i className="glyphicon glyphicon-cog"></i> Configure CDS Services</a>
    );

    var reset = (
      <a className='configure-hooks' onClick={this.resetHooks}><i className="glyphicon glyphicon-leaf"></i>Reset</a>
    );

    var add = (
      <a className='configure-hooks' onClick={this.addHook}><i className="glyphicon glyphicon-plus"></i>Quick Add</a>
    );

    var current = this.props.editing && this.props.hooks.map((h, hname) => <OneHook key={h.get('id')} hook={h.toJS()}/>).valueSeq().toJS() || [];

    if (this.props.editing)
      current.push(<OneHook key="new" className="new-hook" hook={{
        id: "new",
        enabled: "true"
      }}/>)

      return (<div id="hook-container" className="hook-editor">
        <span className="hook-buttons"> {add}{reset}{edit}</span>
        {current}
      </div>);
  },
   resetHooks(){
    AppDispatcher.dispatch({
      type: ActionTypes.RESET_HOOKS
    })
  },

  addHook(){
    var url = prompt("CDS Service Provider URL");
    AppDispatcher.dispatch({
      type: ActionTypes.QUICK_ADD_HOOK,
      url: url
    })
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

