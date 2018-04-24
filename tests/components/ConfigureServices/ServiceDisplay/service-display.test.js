import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import * as types from '../../../../src/actions/action-types';

import ConnectedView, {ServiceDisplay} from '../../../../src/components/ConfigureServices/ServiceDisplay/service-display';

describe('ServiceDisplay component', () => {
  let storeState;
  let mockStoreWrapper = configureStore([]);
  let mockStore;
  console.error = jest.fn();

  let url;
  let urlDefinition;
  let component;
  let pureComponent;

  beforeEach(() => {
    mockStore = mockStoreWrapper({});
    url = 'http://example.com';
    urlDefinition = {
      enabled: true,
      hook: 'patient-view'
    };
    component = shallow(<ConnectedView store={mockStore} 
                                       serviceUrl={url}
                                       definition={urlDefinition} />);
    pureComponent = component.find('ServiceDisplay').shallow();
  });

  it('serves a services property in the component', () => {
    expect(component.prop('definition')).toBeDefined();
    expect(component.prop('serviceUrl')).toBeDefined();
  });

  it('toggles enabled status for a service if the enabled button is clicked', () => {
    pureComponent.find('.btn-container').find('Button').at(0).simulate('click');
    expect(mockStore.getActions()).toEqual([{
      type: types.TOGGLE_SERVICE,
      service: url,
    }]);
  });

  it('deletes a configured service if the delete button is clicked', () => {
    pureComponent.find('.btn-container').find('Button').at(1).simulate('click');
    expect(mockStore.getActions()).toEqual([{
      type: types.DELETE_SERVICE,
      service: url,
    }]);
  });
});
