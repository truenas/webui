import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetPoolNameComponent } from 'app/pages/dashboard/widgets/memory/widget-pool-name/widget-pool-name.component';

describe('WidgetPoolNameComponent', () => {
  let spectator: Spectator<WidgetPoolNameComponent>;
  const createComponent = createComponentFactory({
    component: WidgetPoolNameComponent,
    providers: [
      mockProvider(WidgetResourcesService, {
        getPoolById: jest.fn(() => of([{ name: 'Pool 1', id: 1 }])),
      }),
    ],
    declarations: [
      MockComponent(WidgetDatapointComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        settings: {
          poolId: '1',
        },
        size: SlotSize.Quarter,
      },
    });
  });

  it('renders pool name', () => {
    const widget = spectator.query(MockComponent(WidgetDatapointComponent));
    expect(widget).toBeTruthy();
    expect(widget.text).toBe('Pool 1');
  });
});
