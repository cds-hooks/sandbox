import React from 'react';
import { shallow } from 'enzyme';

import * as pb from '../../../src/components/PatientBanner/patient-banner';

describe('Patient Banner component', () => {
  let props = {
    patientName: 'Morris',
    patientId: '123',
  };

  function expectContainsElement(renderedComponent, expected) {
    expect(renderedComponent.containsMatchingElement(expected)).toBeTruthy();
  }

 it('has a functioning mapStateToProps', () => {
    let state = {
      patientState: {
        currentPatient: {
          name: props.patientName,
          id: props.patientId,
        }
      }
    };
    expect(pb.testingMapStateToProps(state)).toEqual(props);
  });

  it('contains a default name and id when no patient is selected', () => {
    let component = <pb.PatientBanner />;
    let renderedComponent = shallow(component);
    expectContainsElement(renderedComponent, pb.defaultName);
    expectContainsElement(renderedComponent, pb.defaultId);
  });

  it('contains a name and id when a patient is selected', () => {
    let component = <pb.PatientBanner {...props} />;
    let renderedComponent = shallow(component);
    expectContainsElement(renderedComponent, props.patientName);
    expectContainsElement(renderedComponent, props.patientId);
  });
});
