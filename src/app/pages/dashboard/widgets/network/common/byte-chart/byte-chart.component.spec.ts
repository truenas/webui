import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { ChartOptions, TooltipItem } from 'chart.js';
import { ViewChartAreaComponent } from 'app/modules/charts/view-chart-area/view-chart-area.component';
import { LocaleService } from 'app/modules/language/locale.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { ByteChartComponent } from 'app/pages/dashboard/widgets/network/common/byte-chart/byte-chart.component';

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

describe('ByteChartComponent', () => {
  let spectator: Spectator<ByteChartComponent>;
  const createComponent = createComponentFactory({
    component: ByteChartComponent,
    overrideComponents: [
      [ByteChartComponent, {
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
      NetworkSpeedPipe,
      FileSizePipe,
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

  it('defaults to showAsRate=true for network traffic', () => {
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    expect(chart).toBeTruthy();

    // Verify component uses default showAsRate=true
    expect(spectator.component.showAsRate()).toBe(true);
  });

  it('can be configured with showAsRate=false for disk I/O', () => {
    spectator.setInput('showAsRate', false);
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    expect(chart).toBeTruthy();

    // Verify component uses showAsRate=false
    expect(spectator.component.showAsRate()).toBe(false);
  });

  it('formats bytes with rate suffix when showAsRate=true (default)', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.setInput('showAsRate', true);
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    const options = chart.options() as ChartOptions<'line'>;

    // Test Y-axis callback
    // 1,048,576 bytes = 1 MiB (binary, base 2) with /s suffix
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

  it('formats bytes without rate suffix when showAsRate=false', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.setInput('showAsRate', false);
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    const options = chart.options() as ChartOptions<'line'>;

    // Test Y-axis callback
    // 1,048,576 bytes = 1 MiB (binary, base 2) without /s suffix
    const yAxisCallback = options.scales!.y!.ticks!.callback as (value: number) => string | number;
    expect(yAxisCallback.call({}, 1048576)).toBe('1 MiB');

    // Test tooltip callback
    const tooltipCallback = options.plugins!.tooltip!.callbacks!.label as (item: TooltipItem<'line'>) => string;
    const mockTooltipItem = {
      parsed: { y: 1048576 },
      dataset: { label: 'Read' },
    } as TooltipItem<'line'>;
    expect(tooltipCallback(mockTooltipItem)).toBe('Read: 1 MiB');
  });

  it('handles zero values correctly with rate suffix', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    const options = chart.options() as ChartOptions<'line'>;

    const yAxisCallback = options.scales!.y!.ticks!.callback as (value: number) => string | number;
    expect(yAxisCallback.call({}, 0)).toBe('0/s');

    const tooltipCallback = options.plugins!.tooltip!.callbacks!.label as (item: TooltipItem<'line'>) => string;
    const mockTooltipItem = {
      parsed: { y: 0 },
      dataset: { label: 'Test' },
    } as TooltipItem<'line'>;
    expect(tooltipCallback(mockTooltipItem)).toBe('Test: 0/s');
  });

  it('handles zero values with rate suffix when showAsRate=true', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.setInput('showAsRate', true);
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    const options = chart.options() as ChartOptions<'line'>;

    const yAxisCallback = options.scales!.y!.ticks!.callback as (value: number) => string | number;
    expect(yAxisCallback.call({}, 0)).toBe('0/s');

    const tooltipCallback = options.plugins!.tooltip!.callbacks!.label as (item: TooltipItem<'line'>) => string;
    const mockTooltipItem = {
      parsed: { y: 0 },
      dataset: { label: 'Test' },
    } as TooltipItem<'line'>;
    expect(tooltipCallback(mockTooltipItem)).toBe('Test: 0/s');
  });

  it('handles zero values without rate suffix when showAsRate=false', () => {
    spectator.setInput('data', { datasets: [], labels: [] });
    spectator.setInput('showAsRate', false);
    spectator.detectChanges();

    const chart = spectator.query(ViewChartAreaMockComponent)!;
    const options = chart.options() as ChartOptions<'line'>;

    const yAxisCallback = options.scales!.y!.ticks!.callback as (value: number) => string | number;
    expect(yAxisCallback.call({}, 0)).toBe('0');

    const tooltipCallback = options.plugins!.tooltip!.callbacks!.label as (item: TooltipItem<'line'>) => string;
    const mockTooltipItem = {
      parsed: { y: 0 },
      dataset: { label: 'Test' },
    } as TooltipItem<'line'>;
    expect(tooltipCallback(mockTooltipItem)).toBe('Test: 0');
  });
});
