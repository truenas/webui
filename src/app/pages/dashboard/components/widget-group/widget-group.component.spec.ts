import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { WidgetGroupComponent } from 'app/pages/dashboard/components/widget-group/widget-group.component';

describe('WidgetGroupComponent', () => {
  // TODO:
  // eslint-disable-next-line unused-imports/no-unused-vars
  let spectator: Spectator<WidgetGroupComponent>;
  const createComponent = createComponentFactory({
    component: WidgetGroupComponent,
    shallow: true,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  /* eslint-disable jest/expect-expect */
  it('renders correct group layout based on group layout field', () => {

  });

  it('renders widgets in correct slots and assigns their settings', () => {

  });

  it('leaves a slot empty when widget for that slot is null', () => {

  });

  it('renders Unknown widget type "name" when widget is not recognized', () => {

  });

  it('renders Unexpected widget size when widget does not support slot size', () => {

  });
});
