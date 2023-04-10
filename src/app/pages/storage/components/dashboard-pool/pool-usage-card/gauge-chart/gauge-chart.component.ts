import {
  Input,
  Component,
  OnChanges,
  ElementRef,
  ViewChild,
  HostBinding,
  AfterViewInit,
} from '@angular/core';
import {
  Chart, ChartDataSets, ChartOptions,
} from 'chart.js';
import { Theme } from 'app/interfaces/theme.interface';
import { ThemeService } from 'app/services/theme/theme.service';

interface ChartElement {
  transition: (easing: number) => {
    draw: () => void;
  };
  _view: Chart.DoughnutModel;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
Chart.defaults.roundedDoughnut = Chart.helpers.clone(Chart.defaults.doughnut);
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
Chart.controllers.roundedDoughnut = Chart.controllers.doughnut.extend({
  draw(ease: number) {
    const ctx = this.chart.chart.ctx as CanvasRenderingContext2D;

    const easingDecimal = ease || 1;
    let tmpView: Chart.DoughnutModel;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    Chart.helpers.each(this.getMeta().data, (chartElem: ChartElement, index: number) => {
      if (index === 2) {
        return;
      }

      chartElem.transition(easingDecimal).draw();

      const view = chartElem._view;
      const radius = (view.outerRadius + view.innerRadius) / 2;
      const thickness = (view.outerRadius - view.innerRadius) / 2;
      const angle = Math.PI / 2 - view.startAngle;
      const angle2 = Math.PI / 2 - view.endAngle;

      ctx.save();

      if (index === 0) {
        tmpView = view;
      }

      if (index === 0) {
        // Draw rounded beginning for 1st item
        ctx.fillStyle = view.backgroundColor as string;

        ctx.translate(view.x, view.y);
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(angle),
          radius * Math.cos(angle),
          0.9 * thickness,
          0,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.translate(-view.x, -view.y);

        ctx.fill();
      }
      if (index === 1) {
        // Draw rounded ending for 2nd item
        ctx.fillStyle = view.backgroundColor as string;

        ctx.translate(view.x, view.y);
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(angle2),
          radius * Math.cos(angle2),
          0.9 * thickness,
          0,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.translate(-view.x, -view.y);

        ctx.fill();
      }

      if (index === 1) {
        // Draw handle circle (1st item color)
        ctx.fillStyle = tmpView.backgroundColor as string;

        ctx.translate(view.x, view.y);
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(angle),
          radius * Math.cos(angle),
          0.9 * thickness,
          0,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.translate(-view.x, -view.y);

        ctx.fill();

        // Draw center outer circle
        ctx.fillStyle = '#0000';
        ctx.beginPath();
        ctx.arc(view.x, view.y, radius - 2.2 * thickness, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        // Draw center inner circle
        ctx.fillStyle = '#0000';
        ctx.beginPath();
        ctx.arc(view.x, view.y, radius - 3.2 * thickness, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });
  },
});

const defaultHeight = 300;
const defaultWidth = 250;
const gapPercentage = 17;
const gapRotation = (3 / 4) * Math.PI;

@Component({
  selector: 'ix-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss'],
})
export class GaugeChartComponent implements OnChanges, AfterViewInit {
  @Input()
  set colorFill(color: string) {
    this._colorFill = this.conversionColor(color);
  }

  get colorFill(): string {
    return this._colorFill;
  }
  @Input()
  set colorBlank(color: string) {
    if (!this.themeService.isDarkTheme()) {
      const altBg2 = this.themeService.currentTheme()['alt-bg2'];
      this._colorBlank = this.conversionColor(altBg2);
      return;
    }
    this._colorBlank = this.conversionColor(color);
  }

  get colorBlank(): string {
    return this._colorBlank;
  }
  @Input() label: string;
  @Input() value: number;
  @Input() @HostBinding('style.height.px') height = defaultHeight;
  @Input() @HostBinding('style.width.px') width = defaultWidth;

  @ViewChild('canvas') canvasRef: ElementRef;
  private _colorFill: string;
  private _colorBlank: string;
  chartData: ChartDataSets[] = [{ data: [] }];
  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutoutPercentage: 70,
    animation: {
      animateRotate: false,
    },
    tooltips: {
      enabled: false,
    },
    rotation: gapRotation,
  };

  constructor(public themeService: ThemeService) {}

  ngAfterViewInit(): void {
    this.refresh();
  }

  ngOnChanges(): void {
    this.refresh();
  }

  private refresh(): void {
    this.chartData = [
      {
        data: [
          this.value,
          100 - this.value,
          (gapPercentage / 100) * 2 * [this.value, 100 - this.value].reduce((sum, x) => sum + x, 0),
        ],
        backgroundColor: [this.colorFill, this.colorBlank, '#000000'],
        hoverBackgroundColor: [this.colorFill, this.colorBlank, '#000000'],
        borderColor: this.colorBlank,
        hoverBorderColor: this.colorBlank,
        type: 'roundedDoughnut',
      },
    ];
  }

  private conversionColor(color: string): string {
    const colorType = this.themeService.getUtils().getValueType(color);
    let resultColor = color;
    switch (colorType) {
      case 'cssVar': {
        const cssVar = color.replace('var(--', '').replace(')', '') as keyof Theme;
        resultColor = this.themeService.currentTheme()[cssVar] as string;
        return this.conversionColor(resultColor);
      }
      case 'rgba':
        resultColor = this.themeService.getUtils().rgbToHex(color);
        return resultColor;
    }
    return resultColor;
  }
}
