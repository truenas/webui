import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { WidgetErrorComponent } from 'app/pages/dashboard/components/widget-error/widget-error.component';

describe('WidgetErrorComponent', () => {
  let spectator: Spectator<WidgetErrorComponent>;
  const createComponent = createComponentFactory({
    component: WidgetErrorComponent,
    shallow: true,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        message: 'Widget failed successfully',
      },
    });
  });

  it('renders an icon', () => {
    expect(spectator.query('ix-icon.icon')).toExist();
  });

  it('renders the error message provided', () => {
    expect(spectator.query('.message')).toHaveExactText('Widget failed successfully');
  });
});
