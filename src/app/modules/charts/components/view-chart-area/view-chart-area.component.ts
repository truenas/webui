import {
  Component, OnDestroy, ChangeDetectionStrategy,
  input,
  computed,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  Chart, ChartOptions,
  ChartConfiguration,
  ChartData,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

@Component({
  selector: 'ix-view-chart-area',
  templateUrl: './view-chart-area.component.html',
  styleUrls: ['./view-chart-area.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class ViewChartAreaComponent implements OnDestroy {
  // TODO: Replace when ng-mocks get viewChild support
  // See https://github.com/help-me-mom/ng-mocks/issues/8634
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement>;
  data = input.required<ChartData<'line'>>();
  options = input<ChartOptions<'line'>>();
  height = input<number>(192);

  chart: Chart;
  maxSources = 8;

  config = computed<ChartConfiguration>(() => {
    return {
      type: 'line',
      data: this.data(),
      options: this.options(),
    };
  });

  constructor() {
    effect(() => {
      if (this.data() && !this.chart) {
        this.render();
      }

      if (this.data() && this.chart) {
        this.chart.data = this.data();
        this.chart.update();
      }
    });
  }

  render(): void {
    if (this.data().datasets.length > this.maxSources) {
      this.data().datasets = this.data().datasets.slice(0, this.maxSources);
    }

    this.chart = new Chart(this.canvas.nativeElement, this.config());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
