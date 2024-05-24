import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { UptimePipe } from 'app/pages/dashboard/widgets/system/common/uptime.pipe';
import { WidgetSystemUptimeComponent } from 'app/pages/dashboard/widgets/system/widget-system-uptime/widget-system-uptime.component';

describe('WidgetSystemUptimeComponent', () => {
  let spectator: Spectator<WidgetSystemUptimeComponent>;
  const fiveSecondsRefreshInterval$ = new BehaviorSubject<number>(0);

  const createComponent = createComponentFactory({
    component: WidgetSystemUptimeComponent,
    imports: [
      UptimePipe,
    ],
    declarations: [
      MockComponent(WidgetDatapointComponent),
      FakeFormatDateTimePipe,
    ],
  });

  it('renders System Uptime for the current system', () => {
    spectator = createComponent({
      props: {
        size: SlotSize.Full,
      },
      providers: [
        mockProvider(WidgetResourcesService, {
          systemInfo$: of({
            value: {
              uptime_seconds: 83532.938532175,
              datetime: {
                $date: 1710491651000,
              },
            } as unknown as SystemInfo,
            isLoading: false,
            error: null,
          } as LoadingState<SystemInfo>),
          fiveSecondsRefreshInterval$,
        }),
      ],
    });

    const widget = spectator.query(MockComponent(WidgetDatapointComponent));
    expect(widget).toBeTruthy();
    expect(widget.text).toBe('23 hours 12 minutes as of 2024-03-15 10:34:11');
    expect(widget.label).toBe('System Uptime');
  });

  it('shows an error when System Uptime cannot be determined', () => {
    spectator = createComponent({
      providers: [
        mockProvider(WidgetResourcesService, {
          systemInfo$: of({
            value: null,
            isLoading: false,
            error: new Error('Fatal error'),
          } as LoadingState<SystemInfo>),
          fiveSecondsRefreshInterval$,
        }),
      ],
    });

    expect(spectator.fixture.nativeElement).toHaveExactTrimmedText('Error');
  });
});
