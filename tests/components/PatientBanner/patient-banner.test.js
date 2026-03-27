import React from 'react';
import { render, screen } from '@testing-library/react';

import * as pb from '../../../src/components/PatientBanner/patient-banner';

describe('Patient Banner component', () => {
  let props = {
    patientName: 'Morris',
    patientId: '123',
  };

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
    const { container } = render(<pb.PatientBanner />);
    expect(container.textContent).toContain(pb.defaultName);
    expect(container.textContent).toContain(pb.defaultId);
  });

  it('contains a name and id when a patient is selected', () => {
    const { container } = render(<pb.PatientBanner {...props} />);
    expect(container.textContent).toContain(props.patientName);
    expect(container.textContent).toContain(props.patientId);
  });
});
