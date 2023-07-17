import {
  Component, Input, OnDestroy, OnChanges, ViewChild, ElementRef,
} from '@angular/core';
import {
  Chart, ChartData, ChartOptions, ChartConfiguration,
} from 'chart.js';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import 'chartjs-adapter-date-fns';

@Component({
  selector: 'ix-view-chart-area',
  templateUrl: './view-chart-area.component.html',
  styleUrls: ['./view-chart-area.component.scss'],
})
export class ViewChartAreaComponent implements OnDestroy, OnChanges {
  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  @Input() data: ChartData<'line'>;
  @Input() options: ChartOptions<'line'>;

  chart: Chart;
  maxSources = 8;

  makeConfig(data: ChartData): ChartConfiguration {
    return {
      type: 'line',
      data,
      options: this.options,
    };
  }

  render(): void {
    if (!this.data) {
      return;
    }

    if (this.data.datasets.length > this.maxSources) {
      throw new Error('ERROR: Maximum Sources Exceeded. Line/Area charts have a hard limit of 8 data sources');
    }

    this.chart = new Chart(
      this.canvas.nativeElement,
      this.makeConfig(this.data),
    );
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.options || !this.chart) {
      this.render();
    }
    if (changes.data && this.chart) {
      this.chart.data = this.data;
      this.chart.update();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
