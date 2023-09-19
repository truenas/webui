import {
  Input,
  Component,
  OnChanges,
  HostBinding,
  AfterViewInit, ChangeDetectionStrategy,
} from '@angular/core';
import { ChartDataset, ChartOptions } from 'chart.js';
import { Theme } from 'app/interfaces/theme.interface';
import { ThemeService } from 'app/services/theme/theme.service';
import './rounded-doughnut.class';

const defaultHeight = 300;
const defaultWidth = 250;
const gapPercentage = 17;
const gapRotation = 45 * 5;

@Component({
  selector: 'ix-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  private _colorFill: string;
  private _colorBlank: string;
  chartData: ChartDataset[] = [{ data: [] }];
  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    rotation: gapRotation,
  };

  constructor(public themeService: ThemeService) {}

  ngOnChanges(): void {
    this.refresh();
  }

  ngAfterViewInit(): void {
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
