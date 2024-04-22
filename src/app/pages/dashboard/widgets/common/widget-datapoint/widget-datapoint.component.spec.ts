import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';

describe('WidgetDatapointComponent', () => {
  let spectator: Spectator<WidgetDatapointComponent>;

  const label = 'Test label';
  const text = 'Test text';
  const subText = 'Test sub text';

  const createComponent = createComponentFactory({
    component: WidgetDatapointComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Half,
        label,
        text,
        subText,
      },
    });
  });

  it(`it has label '${label}'`, () => {
    expect(spectator.query('.header')).toContainText(label);
  });

  it(`it has text '${text}'`, () => {
    expect(spectator.query('.container')).toContainText(text);
  });

  it(`it has sub text '${subText}'`, () => {
    expect(spectator.query('.container')).toContainText(subText);
  });
});
