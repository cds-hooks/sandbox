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
        current: newVal
      });
    }
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
    var delButton = (this.props.hook.id === "new") ? null :
      <button className='delete-hook btn btn-danger btn-sm' onClick={this.deleteHook}>Delete</button>;

    var className = "edit-hook";
    if (this.props.hook.id == "new")
      className += " new-hook";

    return (
      <div className={className}>
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
      <a className='configure-hooks' onClick={this.startEditing}><i className="glyphicon glyphicon-cog"></i> Configure Hooks</a>
    );

    var current = this.props.editing && this.props.hooks.map((h, hname) => <OneHook hook={h.toJS()}/>).valueSeq().toJS() || [];

    if (this.props.editing)
      current.push(<OneHook className="new-hook" hook={{
        id: "new"
      }}/>)

    return (<div id="hook-container" className="hook-editor">{edit}{current}</div>);
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

