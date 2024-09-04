import React from 'react';
import { mount, shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import intlContexts from './intl-context-setup';

import ConnectedView, {ConfigureServices} from '../../../src/components/ConfigureServices/configure-services';

describe('ConfigureServices component', () => {
  let storeState;
  let mockStore;
  let mockStoreWrapper = configureStore([]);
  console.error = jest.fn();

  let mockClosePrompt;

  beforeEach(() => {
    const url = 'http://example.com';
    const urlDefinition = {
      enabled: true,
      hook: 'patient-view'
    };
    storeState = {
      cdsServicesState: {
        configuredServices: {
          [url]: urlDefinition,
        },
      },
    };
    mockStore = mockStoreWrapper(storeState);
    mockClosePrompt = jest.fn();
  });

  it('serves a services property in the component', () => {
    let component = shallow(<ConnectedView store={mockStore} />);
    expect(component.prop('services')).toBeDefined();
  });

  it('changes isOpen state property if props changes for the property', () => {
    let component = mount(<ConfigureServices store={mockStore} isOpen={false} />, intlContexts.mountContext);
    expect(component.prop('isOpen')).toEqual(false);
    component.setProps({ isOpen: true });
    expect(component.prop('isOpen')).toEqual(true);
  });

  it('handles closing the modal in the component', async () => {
    let component = shallow(<ConnectedView store={mockStore} 
                                           isOpen={true} 
                                           closePrompt={mockClosePrompt} />, intlContexts.shallowContext);
    let childComponent = component.find('ConfigureServices'); 
    let shallowedComponent = childComponent.shallow();                         
    await shallowedComponent.find('Dialog').dive().find('ContentContainer').dive().find('.right-align').find('Button').at(0).simulate('click');
    expect(mockClosePrompt).toHaveBeenCalled();
  });
});
