import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  ViewChild,
  ElementRef,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import { utcToZonedTime } from 'date-fns-tz';
import Dygraph, { dygraphs } from 'dygraphs';
import {
  GiB, KiB, MiB, TiB,
} from 'app/constants/bytes.constant';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { buildNormalizedFileSize, normalizeFileSize } from 'app/helpers/file-size.utils';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { Report, LegendDataWithStackedTotalHtml } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { PlotterService } from 'app/pages/reports-dashboard/services/plotter.service';
import { ThemeService } from 'app/services/theme/theme.service';

interface Conversion {
  value: number;
  prefix?: string;
  suffix?: string;
  shortName?: string;
}

// TODO: Untie from reporting and move to a separate module.
@Component({
  selector: 'ix-linechart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('wrapper', { static: true }) el: ElementRef<HTMLElement>;
  @Input() chartId: string;
  @Input() chartColors: string[];
  @Input() data: ReportingData;
  @Input() report: Report;
  @Input() title: string;
  @Input() timezone: string;
  @Input() stacked = false;

  @Input() legends?: string[];
  @Input() type = 'line';
  @Input() labelY?: string = 'Label Y';

  lastMinDate: number;
  lastMaxDate: number;

  chart: Dygraph;

  units = '';
  yLabelPrefix: string;

  theme: Theme;
  timeFormat = '%H:%M';
  culling = 6;
  controlUid = `chart_${UUID.UUID()}`;

  @Output() zoomChange = new EventEmitter<number[]>();

  private utils: ThemeUtils = new ThemeUtils();

  constructor(
    public themeService: ThemeService,
    private reportsService: ReportsService,
    private plotterService: PlotterService,
  ) {}

  render(update?: boolean): void {
    this.renderGraph(update);
  }

  renderGraph(update?: boolean): void {
    if (!this.data?.legend?.length) {
      return;
    }

    const data = this.makeTimeAxis(this.data);
    const labels = data.shift();
    const fg2 = this.themeService.currentTheme().fg2;
    const fg2Type = this.utils.getValueType(fg2);
    let fg2Rgb;
    if (fg2Type === 'hex') {
      fg2Rgb = this.utils.hexToRgb(this.themeService.currentTheme().fg2).rgb;
    } else {
      fg2Rgb = this.utils.rgbToArray(fg2);
    }
    const gridLineColor = `rgba(${fg2Rgb[0]}, ${fg2Rgb[1]}, ${fg2Rgb[2]}, 0.25)`;

    const options: dygraphs.Options = {
      animatedZooms: true,
      drawPoints: false, // Must be disabled for smoothPlotter
      pointSize: 1,
      includeZero: true,
      highlightCircleSize: 4,
      strokeWidth: 1,
      colors: this.chartColors,
      labels, // time axis
      ylabel: this.formatAxisName(),
      gridLineColor,
      showLabelsOnHighlight: false,
      labelsSeparateLines: true,
      axes: {
        y: {
          yRangePad: 24,
          axisLabelFormatter: this.axisLabelFormatter.bind(this),
        },
      },
      legendFormatter: this.legendFormatter.bind(this),
      series: this.series.bind(this),
      drawCallback: this.drawCallback.bind(this),
      zoomCallback: this.zoomCallback.bind(this),
      stackedGraph: this.stacked,
    } as unknown as dygraphs.Options;

    if (update) {
      this.chart.updateOptions(options);
    } else {
      this.chart = new Dygraph(this.el.nativeElement, data, options);
    }
  }

  // TODO: Line chart should be dumber and should not care about timezones.
  protected makeTimeAxis(rd: ReportingData): dygraphs.DataArray {
    const rowData = rd.data as number[][];

    const newRows = rowData.map((row, index) => {
      // replace unix timestamp in first column with date
      const convertedDate = utcToZonedTime(row[0] * 1000, this.timezone);

      if (index === 0) { this.lastMinDate = convertedDate.getTime(); }
      if (index === rowData.length - 1) { this.lastMaxDate = convertedDate.getTime(); }

      return [convertedDate, ...row.slice(1)];
    });

    return [
      ['x', ...rd.legend],
      ...newRows,
    ] as unknown as dygraphs.DataArray;
  }

  inferUnits(label: string): string {
    // Figures out from the label what the unit is
    let units = label;
    switch (true) {
      case label.toLowerCase().includes('percentage'):
      case label.includes('%'):
        units = '%';
        break;
      case label.toLowerCase().includes('celsius'):
      case label.includes('°'):
        units = '°';
        break;
      case label.toLowerCase().includes('mebibytes'):
        units = 'mebibytes';
        break;
      case label.toLowerCase().includes('kilobits'):
        units = 'kilobits';
        break;
      case label.toLowerCase().includes('kibibytes'):
        units = 'kibibytes';
        break;
      case label.toLowerCase().includes('bytes'):
        units = 'bytes';
        break;
      case label.toLowerCase().includes('bits'):
        units = 'bits';
        break;
    }

    if (typeof units === 'undefined') {
      console.warn('Could not infer units from ' + this.labelY);
    }

    return units;
  }

  formatAxisName(): string {
    if (this.report.name === ReportingGraphName.NetworkInterface) {
      return this.yLabelPrefix + '/s';
    }
    switch (true) {
      case this.labelY.toLowerCase() === 'seconds':
        return 'Days';
      case this.labelY.toLowerCase().includes('bits/s'):
        return `${this.yLabelPrefix}bits/s`;
      case this.labelY.toLowerCase().includes('bytes/s'):
        return `${this.yLabelPrefix}bytes/s`;
      case this.labelY.toLowerCase().includes('bytes'):
        return `${this.yLabelPrefix}bytes`;
      case this.labelY.toLowerCase().includes('bits'):
        return `${this.yLabelPrefix}bits`;
      default:
        return this.labelY;
    }
  }

  formatLabelValue(value: number, units: string, fixed?: number, prefixRules?: boolean, axis = false): Conversion {
    const day = 60 * 60 * 24;
    let output: Conversion = { value };
    if (!fixed) { fixed = -1; }
    if (typeof value !== 'number') { return value; }

    switch (units.toLowerCase()) {
      case 'seconds':
        output = { value: value / day, shortName: ' days' };
        break;
      case 'kilobits':
        output = this.convertKmgt(value * 1000, 'bits', fixed, prefixRules);
        if (axis) {
          output.value = this.getValueForAxis(value * 1000, output.prefix);
        }
        break;
      case 'mebibytes':
        output = this.convertKmgt(value * MiB, 'bytes', fixed, prefixRules);
        if (axis) {
          output.value = this.getValueForAxis(value * 1000 * 1000, output.prefix);
        }
        break;
      case 'kibibytes':
        output = this.convertKmgt(value * KiB, 'bytes', fixed, prefixRules);
        if (axis) {
          output.value = this.getValueForAxis(value * 1000, output.prefix);
        }
        break;
      case 'bits':
      case 'bytes':
        output = this.convertKmgt(value, units.toLowerCase(), fixed, prefixRules);
        if (axis) {
          output.value = this.getValueForAxis(value, output.prefix);
        }
        break;
      case '%':
      case '°':
      default:
        output = this.convertByKilo(value);
        break;
    }

    return output;
  }

  convertByKilo(input: number): Conversion {
    if (typeof input !== 'number') { return input; }
    let output = input;
    let suffix = '';

    if (input >= 1000000) {
      output = input / 1000000;
      suffix = 'm';
    } else if (input < 1000000 && input >= 1000) {
      output = input / 1000;
      suffix = 'k';
    }

    return { value: output, suffix };
  }

  limitDecimals(numero: number): string | number {
    if (numero < 1024) {
      return Number(numero.toString().slice(0, 4));
    }
    return Math.round(numero);
  }

  axisLabelFormatter = (numero: number): string => {
    if (this.report?.name === ReportingGraphName.NetworkInterface) {
      const [formatted] = normalizeFileSize(numero * 1000, 'b', 10);
      return formatted.toString();
    }
    const converted = this.formatLabelValue(numero, this.inferUnits(this.labelY), 1, true, true);
    const suffix = converted.suffix ? converted.suffix : '';
    return `${this.limitDecimals(converted.value)} ${suffix}`;
  };

  series = (): Record<string, { plotter: unknown }> => {
    const series: Record<string, { plotter: unknown }> = {};
    this.data.legend.forEach((item) => {
      series[item] = { plotter: this.plotterService.getSmoothPlotter() };
    });

    return series;
  };

  getSuffix = (converted: Conversion): string => {
    if (converted.shortName !== undefined) {
      return converted.shortName;
    }

    return converted.suffix !== undefined ? converted.suffix : '';
  };

  legendFormatter = (legend: dygraphs.LegendData): string => {
    const clone = { ...legend, chartId: this.chartId } as LegendDataWithStackedTotalHtml;
    clone.series.forEach((item: dygraphs.SeriesLegendData, index: number): void => {
      if (!item.y) { return; }
      if (this.report.name === ReportingGraphName.NetworkInterface) {
        clone.series[index].yHTML = buildNormalizedFileSize(item.y * 1000, 'b', 10) + '/s';
      } else {
        const yConverted = this.formatLabelValue(item.y, this.inferUnits(this.labelY), 1, true);
        const ySuffix = this.getSuffix(yConverted);
        clone.series[index].yHTML = `${this.limitDecimals(yConverted.value)} ${ySuffix}`;
        if (this.labelY.endsWith('/s')) {
          clone.series[index].yHTML += '/s';
        }
        if (!clone.stackedTotal) {
          clone.stackedTotal = 0;
        }
        clone.stackedTotal += item.y;
        if (clone.stackedTotal >= 0) {
          const stackedTotalConverted = this.formatLabelValue(
            clone.stackedTotal,
            this.inferUnits(this.labelY),
            1,
            true,
          );
          const stackedTotalSuffix = this.getSuffix(stackedTotalConverted);
          clone.stackedTotalHTML = `${this.limitDecimals(stackedTotalConverted.value)} ${stackedTotalSuffix}`;
        }
      }
    });

    this.reportsService.emitLegendEvent(clone);
    return '';
  };

  drawCallback = (dygraph: Dygraph & { axes_: { maxyval: number }[] }): void => {
    if (dygraph.axes_.length) {
      const numero = dygraph.axes_[0].maxyval;
      if (this.report?.name === ReportingGraphName.NetworkInterface) {
        const [, unit] = normalizeFileSize(numero * 1000, 'b', 10);
        this.yLabelPrefix = unit;
        return;
      }
      const converted = this.formatLabelValue(numero, this.inferUnits(this.labelY));
      if (converted.prefix) {
        this.yLabelPrefix = converted.prefix;
      } else {
        this.yLabelPrefix = '';
      }
    } else {
      console.warn('axes not found');
    }
  };

  zoomCallback = (startDate: number, endDate: number): void => {
    const maxZoomLevel = 5 * 60 * 1000;
    const zoomRange = endDate - startDate;

    if (zoomRange < maxZoomLevel) {
      this.chart.updateOptions({
        dateWindow: [this.lastMinDate, this.lastMaxDate],
        animatedZooms: false,
      });
      return;
    }

    this.lastMinDate = startDate;
    this.lastMaxDate = endDate;
    this.zoomChange.emit([startDate, endDate]);
  };

  getValueForAxis(value: number, prefix: string): number {
    if (prefix === 'Tebi') return value / 1000 ** 4;
    if (prefix === 'Gibi') return value / 1000 ** 3;
    if (prefix === 'Mebi') return value / 1000 ** 2;
    if (prefix === 'Kibi') return value / 1000;
    return value;
  }

  convertKmgt(value: number, units: string, fixed?: number, prefixRules?: boolean): Conversion {
    let prefix = '';
    let output: number = value;
    let shortName = '';

    if (value > TiB || (prefixRules && this.yLabelPrefix === 'Tebi')) {
      prefix = 'Tebi';
      shortName = 'TiB';
      output = value / TiB;
    } else if ((value < TiB && value > GiB) || (prefixRules && this.yLabelPrefix === 'Gibi')) {
      prefix = 'Gibi';
      shortName = 'GiB';
      output = value / GiB;
    } else if ((value < GiB && value > MiB) || (prefixRules && this.yLabelPrefix === 'Mebi')) {
      prefix = 'Mebi';
      shortName = 'MiB';
      output = value / MiB;
    } else if ((value < MiB && value > KiB) || (prefixRules && this.yLabelPrefix === 'Kibi')) {
      prefix = 'Kibi';
      shortName = 'KiB';
      output = value / KiB;
    }

    if (units === 'bits') {
      shortName = shortName.replace(/i/, '').trim();
      shortName = ` ${shortName.charAt(0).toUpperCase()}${shortName.substring(1).toLowerCase()}`; // Kb, Mb, Gb, Tb
    }

    return { value: output, prefix, shortName };
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.data) {
      this.render();

      if (this.chart) {
        this.render(true);
      } else {
        this.render();// make an update method?
      }
    }
  }

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
