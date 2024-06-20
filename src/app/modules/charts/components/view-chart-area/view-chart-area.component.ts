import {
  Component, OnDestroy, ElementRef, ChangeDetectionStrategy,
  input,
  computed,
  effect,
  viewChild,
} from '@angular/core';
import {
  Chart, ChartData, ChartOptions, ChartConfiguration,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

@Component({
  selector: 'ix-view-chart-area',
  templateUrl: './view-chart-area.component.html',
  styleUrls: ['./view-chart-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewChartAreaComponent implements OnDestroy {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  data = input.required<ChartData<'line'>>();
  options = input.required<ChartOptions<'line'>>();
  height = input<number>(192);

  chart: Chart;
  maxSources = 8;

  config = computed<ChartConfiguration>(() => {
    const data = this.data();
    const options = this.options();
    return { type: 'line', data, options };
  });

  constructor() {
    effect(() => {
      if (!this.data() || !this.options()) {
        return;
      }

      if (!this.chart) {
        this.render();
      } else {
        this.chart.data = this.data();
        this.chart.update();
      }
    });
  }

  render(): void {
    if (!this.data()) {
      return;
    }

    if (this.data().datasets.length > this.maxSources) {
      throw new Error('ERROR: Maximum Sources Exceeded. Line/Area charts have a hard limit of 8 data sources');
    }

    this.chart = new Chart(this.canvas().nativeElement, this.config());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
