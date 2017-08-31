import React from 'react';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ActionTypes from '../actions/ActionTypes'
import {Panel, PanelGroup, ListGroup, ListGroupItem} from 'react-bootstrap';

var format = v => {
  var formatData = JSON.stringify(v, null, 2);
  var formatJson = formatData ? JSON.stringify(v, null, 2).split(/\n/) : '';
  if (formatJson) {
    return formatJson.filter((word) => word.trim().indexOf('"key"') !== 0);
  }
  return formatJson;
};

const FhirView = React.createClass({

  getInitialState(){

    return {
      requestAdditions: [],
      responseAdditions: [],
      shouldHighlightRequest: false,
      shouldHighlightResponse: false,
      output: '',
      activeTab: 1,
      isOpen: true
    }
  },

  shouldComponentUpdate(nextProps){
    if (nextProps.all.get('decisions').get('serviceRequestBody') !== this.props.all.get('decisions').get('serviceRequestBody')) {
      return true;
    } else if (nextProps.isServiceViewEnabled !== this.props.isServiceViewEnabled) {
      return true;
    } else if (nextProps.isConsoleLogEnabled !== this.props.isConsoleLogEnabled) {
      return true;
    } else if (nextProps.all.get('decisions').get('serviceResponseBody') !== this.props.all.get('decisions').get('serviceResponseBody')) {
      return true;
    } else if (nextProps.hook !== this.props.hook) {
      return true;
    } else if (nextProps.all.getIn(['hooks', 'hooks']) !== this.props.all.getIn(['hooks', 'hooks'])) {
      return true;
    }
    return false;
  },

  componentWillReceiveProps(newProps) {
    if (newProps.hook !== this.props.hook) {
      AppDispatcher.dispatch({
        type: ActionTypes.SET_SERVICE,
        service: this.state.all.getIn(['hooks', 'hooks']).filter((hook) => {
          return hook.get('hook') === newProps.hook
        }).first().get('id')
      });
    }
    var oldRequest = format(this.props.all.get('decisions').get('serviceRequestBody'));
    var newRequest = format(newProps.all.get('decisions').get('serviceRequestBody'));
    if (newRequest) {
      var reqDiff = newRequest.filter((l, ind) => oldRequest.indexOf(l) === -1);
      if (this.state.requestAdditions && this.state.requestAdditions.length !== 0) {
        this.setState({
          shouldHighlightRequest: true,
        });
      }
    }

    if (this.props.all.get('decisions').get('serviceResponseBody')) {
      var oldResponse = format(this.props.all.get('decisions').get('serviceResponseBody'));
      var newResponse = format(newProps.all.get('decisions').get('serviceResponseBody'));
      if (newResponse) {
        var resDiff = newResponse.filter((l, ind) => oldResponse.indexOf(l) === -1);
        if (this.state.responseAdditions && this.state.responseAdditions.length !== 0) {
          this.setState({
            shouldHighlightResponse: true,
          });
        }
      }
    }

    this.setState({
      requestAdditions: reqDiff,
      responseAdditions: resDiff
    });
  },

  componentDidUpdate() {
    if (this.state.requestAdditions && this.state.requestAdditions.length === 0) {
      this.setState({shouldHighlightRequest: true});
    }
    if (this.state.responseAdditions && this.state.responseAdditions.length === 0) {
      this.setState({shouldHighlightResponse: true});
    }
  },

  lineStyle(isAddition, isRequest) {
    if (isRequest === 'request') {
      return isAddition && this.state.shouldHighlightRequest ? "line fade-actual" : "line";
    }
    return isAddition && this.state.shouldHighlightResponse ? "line fade-actual" : "line";
  },

  handleSelect(activeTab) {
    this.setState({ activeTab });
  },

  handleServiceChange(event) {
    AppDispatcher.dispatch({
      type: ActionTypes.SET_SERVICE,
      service: event.target.value
    });
  },

  render() {
    var requestAdditions = this.state.requestAdditions;
    if (this.props.all.getIn(['decisions', 'serviceRequestBody'])) {
      var output = format(this.props.all.getIn(['decisions', 'serviceRequestBody'])).map((l, i) => (
        <div
          key={i}
          ref={i}
          className={this.lineStyle(requestAdditions.indexOf(l) !== -1, 'request')}> {l}
        </div>
      ));
      console.log("CDS Service Request", format(this.props.all.getIn(['decisions', 'serviceRequestBody'])));
    }

    var responseOutput = '';
    var responseAdditions = this.state.responseAdditions;
    if (this.props.all.getIn(['decisions', 'serviceResponseBody'])) {
      responseOutput = format(this.props.all.getIn(['decisions', 'serviceResponseBody'])).map((l, i) => (
        <div
          key={i}
          ref={i}
          className={responseAdditions ? this.lineStyle(responseAdditions.indexOf(l) !== -1, 'response') : ''}> {l}
        </div>
      ));
      console.log("CDS Service Response", format(this.props.all.getIn(['decisions', 'serviceResponseBody'])));
    }

    var requestPanel = (
      <Panel eventKey='1' collapsible defaultCollapsed header="Request">
        <div className={this.props.isServiceViewEnabled ? 'fhir-view fhir-view-visible panel-height' : 'fhir-view panel-height'}>
          <pre className={this.props.isServiceViewEnabled ? '' : 'hidden'}>{output}</pre>
        </div>
       </Panel>
    );

    var responsePanel = (
      <Panel eventKey='2' collapsible defaultExpanded header="Response">
        <div className='fhir-view fhir-view-visible panel-height'>
          <pre className=''>
            {responseOutput ? responseOutput : ''}
          </pre>
        </div>
      </Panel>
    );

    var contextClass = this.props.isServiceViewEnabled ? 'order-entry cds-service-view context-open' : 'order-entry cds-service-view';
    var validServices = this.props.all.getIn(['hooks', 'hooks']).filter((hook) => {
      return hook.get('hook') === this.props.hook;
    });

    if (validServices && validServices.size){
      return (
        <div className={contextClass}>
          <div className='wrap-context'>
            <h1 className="view-title">CDS Service Exchange</h1>
            <label className='service-dropdown-select'>Select a Service:
              <select value={this.props.all.getIn(['decisions', 'serviceSelected'])} onChange={this.handleServiceChange}>
                {
                  validServices.map((hook, serviceName) =>
                    <option key={hook.get('id')} value={serviceName}>{serviceName}</option>
                  ).valueSeq().toJS()
                }
              </select>
            </label>
            <PanelGroup bsClass='panel-group panel-container' activeKey={this.state.activePanel} onSelect={this.handleSelect}>
              {requestPanel}
              {responsePanel}
            </PanelGroup>
          </div>
          <button onClick={this.props.toggleServiceView} className="context-toggle">
            Context Toggle
          </button>
        </div>
      );
    } else {
      return (<div className="fhir-view fhir-view-visible"><pre className="fhir-text"><div className="line">(No CDS Services configured for this hook)</div></pre></div>)
    }
  },

});

module.exports = FhirView;
