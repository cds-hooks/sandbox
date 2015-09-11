import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes';
import striptags from 'striptags';

const OneHook = React.createClass({
  getInitialState(){
    return {};
  },
  componentWillMount(){
    this.componentWillReceiveProps(this.props);
  },
  componentWillReceiveProps(newProps){
    var newVal = JSON.stringify(newProps.hook, null,2);
    if (newVal !== this.state.original) {
      this.setState({original: newVal, current: newVal});
      console.log("Reset original")
    }
  },
  deleteHook() {
    AppDispatcher.dispatch({
      type: ActionTypes.DELETE_HOOK,
      id: this.props.hook.id
    })
  },
  saveHook() {
    console.log("SAving", this.props.hook.id);
    AppDispatcher.dispatch({
      type: ActionTypes.SAVE_HOOK,
      id: this.props.hook.id,
      value: JSON.parse(this.state.current)
    })
  },

  getCurrent(){
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

  triggerUpdate(){
    this.setState({current: this.getCurrent()});
  },

  render() {
    console.log("Render hook", this.props.hook)
    var delButton = (this.props.hook.id === "new") ? null :
      <button
    className='save-hook'
    onClick={this.deleteHook}>
    delete
    </button>;

    var className = "edit-hook";
    if (this.props.hook.id=="new") className += " new-hook";

    return (<div className={className}>
            <button className='save-hook'
            disabled={this.state.original == this.state.current}
            onClick={this.saveHook}>save</button>
            {delButton}
            <div contentEditable
            className="edit-hook-inner"
            ref='content'
            onInput={this.triggerUpdate}
            key={this.state.original}
            dangerouslySetInnerHTML={{__html: this.state.original
              .replace(/\n/g, "<br/>")
              .replace(/ /g, "&nbsp;")
            }} />
            </div>
           );
  }
});

const HookEditor = React.createClass({
  componentWillReceiveProps(nextProps){
  },

  render() {
    var edit = (<button
                className='btn btn-default configure-hooks'
                onClick={this.startEditing}>
                Configure Hooks
                </button>);

                var current = this.props.editing && Object
                .keys(this.props.hooks.toList()).map(h => 
                                            <OneHook hook={h.toJS()}/>) || [];

                                            if (this.props.editing)
                                              current.push(<OneHook className="new-hook" hook={{id: "new"}}/>)

                                            return (<div className="hook-editor">{edit}{current}</div>);
  },

  startEditing() {
    if (!this.props.editing)
      return AppDispatcher.dispatch({
        type: ActionTypes.NEW_HOOK
      })
      return AppDispatcher.dispatch({
        type: ActionTypes.SAVE_HOOK,
        discard: true
      })


  }

});

module.exports = HookEditor;
