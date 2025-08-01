import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ChartData } from 'chart.js';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { LocaleService } from 'app/modules/language/locale.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetCpuTempRecentComponent } from 'app/pages/dashboard/widgets/cpu/widget-cpu-temperature-recent/widget-cpu-temp-recent.component';

describe('WidgetCpuTempRecentComponent', () => {
  let spectator: Spectator<WidgetCpuTempRecentComponent>;
  const startDate = new Date('2024-07-23');

  const createComponent = createComponentFactory({
    component: WidgetCpuTempRecentComponent,
    imports: [NgxSkeletonLoaderModule],
    declarations: [
      MockDirective(BaseChartDirective),
    ],
    providers: [
      mockProvider(
        WidgetResourcesService,
        {
          realtimeUpdates$: of({
            fields: {
              cpu: {
                cpu: {
                  usage: 10,
                  temp: 20,
                },
              },
            },
          }),
        },
      ),
      mockProvider(LocaleService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        size: SlotSize.Half,
      },
    });
    const dateNowStub = jest.fn(() => startDate.getTime());
    global.Date.now = dateNowStub;
  });

  it('shows title', () => {
    expect(spectator.query('h3')).toHaveText('CPU Recent Temperature');
  });

  it('shows a chart with cpu usage', () => {
    const chart = spectator.query(BaseChartDirective)!;
    expect(chart).not.toBeNull();
    expect(chart.type).toBe('line');

    const data = chart.data as ChartData<'line'>;
    expect(data).toMatchObject({
      datasets: [
        {
          label: 'Usage',
          data: expect.arrayContaining([
            expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
          ]),
          pointBackgroundColor: '#c006c7d9',
        },
      ],
    });
  });
});
