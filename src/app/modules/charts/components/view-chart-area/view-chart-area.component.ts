import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [CommonModule],
})
export class ViewChartAreaComponent implements OnDestroy {
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  data = input.required<ChartData<'line'>>();
  options = input<ChartOptions<'line'>>();
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
      if (this.options() || !this.chart) {
        this.render();
      }

      if (this.data() && this.chart) {
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
      this.data().datasets = this.data().datasets.slice(0, this.maxSources);
    }

    this.chart = new Chart(this.canvas().nativeElement, this.config());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
