import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ChartColor, ChartDataSets, ChartOptions } from 'chart.js';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
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

  chartData: ChartDataSets[] = [{ data: [] }];
  chartOptions: ChartOptions = {
    tooltips: {
      enabled: false,
    },
    responsive: false,
    maintainAspectRatio: true,
    legend: {
      display: false,
    },
    responsiveAnimationDuration: 0,
    animation: {
      duration: 0,
      animateRotate: false,
      animateScale: false,
    },
    hover: {
      animationDuration: 0,
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
    const data: number[] = [];
    if (this.isZvol) {
      data.push(
        this.dataset.usedbydataset.parsed,
        this.dataset.usedbysnapshots.parsed,
      );
    } else {
      data.push(
        this.dataset.usedbydataset.parsed,
        this.dataset.usedbysnapshots.parsed,
        this.dataset.usedbychildren.parsed,
      );
    }
    this.chartData = this.makeDatasets(data);
  }

  private makeDatasets(data: number[]): ChartDataSets[] {
    const datasets: ChartDataSets[] = [];
    const filteredData = data.filter(Boolean);
    const ds: ChartDataSets = {
      data: filteredData,
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
      type: 'doughnut',
    };

    filteredData.forEach((_, index) => {
      const bgRgb = this.themeService.getRgbBackgroundColorByIndex(index);
      (ds.backgroundColor as ChartColor[]).push(this.themeService.getUtils().rgbToString(bgRgb, 0.85));
      (ds.borderColor as ChartColor[]).push(this.themeService.getUtils().rgbToString(bgRgb));
    });

    datasets.push(ds);

    return datasets;
  }
}
