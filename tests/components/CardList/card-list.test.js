import React from 'react';
import { render } from '../../test-utils';

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
    const { container } = render(<CardList cardResponses={cardResponses} takeSuggestion={jest.fn()} />);
    expect(container).toBeDefined();
  });
});
