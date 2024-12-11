import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetArbitraryTextComponent } from 'app/pages/dashboard/widgets/custom/arbitrary-text/widget-arbitrary-text.component';

describe('WidgetArbitraryTextSettings', () => {
  let spectator: Spectator<WidgetArbitraryTextComponent>;
  const createComponent = createComponentFactory({
    component: WidgetArbitraryTextComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        settings: {
          widgetTitle: 'Widget Title',
          widgetText: 'Widget Text',
          widgetSubText: 'Widget Subtext',
        },
        size: SlotSize.Quarter,
      },
    });
  });

  it('renders arbitrary text and title', () => {
    const widget = spectator.query(WidgetDatapointComponent);
    expect(widget).toBeTruthy();
    expect(widget.label()).toBe('Widget Title');
    expect(widget.text()).toBe('Widget Text');
    expect(widget.subText()).toBe('Widget Subtext');
  });
});
