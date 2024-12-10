import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TinyColor } from '@ctrl/tinycolor';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Color, ChartDataset, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DatasetType } from 'app/enums/dataset.enum';
import {
  DatasetDetails, DiskSpace, DiskSpaceKey, SwatchColors,
} from 'app/interfaces/dataset.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { ThemeService } from 'app/services/theme/theme.service';

@UntilDestroy()
@Component({
  selector: 'ix-space-management-chart',
  templateUrl: './space-management-chart.component.html',
  styleUrls: ['./space-management-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    BaseChartDirective,
    FileSizePipe,
    PercentPipe,
  ],
})
export class SpaceManagementChartComponent {
  readonly dataset = input.required<DatasetDetails>();

  swatchColors: SwatchColors;
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

  readonly isZvol = computed(() => this.dataset().type === DatasetType.Volume);

  readonly chartDatasets = computed(() => {
    const data: DiskSpace[] = [];
    if (this.isZvol()) {
      data.push(
        { usedbydataset: this.dataset().usedbydataset.parsed },
      );
    } else {
      data.push(
        { usedbydataset: this.dataset().usedbydataset.parsed },
        { usedbychildren: this.dataset().usedbychildren.parsed },
      );
    }

    return this.makeDatasets(data);
  });

  constructor(
    private themeService: ThemeService,
  ) {}

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
      const color = this.themeService.getRgbBackgroundColorByIndex(index);
      const backgroundColor = new TinyColor(color).setAlpha(0.85).toHex8String();
      (ds.backgroundColor as Color[]).push(backgroundColor);
      (ds.borderColor as Color[]).push(color);
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
