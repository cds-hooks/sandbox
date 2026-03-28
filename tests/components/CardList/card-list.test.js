import React from 'react';
import { render, screen } from '@testing-library/react';

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
    render(<CardList cardResponses={cardResponses} takeSuggestion={jest.fn()} />);
    expect(screen.getByText('Cannot launch SMART link without a SMART-enabled FHIR server')).toBeInTheDocument();
  });
});
