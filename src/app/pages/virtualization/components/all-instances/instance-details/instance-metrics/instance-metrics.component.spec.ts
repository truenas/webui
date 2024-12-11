import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import { VirtualizationInstance, VirtualizationInstanceMetrics } from 'app/interfaces/virtualization.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { InstanceMetricsLineChartComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-metrics/instance-metrics-linechart/instance-metrics-linechart.component';
import { ApiService } from 'app/services/websocket/api.service';
import { InstanceMetricsComponent } from './instance-metrics.component';

describe('InstanceMetricsComponent', () => {
  let spectator: Spectator<InstanceMetricsComponent>;

  const mockInstance: VirtualizationInstance = {
    id: '1',
    name: 'Test Instance',
    status: VirtualizationStatus.Running,
  } as VirtualizationInstance;

  const mockMetrics: VirtualizationInstanceMetrics = {
    cpu: { cpu_user_percentage: 10 },
    mem_usage: { mem_usage_ram_mib: 20 },
    io_full_pressure: { io_full_pressure_full_60_percentage: 30 },
  } as VirtualizationInstanceMetrics;

  const createComponent = createComponentFactory({
    component: InstanceMetricsComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponent(InstanceMetricsLineChartComponent),
    ],
    providers: [
      mockProvider(ApiService, {
        subscribe: jest.fn(() => of({ fields: mockMetrics })),
      }),
      mockProvider(IxFormatterService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { instance: mockInstance },
    });
  });

  it('shows the title "Metrics"', () => {
    expect(spectator.query('h3')).toHaveText('Metrics');
  });

  it('renders line charts when the instance is running', () => {
    expect(spectator.queryAll(InstanceMetricsLineChartComponent)).toHaveLength(3);
  });

  it('passes correct data to CPU chart', () => {
    spectator.detectChanges();

    const cpuChart = spectator.queryAll(InstanceMetricsLineChartComponent)[0];
    expect(cpuChart).toBeTruthy();
    expect(cpuChart.title).toBe('CPU');
    expect(cpuChart.data).toEqual([10]);
  });

  it('passes correct data to Memory chart', () => {
    spectator.detectChanges();

    const memoryChart = spectator.queryAll(InstanceMetricsLineChartComponent)[1];
    expect(memoryChart).toBeTruthy();
    expect(memoryChart.title).toBe('Memory');
    expect(memoryChart.data).toEqual([20]);
  });

  it('passes correct data to Disk I/O chart', () => {
    spectator.detectChanges();

    const ioChart = spectator.queryAll(InstanceMetricsLineChartComponent)[2];
    expect(ioChart).toBeTruthy();
    expect(ioChart.title).toBe('Disk I/O Full Pressure');
    expect(ioChart.data).toEqual([30]);
  });

  it('shows a message when the instance is not running', () => {
    spectator.setInput('instance', { ...mockInstance, status: VirtualizationStatus.Stopped });
    expect(spectator.query(InstanceMetricsLineChartComponent)).toBeNull();
    expect(spectator.query('mat-card-content')).toHaveText('Instance is not running');
  });
});
