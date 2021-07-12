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

  render(): Chart {
    if (this.data.datasets.length > this.maxSources) {
      throw new Error('ERROR: Maximum Sources Exceeded. Line/Area charts have a hard limit of 8 data sources');
    }

    return new Chart(
      this.canvas.nativeElement,
      this.makeConfig(this.data),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.chart = this.render();

    if (changes.data) {
      if (changes.data.firstChange) {
        this.chart = this.render();
      } else if (this.chart) {
        this.chart.update();
      }
    }

    if (changes.options) {
      this.chart = this.render();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }
}
