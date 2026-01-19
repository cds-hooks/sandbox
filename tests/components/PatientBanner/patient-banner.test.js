import React from 'react';
import { render, screen, cleanup } from '../../test-utils';

import * as pb from '../../../src/components/PatientBanner/patient-banner';

describe('Patient Banner component', () => {
  let props = {
    patientName: 'Morris',
    patientId: '123',
  };

  afterEach(() => {
    cleanup();
  });

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
    const { container } = render(component);
    expect(container.textContent).toContain(pb.defaultName);
    expect(container.textContent).toContain(pb.defaultId);
  });

  it('contains a name and id when a patient is selected', () => {
    let component = <pb.PatientBanner {...props} />;
    const { container } = render(component);
    expect(container.textContent).toContain(props.patientName);
    expect(container.textContent).toContain(props.patientId);
  });
});
