import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SummaryComponent } from 'app/modules/summary/summary.component';

describe('SummaryComponent', () => {
  let spectator: Spectator<SummaryComponent>;
  const createComponent = createComponentFactory({
    component: SummaryComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        summary: [
          [
            {
              label: 'First Name',
              value: 'John',
            },
            {
              label: 'Last Name',
              value: 'Smith',
            },
          ],
          [
            {
              label: 'Age',
              value: '27',
            },
          ],
        ],
      },
    });
  });

  it('shows summary items', () => {
    const items = spectator.queryAll('.summary-line');

    expect(items).toHaveLength(3);

    expect(items[0]).toHaveDescendantWithText({
      selector: '.summary-line-label',
      text: 'First Name:',
    });
    expect(items[0]).toHaveDescendantWithText({
      selector: '.summary-line-value',
      text: 'John',
    });

    expect(items[1]).toHaveDescendantWithText({
      selector: '.summary-line-label',
      text: 'Last Name:',
    });
    expect(items[1]).toHaveDescendantWithText({
      selector: '.summary-line-value',
      text: 'Smith',
    });

    expect(items[2]).toHaveDescendantWithText({
      selector: '.summary-line-label',
      text: 'Age:',
    });
    expect(items[2]).toHaveDescendantWithText({
      selector: '.summary-line-value',
      text: '27',
    });
  });

  it('shows summary sections separately', () => {
    const items = spectator.queryAll('.summary-line');

    expect(items[0]).toHaveClass('section-start');
    expect(items[1]).not.toHaveClass('section-start');
    expect(items[2]).toHaveClass('section-start');
  });
});
