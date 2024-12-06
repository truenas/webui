import {
  Component,
  HostBinding, ChangeDetectionStrategy, input, computed,
} from '@angular/core';
import { TinyColor } from '@ctrl/tinycolor';
import { ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { Theme } from 'app/interfaces/theme.interface';
import { ThemeService } from 'app/services/theme/theme.service';
import './rounded-doughnut.class';

const defaultHeight = 300;
const defaultWidth = 250;
const gapPercentage = 17;
const gapRotation = 45 * 5;

// TODO: Similar, but not exactly like view-chart-gauge
@Component({
  selector: 'ix-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseChartDirective,
  ],
})
export class GaugeChartComponent {
  label = input('');
  value = input<number>();

  colorFill = input<string, string>('', {
    transform: (color: string) => this.conversionColor(color),
  });

  colorBlank = input<string, string>('', {
    transform: (color: string) => {
      if (!this.themeService.isDarkTheme()) {
        // TODO: Hardcoded case.
        const altBg2 = this.themeService.currentTheme()['alt-bg2'];
        return this.conversionColor(altBg2);
      }
      return this.conversionColor(color);
    },
  });

  readonly height = input(defaultHeight);
  readonly width = input(defaultWidth);

  @HostBinding('style.height.px') get heightStyle(): number { return this.height(); }
  @HostBinding('style.width.px') get widthStyle(): number { return this.width(); }

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

  chartData = computed(() => {
    return [
      {
        data: [
          this.value(),
          100 - this.value(),
          (gapPercentage / 100) * 2 * [this.value(), 100 - this.value()].reduce((sum, x) => sum + x, 0),
        ],
        backgroundColor: [this.colorFill(), this.colorBlank(), '#000000'],
        hoverBackgroundColor: [this.colorFill(), this.colorBlank(), '#000000'],
        borderColor: this.colorBlank(),
        hoverBorderColor: this.colorBlank(),
        type: 'roundedDoughnut',
      },
    ];
  });

  private conversionColor(color: string): string {
    const colorType = (new ThemeUtils()).getValueType(color);
    let resultColor = color;
    switch (colorType) {
      case 'cssVar': {
        const cssVar = color.replace('var(--', '').replace(')', '') as keyof Theme;
        resultColor = this.themeService.currentTheme()[cssVar] as string;
        return this.conversionColor(resultColor);
      }
      case 'rgba':
        resultColor = new TinyColor(color).toHex8String();
        return resultColor;
    }
    return resultColor;
  }
}
