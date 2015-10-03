import ActionTypes from '../actions/ActionTypes'
import DateStore from './DateStore'
import DrugStore from './DrugStore'
import HookStore from './HookStore'
import FhirServerStore from './FhirServerStore'
import moment from 'moment'

var assign = require('object-assign')
var AppDispatcher = require('../dispatcher/AppDispatcher')
var EventEmitter = require('events').EventEmitter
var Immutable = require('immutable')
var DecisionStore = null

FhirServerStore.addChangeListener(_rxChanged)
DrugStore.addChangeListener(_rxChanged)
DateStore.addChangeListener(_rxChanged)

function _rxChanged() {

  var props = {
    dates: DateStore.getDates(),
    drug: DrugStore.getState(),
    fhirServer: FhirServerStore.getState()
  }

  var resource = toFhir(props)
  DecisionStore.setActivityState('medication-prescribe', resource)
}

function toFhir(props) {
  var resource = {
    "resourceType": "MedicationOrder"
  }
  if (props.dates.start && props.dates.start.enabled)
    resource.startDate = moment(props.dates.start.value).format("YYYY-MM-DD")
  if (props.dates.end && props.dates.end.enabled)
    resource.endDate = moment(props.dates.end.value).format("YYYY-MM-DD")
  resource.status = "draft"
  resource.patient = {
    "reference": "Patient/" + props.fhirServer.getIn(['context', 'patient'])
  }
  if (props.drug && props.drug.get('step') === "done") {
    var freqs = {
      'daily': 1,
      'bid': 2,
      'tid': 3,
      'qid': 4
    }

    if (props.drug.get('sig')) {
      var sig = props.drug.get('sig').toJS();
      resource.dosageInstruction = [{
        doseQuantity: {
          value: sig.number,
          system: "http://unitsofmeasure.org",
          code: "{pill}"
        },
        timing: [{
          repeat: {
            frequency: freqs[sig.frequency],
            period: 1,
            periodUnits: "d"
          }
        }]
      }];
    }

    var med = props.drug.getIn(['decisions', 'prescribable']).toJS();

    resource.medicationCodeableConcept = {
      "text": med.str,
      "coding": [{
        "display": med.str,
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": med.cui
      }]
    }
  }

  var reason = FhirServerStore.getSelectionAsFhir()
  if (reason) {
    resource.reasonCodeableConcept = reason
  }
  return Immutable.fromJS(resource)
}


var MedicationPrescribeStore = assign({}, EventEmitter.prototype, {
  getState: function() {
    return state
  },

  register(ds){
    DecisionStore = ds
    return this
  },

  processChange: function(){
    _rxChanged()
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT)
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback)
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }


})

var state = Immutable.fromJS({
  'activity': 'medication-prescribe',
  'fhir': {}
}).set('activityStore', MedicationPrescribeStore)
console.log("my internal state", state.get('activityStore'), MedicationPrescribeStore)

module.exports = MedicationPrescribeStore
