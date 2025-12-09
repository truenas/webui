import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { ChartOptions, TooltipItem } from 'chart.js';
import { ViewChartAreaComponent } from 'app/modules/charts/view-chart-area/view-chart-area.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { NetworkChartComponent } from 'app/pages/dashboard/widgets/network/common/network-chart/network-chart.component';

// TODO: Update when fix is ready
// See https://github.com/help-me-mom/ng-mocks/issues/8634

@Component({
  selector: 'ix-view-chart-area-mock',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ViewChartAreaMockComponent {
  data = input();
  options = input();
}

describe('NetworkChartComponent', () => {
  let spectator: Spectator<NetworkChartComponent>;
  const createComponent = createComponentFactory({
    component: NetworkChartComponent,
    overrideComponents: [
      [NetworkChartComponent, {
        add: {
          imports: [ViewChartAreaMockComponent],
          template: '<ix-view-chart-area-mock [data]="data()" [options]="options()"></ix-view-chart-area-mock>',
        },
        remove: { imports: [ViewChartAreaComponent] },
      }],
    ],
    providers: [
      mockProvider(LocaleService, {
        timeFormat: 'HH:mm',
        dateFormat: 'MM-DD',
      }),
    ],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows a chart with network traffic', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    expect(chart).toBeTruthy();

    const data = chart.data();
    expect(data).toMatchObject({
      datasets: [],
      labels: [],
    });
  });

  it('defaults to bits unit (b) for network traffic', () => {
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    expect(chart).toBeTruthy();

    // Verify component uses default 'b' unit
    expect(spectator.component.unit()).toBe('b');
  });

  it('uses bytes unit (B) when specified for disk I/O', () => {
    spectator.setInput('unit', 'B');
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    expect(chart).toBeTruthy();

    // Verify component uses 'B' unit
    expect(spectator.component.unit()).toBe('B');
  });

  it('formats network traffic with decimal base (base 10) for bits', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    const options = chart.options() as ChartOptions<'line'>;

    // Test Y-axis callback
    // 1,000,000 bits = 1 Mb (decimal, base 10)
    const yAxisCallback = options.scales!.y!.ticks!.callback as (value: number) => string | number;
    expect(yAxisCallback.call({}, 1000000)).toBe('1 Mb/s');

    // Test tooltip callback
    const tooltipCallback = options.plugins!.tooltip!.callbacks!.label as (item: TooltipItem<'line'>) => string;
    const mockTooltipItem = {
      parsed: { y: 1000000 },
      dataset: { label: 'Upload' },
    } as TooltipItem<'line'>;
    expect(tooltipCallback(mockTooltipItem)).toBe('Upload: 1 Mb/s');
  });

  it('formats disk I/O with binary base (base 2) for bytes', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.setInput('unit', 'B');
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    const options = chart.options() as ChartOptions<'line'>;

    // Test Y-axis callback
    // 1,048,576 bytes = 1 MiB (binary, base 2)
    const yAxisCallback = options.scales!.y!.ticks!.callback as (value: number) => string | number;
    expect(yAxisCallback.call({}, 1048576)).toBe('1 MiB/s');

    // Test tooltip callback
    const tooltipCallback = options.plugins!.tooltip!.callbacks!.label as (item: TooltipItem<'line'>) => string;
    const mockTooltipItem = {
      parsed: { y: 1048576 },
      dataset: { label: 'Read' },
    } as TooltipItem<'line'>;
    expect(tooltipCallback(mockTooltipItem)).toBe('Read: 1 MiB/s');
  });

  it('handles zero values correctly in both units', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    const options = chart.options() as ChartOptions<'line'>;

    const yAxisCallback = options.scales!.y!.ticks!.callback as (value: number) => string | number;
    expect(yAxisCallback.call({}, 0)).toBe(0);

    const tooltipCallback = options.plugins!.tooltip!.callbacks!.label as (item: TooltipItem<'line'>) => string;
    const mockTooltipItem = {
      parsed: { y: 0 },
      dataset: { label: 'Test' },
    } as TooltipItem<'line'>;
    expect(tooltipCallback(mockTooltipItem)).toBe('Test: 0/s');
  });
});
