import {
  createComponentFactory, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxLabelComponent } from 'app/modules/ix-forms/components/ix-label/ix-label.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

describe('IxLabelComponent', () => {
  let spectator: Spectator<IxLabelComponent>;
  const createComponent = createComponentFactory({
    component: IxLabelComponent,
    declarations: [
      MockComponent(TooltipComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        label: 'First Name',
        tooltip: 'Enter your first name.',
        required: true,
      },
    });
  });

  it('renders a label', () => {
    spectator.setInput('label', 'First Name');

    expect(spectator.query('.label')).toHaveText('First Name');
  });

  it('renders a tooltip when it is provided', () => {
    spectator.setInput('tooltip', 'Enter your first name');

    const tooltip = spectator.query(TooltipComponent);
    expect(tooltip.header).toBe('First Name');
    expect(tooltip.message).toBe('Enter your first name');
  });

  it('shows an asterisk when label is provided and required is true', () => {
    spectator.setInput('label', 'First Name');
    spectator.setInput('required', true);

    expect(spectator.query('.label')).toHaveText('First Name*');
  });
});
