import { Component, HostBinding, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { TinyColor } from '@ctrl/tinycolor';
import { ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Theme } from 'app/interfaces/theme.interface';
import { ThemeService } from 'app/modules/theme/theme.service';
import './rounded-doughnut.class';

const defaultHeight = 300;
const defaultWidth = 250;
const gapPercentage = 17;
const gapRotation = 45 * 5;

export interface GaugeSegment {
  value: number;
  color: string;
}

// TODO: Similar, but not exactly like view-chart-gauge
@Component({
  selector: 'ix-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseChartDirective,
  ],
})
export class GaugeChartComponent {
  themeService = inject(ThemeService);

  label = input('');
  sublabel = input('');
  value = input.required<number>();
  segments = input<GaugeSegment[]>();

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

  chartData = computed(() => {
    const segmentsInput = this.segments();
    if (segmentsInput?.length) {
      const values = segmentsInput.map((segment) => segment.value);
      const totalUsed = values.reduce((sum, val) => sum + val, 0);
      const blankValue = Math.max(0, 100 - totalUsed);
      const allValues = [...values, blankValue];
      const gapValue = (gapPercentage / 100) * 2 * allValues.reduce((sum, val) => sum + val, 0);
      const colors = [...segmentsInput.map((segment) => this.conversionColor(segment.color)), this.colorBlank()];

      return [{
        data: [...allValues, gapValue],
        backgroundColor: [...colors, '#000000'],
        hoverBackgroundColor: [...colors, '#000000'],
        borderColor: this.colorBlank(),
        hoverBorderColor: this.colorBlank(),
        type: 'roundedDoughnut' as const,
      }];
    }

    return [{
      data: [
        this.value(),
        100 - this.value(),
        (gapPercentage / 100) * 2 * [this.value(), 100 - this.value()].reduce((sum, x) => sum + x, 0),
      ],
      backgroundColor: [this.colorFill(), this.colorBlank(), '#000000'],
      hoverBackgroundColor: [this.colorFill(), this.colorBlank(), '#000000'],
      borderColor: this.colorBlank(),
      hoverBorderColor: this.colorBlank(),
      type: 'roundedDoughnut' as const,
    }];
  });

  private conversionColor(color: string): string {
    let resultColor = color;

    // Handle CSS variable format (e.g., 'var(--blue)')
    if (color.startsWith('var')) {
      const cssVar = color.replace('var(--', '').replace(')', '') as keyof Theme;
      resultColor = this.themeService.currentTheme()[cssVar] as string;
      return this.conversionColor(resultColor);
    }

    // Convert RGBA to hex format for chart compatibility
    if (color.startsWith('rgba(')) {
      return new TinyColor(color).toHex8String();
    }

    return resultColor;
  }
}
