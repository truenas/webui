import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { Ng2FittextDirective } from 'ng2-fittext';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { PoolUsageGaugeComponent } from 'app/pages/dashboard/widgets/storage/widget-pool/common/pool-usage-gauge/pool-usage-gauge.component';
import { WidgetPoolUsageGaugeComponent } from 'app/pages/dashboard/widgets/storage/widget-pool-usage-gauge/widget-pool-usage-gauge.component';

describe('WidgetPoolUsageGaugeComponent', () => {
  let spectator: Spectator<WidgetPoolUsageGaugeComponent>;
  const createComponent = createComponentFactory({
    component: WidgetPoolUsageGaugeComponent,
    imports: [
      Ng2FittextDirective,
      NgxSkeletonLoaderComponent,
      MockComponent(PoolUsageGaugeComponent),
      MockComponent(WidgetDatapointComponent),
    ],
  });

  describe('pool exists', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          size: SlotSize.Quarter,
          settings: {
            poolId: '1',
          },
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getPoolById: jest.fn().mockReturnValue(of({
              name: 'Test Pool',
            })),
          }),
        ],
      });
      spectator.detectChanges();
    });

    it('should display pool name when pool exists', () => {
      expect(spectator.component.poolExists).toBeTruthy();
      expect(spectator.query('h3')).toHaveText('Test Pool');
    });

    it('should have info component', () => {
      expect(spectator.query(PoolUsageGaugeComponent)).toBeTruthy();
    });
  });

  describe('pool does not exist', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          size: SlotSize.Quarter,
          settings: {
            poolId: '1',
          },
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getPoolById: jest.fn().mockReturnValue(of(null)),
          }),
        ],
      });
      spectator.detectChanges();
    });

    it('should render "Pool does not exist" message', () => {
      const component = spectator.query(WidgetDatapointComponent);
      expect(component.label).toBe('Pool Usage');
      expect(component.text).toBe('Pool does not exist');
    });
  });
});
