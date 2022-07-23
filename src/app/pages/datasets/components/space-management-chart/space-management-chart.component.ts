import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ChartColor, ChartDataSets, ChartOptions } from 'chart.js';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';
import { WebSocketService } from 'app/services';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'ix-space-management-chart',
  templateUrl: './space-management-chart.component.html',
  styleUrls: ['./space-management-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceManagementChartComponent implements OnChanges {
  @Input() dataset: DatasetInTree;

  isLoading = false;
  extraProperties: Dataset;
  subscription: Subscription;
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
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private themeService: ThemeService,
  ) {}

  ngOnChanges(): void {
    this.loadExtraProperties();
  }

  loadExtraProperties(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.subscription?.unsubscribe();
    this.subscription = this.ws.call('pool.dataset.query', [[['id', '=', this.dataset.id]]]).pipe(
      map((datasets) => datasets[0]),
      untilDestroyed(this),
    ).subscribe((dataset) => {
      this.extraProperties = dataset;
      this.updateChartData();
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  private updateChartData(): void {
    const data: number[] = [];
    if (this.isZvol) {
      data.push(
        this.extraProperties.usedbydataset.parsed,
        this.extraProperties.usedbysnapshots.parsed,
      );
    } else {
      data.push(
        this.extraProperties.usedbydataset.parsed,
        this.extraProperties.usedbysnapshots.parsed,
        this.extraProperties.usedbychildren.parsed,
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
