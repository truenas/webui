import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetSystemUptimeComponent } from 'app/pages/dashboard/widgets/system/widget-system-uptime/widget-system-uptime.component';
import { LocaleService } from 'app/services/locale.service';

describe('WidgetSystemUptimeComponent', () => {
  let spectator: Spectator<WidgetSystemUptimeComponent>;
  const refreshInterval$ = new BehaviorSubject<number>(0);

  const createComponent = createComponentFactory({
    component: WidgetSystemUptimeComponent,
  });

  describe('has successful response', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
        providers: [
          mockProvider(LocaleService, {
            getDateAndTime: () => ['2024-03-15', '10:34:11'],
            getDateFromString: (date: string) => new Date(date),
          }),
          mockProvider(WidgetResourcesService, {
            systemInfo$: of({
              value: {
                uptime_seconds: 83532.938532175,
                datetime: {
                  $date: 1710491651000,
                },
              } as SystemInfo,
              isLoading: false,
              error: null,
            } as LoadingState<SystemInfo>),
            refreshInterval$,
          }),
        ],
      });
    });

    it('renders System Uptime for the current system', () => {
      const widget = spectator.query(WidgetDatapointComponent);
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('23 hours 12 minutes as of 10:34');
      expect(widget.label()).toBe('System Uptime');
    });

    it('checks uptime and datetime changed over time', () => {
      jest.useFakeTimers();

      const initialUptime = spectator.component.uptime();
      const initialDatetime = spectator.component.datetime();

      jest.advanceTimersByTime(5000);
      refreshInterval$.next(1);

      spectator.detectChanges();

      const updatedUptime = spectator.component.uptime();
      const updatedDatetime = spectator.component.datetime();

      expect(updatedUptime).toBeGreaterThan(initialUptime);
      expect(updatedDatetime).toBe(initialDatetime);

      jest.useRealTimers();
    });
  });

  describe('no successful response', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(LocaleService, {
            getDateAndTime: () => ['2024-03-15', '10:34:11'],
            getDateFromString: (date: string) => new Date(date),
          }),
          mockProvider(WidgetResourcesService, {
            systemInfo$: of({
              value: null,
              isLoading: false,
              error: new Error('Fatal error'),
            } as LoadingState<SystemInfo>),
            refreshInterval$,
          }),
        ],
      });
    });

    it('shows an error when System Uptime cannot be determined', () => {
      expect(spectator.fixture.nativeElement).toHaveExactTrimmedText('Fatal error');
    });
  });
});
