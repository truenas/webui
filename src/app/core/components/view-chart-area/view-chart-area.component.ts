import {
  Component, Input, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef,
} from '@angular/core';
import { Chart, ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'view-chart-area',
  templateUrl: './view-chart-area.component.html',
  styleUrls: ['./view-chart-area.component.scss'],
})
export class ViewChartAreaComponent implements OnDestroy, OnChanges {
  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  @Input() data: ChartData;
  @Input() options: ChartOptions;

  chart: Chart;
  maxSources = 8;

  makeConfig(data: ChartData): Chart.ChartConfiguration {
    return {
      type: 'line',
      data,
      options: this.options,
    };
  }

  render(data: ChartData): Chart {
    if (data.datasets.length > this.maxSources) {
      throw new Error('ERROR: Maximum Sources Exceeded. Line/Area charts have a hard limit of 8 data sources');
    }

    return new Chart(
      this.canvas.nativeElement,
      this.makeConfig(data),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data) {
      if (changes.data.firstChange) {
        this.chart = this.render(changes.data.currentValue);
      } else if (this.chart) {
        this.chart.data = changes.data.currentValue;
        this.chart.update();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }
}
