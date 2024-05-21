import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetPoolNameComponent } from 'app/pages/dashboard/widgets/storage/widget-pool-name/widget-pool-name.component';

describe('WidgetPoolNameComponent', () => {
  let spectator: Spectator<WidgetPoolNameComponent>;
  const createComponent = createComponentFactory({
    component: WidgetPoolNameComponent,
    declarations: [
      MockComponent(WidgetDatapointComponent),
    ],
  });

  describe('Pool Available', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          settings: {
            poolId: '1',
          },
          size: SlotSize.Quarter,
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getPoolById: jest.fn(() => of({ name: 'Pool 1', id: 1 })),
          }),
        ],
      });
    });

    it('renders pool', () => {
      const widget = spectator.query(MockComponent(WidgetDatapointComponent));
      expect(widget).toBeTruthy();
      expect(widget.label).toBe('Pool Name');
      expect(widget.text).toBe('Pool 1');
    });
  });

  describe('Pool Not Available', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          settings: {
            poolId: '404',
          },
          size: SlotSize.Quarter,
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getPoolById: jest.fn(() => throwError(() => new Error())),
          }),
        ],
      });
    });

    it('renders "No Pool Selected" when selected pool is not available', () => {
      const widget = spectator.query(MockComponent(WidgetDatapointComponent));
      expect(widget).toBeTruthy();
      expect(widget.text).toBe('No Pool Selected');
    });
  });
});
