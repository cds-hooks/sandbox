import React from 'react';
import { shallow } from 'enzyme';

import { CardList } from '../../../src/components/CardList/card-list';

describe('Card List component', () => {
  let cardResponses;

  beforeEach(() => {
    cardResponses = {
        cards : [{
          links : [
            {
              type : "smart",
              url : "https://test-url.com"
            }
          ]
        }]
      }
  });

  it('does not error on empty launchLinks when link type is smart', () => {
    let component = shallow(<CardList cardResponses={cardResponses} />);
    expect(component).toBeDefined();
  });
});
