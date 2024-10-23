import { PercentPipe } from '@angular/common';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockDirective } from 'ng-mocks';
import { BaseChartDirective } from 'ng2-charts';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ThemeService } from 'app/services/theme/theme.service';
import { SpaceManagementChartComponent } from './space-management-chart.component';

describe('SpaceManagementChartComponent', () => {
  let spectator: Spectator<SpaceManagementChartComponent>;

  const createComponent = createComponentFactory({
    component: SpaceManagementChartComponent,
    imports: [FileSizePipe, PercentPipe],
    declarations: [
      MockDirective(BaseChartDirective),
    ],
    providers: [
      mockProvider(ThemeService, {
        getRgbBackgroundColorByIndex: jest.fn((index) => `rgb(${index * 10}, ${index * 10}, ${index * 10})`),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataset: {
          type: DatasetType.Filesystem,
          used: { parsed: 100 },
          usedbydataset: { parsed: 60 },
          usedbychildren: { parsed: 30 },
        } as DatasetDetails,
      },
    });
  });

  it('should generate chart datasets', () => {
    spectator.detectChanges();
    expect(spectator.component.chartDatasets()).toEqual([
      {
        data: [60, 30],
        backgroundColor: ['#000000d9', '#0a0a0ad9'],
        borderColor: ['rgb(0, 0, 0)', 'rgb(10, 10, 10)'],
        borderWidth: 1,
        type: 'doughnut',
      },
    ]);
  });

  it('should display the total allocation', () => {
    const chartHeader = spectator.query('.chart-header');
    expect(chartHeader).toHaveText('Total Allocation: 100');
  });

  it('should display legend items with correct colors', () => {
    const legendLabels = spectator.queryAll('.legend-label');
    const legendSwatches = spectator.queryAll('.legend-swatch');

    expect(legendLabels[0]).toHaveText('Data Written');
    expect(legendSwatches[0].getAttribute('style')).toContain('background-color: rgba(0, 0, 0, 0.851);');

    expect(legendLabels[1]).toHaveText('Children');
    expect(legendSwatches[1].getAttribute('style')).toContain('background-color: rgba(10, 10, 10, 0.851);');
  });
});
