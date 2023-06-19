import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Color, ChartDataset, ChartOptions } from 'chart.js';
import { DatasetType } from 'app/enums/dataset.enum';
import {
  DatasetDetails, DiskSpace, DiskSpaceKey, SwatchColors,
} from 'app/interfaces/dataset.interface';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'ix-space-management-chart',
  templateUrl: './space-management-chart.component.html',
  styleUrls: ['./space-management-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceManagementChartComponent implements OnChanges {
  @Input() dataset: DatasetDetails;

  swatchColors: SwatchColors;
  filteredData: DiskSpace[];
  chartData: ChartDataset[] = [{ data: [] }];
  chartOptions: ChartOptions<'doughnut'> = {
    plugins: {
      tooltip: {
        enabled: false,
      },
      legend: {
        display: false,
      },
    },
    responsive: false,
    maintainAspectRatio: true,
    animation: {
      duration: 0,
    },
  };

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
  }

  constructor(
    private themeService: ThemeService,
  ) {}

  ngOnChanges(): void {
    if (this.dataset?.type) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    // TODO: Used by Snapshots was removed.
    // Details in comments sections: https://ixsystems.atlassian.net/browse/NAS-118891

    const data: DiskSpace[] = [];
    if (this.isZvol) {
      data.push(
        { usedbydataset: this.dataset.usedbydataset.parsed },
      );
    } else {
      data.push(
        { usedbydataset: this.dataset.usedbydataset.parsed },
        { usedbychildren: this.dataset.usedbychildren.parsed },
      );
    }
    this.chartData = this.makeDatasets(data);
  }

  private makeDatasets(data: DiskSpace[]): ChartDataset[] {
    const datasets: ChartDataset[] = [];
    const filteredData = data.filter((obj) => Object.values(obj)[0]);
    const usedData = filteredData.map((obj) => Object.values(obj)[0]);
    this.swatchColors = {};

    const ds: ChartDataset = {
      data: usedData,
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
      type: 'doughnut',
    };

    filteredData.forEach((usedDataset, index) => {
      const bgRgb = this.themeService.getRgbBackgroundColorByIndex(index);
      const backgroundColor = this.themeService.getUtils().rgbToString(bgRgb, 0.85);
      (ds.backgroundColor as Color[]).push(backgroundColor);
      (ds.borderColor as Color[]).push(this.themeService.getUtils().rgbToString(bgRgb));
      const keyDiskSpace = Object.keys(usedDataset)[0] as keyof DiskSpace;

      if (Object.values(DiskSpaceKey).includes(keyDiskSpace)) {
        this.swatchColors[keyDiskSpace] = {
          backgroundColor,
        };
      }
    });

    datasets.push(ds);

    return datasets;
  }
}
