import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SummaryComponent } from 'app/modules/common/summary/summary.component';

describe('SummaryComponent', () => {
  let spectator: Spectator<SummaryComponent>;
  const createComponent = createComponentFactory({
    component: SummaryComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        summary: {
          'First Name': 'John',
          'Last Name': 'Smith',
        },
      },
    });
  });

  it('shows summary as list items', () => {
    const items = spectator.query('dl');
    const terms = items.querySelectorAll('dt');
    const values = items.querySelectorAll('dd');

    expect(terms[0]).toHaveExactText('First Name:');
    expect(values[0]).toHaveExactText('John');

    expect(terms[1]).toHaveExactText('Last Name:');
    expect(values[1]).toHaveExactText('Smith');
  });
});
