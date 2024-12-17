import {
  Component,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  ElementRef,
  ChangeDetectionStrategy,
  output,
  input,
  viewChild,
  Signal,
} from '@angular/core';
import { TinyColor } from '@ctrl/tinycolor';
import { UUID } from 'angular2-uuid';
import { utcToZonedTime } from 'date-fns-tz';
import Dygraph, { dygraphs } from 'dygraphs';
import { Gb, kb, Mb } from 'app/constants/bits.constant';
import {
  GiB, KiB, MiB, TiB,
} from 'app/constants/bytes.constant';
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
  standalone: true,
})
export class LineChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  readonly chartId = input<string>();
  readonly chartColors = input<string[]>([]);
  readonly data = input<ReportingData>();
  readonly report = input<Report>();
  readonly timezone = input<string>();
  readonly stacked = input(false);
  readonly labelY = input('Label Y');

  private readonly el: Signal<ElementRef<HTMLElement>> = viewChild('wrapper', { read: ElementRef });

  lastMinDate: number;
  lastMaxDate: number;

  chart: Dygraph;

  units = '';
  yLabelPrefix: string;

  theme: Theme;
  timeFormat = '%H:%M';
  controlUid = `chart_${UUID.UUID()}`;

  readonly zoomChange = output<number[]>();

  constructor(
    public themeService: ThemeService,
    private reportsService: ReportsService,
    private plotterService: PlotterService,
  ) {}

  render(update?: boolean): void {
    this.renderGraph(update);
  }

  renderGraph(update?: boolean): void {
    if (!this.data()?.legend?.length) {
      return;
    }

    const data = this.makeTimeAxis(this.data());
    const labels = data.shift();
    const fg2 = this.themeService.currentTheme().fg2;
    const gridLineColor = new TinyColor(fg2).setAlpha(0.25).toRgbString();

    const options: dygraphs.Options = {
      animatedZooms: true,
      drawPoints: false, // Must be disabled for smoothPlotter
      pointSize: 1,
      includeZero: true,
      highlightCircleSize: 4,
      strokeWidth: 1,
      colors: this.chartColors(),
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
      stackedGraph: this.stacked(),
    } as unknown as dygraphs.Options;

    if (update) {
      this.chart.updateOptions(options);
    } else {
      this.chart = new Dygraph(this.el().nativeElement, data, options);
    }
  }

  // TODO: Line chart should be dumber and should not care about timezones.
  protected makeTimeAxis(rd: ReportingData): dygraphs.DataArray {
    const rowData = rd.data as number[][];

    const newRows = rowData.map((row, index) => {
      // replace unix timestamp in first column with date
      const convertedDate = utcToZonedTime(row[0] * 1000, this.timezone());

      if (index === 0) {
        this.lastMinDate = convertedDate.getTime();
      }
      if (index === rowData.length - 1) {
        this.lastMaxDate = convertedDate.getTime();
      }

      return [convertedDate, ...row.slice(1)];
    });

    return [
      ['x', ...rd.legend],
      ...newRows,
    ] as dygraphs.DataArray;
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
      default:
        console.warn('Could not infer units from ' + this.labelY());
    }

    return units;
  }

  formatAxisName(): string {
    if (this.report().name === ReportingGraphName.NetworkInterface) {
      return this.yLabelPrefix + '/s';
    }
    switch (true) {
      case this.labelY().toLowerCase() === 'seconds':
        return 'Days';
      case this.labelY().toLowerCase().includes('bits/s'):
        return `${this.yLabelPrefix}bits/s`;
      case this.labelY().toLowerCase().includes('bytes/s'):
        return `${this.yLabelPrefix}bytes/s`;
      case this.labelY().toLowerCase().includes('bytes'):
        return `${this.yLabelPrefix}bytes`;
      case this.labelY().toLowerCase().includes('bits'):
        return `${this.yLabelPrefix}bits`;
      default:
        return this.labelY();
    }
  }

  formatLabelValue(value: number, units: string, fixed?: number, prefixRules?: boolean, axis = false): Conversion {
    const day = 60 * 60 * 24;
    let result: Conversion;
    if (!fixed) {
      fixed = -1;
    }
    if (typeof value !== 'number') {
      return value;
    }

    switch (units.toLowerCase()) {
      case 'seconds':
        result = { value: value / day, shortName: ' days' };
        break;
      case 'kilobits':
        result = this.convertKmgt(value * 1000, 'bits', fixed, prefixRules);
        if (axis) {
          result.value = this.getValueForAxis(value * 1000, result.prefix);
        }
        break;
      case 'mebibytes':
        result = this.convertKmgt(value * MiB, 'bytes', fixed, prefixRules);
        if (axis) {
          result.value = this.getValueForAxis(value * 1000 * 1000, result.prefix);
        }
        break;
      case 'kibibytes':
        result = this.convertKmgt(value * KiB, 'bytes', fixed, prefixRules);
        if (axis) {
          result.value = this.getValueForAxis(value * 1000, result.prefix);
        }
        break;
      case 'bits':
      case 'bytes':
        result = this.convertKmgt(value, units.toLowerCase(), fixed, prefixRules);
        if (axis) {
          result.value = this.getValueForAxis(value, result.prefix);
        }
        break;
      case '%':
      case '°':
      default:
        result = this.convertByKilo(value);
        break;
    }

    return result;
  }

  convertByKilo(value: number): Conversion {
    if (typeof value !== 'number') {
      return value;
    }

    let newValue = value;
    let suffix = '';

    if (value >= 1000000) {
      newValue = value / 1000000;
      suffix = 'm';
    } else if (value < 1000000 && value >= 1000) {
      newValue = value / 1000;
      suffix = 'k';
    }

    return { value: newValue, suffix };
  }

  limitDecimals(numero: number): string | number {
    if (numero < 1024) {
      return Number(numero.toString().slice(0, 4));
    }
    return Math.round(numero);
  }

  axisLabelFormatter = (numero: number): string => {
    if (this.report()?.name === ReportingGraphName.NetworkInterface) {
      if (numero < Mb) {
        if (this.yLabelPrefix === 'Gb') {
          numero /= Gb;
        }
        if (this.yLabelPrefix === 'Mb') {
          numero /= Mb;
        }
        if (this.yLabelPrefix === 'kb') {
          numero /= kb;
        }
      }
      const [formatted] = normalizeFileSize(numero * 1000, 'b', 10);
      return formatted.toString();
    }
    const converted = this.formatLabelValue(numero, this.inferUnits(this.labelY()), 1, true, true);
    const suffix = converted.suffix ? converted.suffix : '';
    return `${this.limitDecimals(converted.value)}${suffix}`;
  };

  series = (): Record<string, { plotter: unknown }> => {
    const series: Record<string, { plotter: unknown }> = {};
    this.data().legend.forEach((item) => {
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
    const clone = { ...legend, chartId: this.chartId() } as LegendDataWithStackedTotalHtml;
    clone.series.forEach((item: dygraphs.SeriesLegendData, index: number): void => {
      if (!item.y) {
        return;
      }
      if (this.report().name === ReportingGraphName.NetworkInterface) {
        clone.series[index].yHTML = buildNormalizedFileSize(item.y * 1000, 'b', 10) + '/s';
      } else {
        const yConverted = this.formatLabelValue(item.y, this.inferUnits(this.labelY()), 1, true);
        const ySuffix = this.getSuffix(yConverted);
        clone.series[index].yHTML = `${this.limitDecimals(yConverted.value)} ${ySuffix}`;
        if (this.labelY().endsWith('/s')) {
          clone.series[index].yHTML += '/s';
        }
        if (!clone.stackedTotal) {
          clone.stackedTotal = 0;
        }
        clone.stackedTotal += item.y;
        if (clone.stackedTotal >= 0) {
          const stackedTotalConverted = this.formatLabelValue(
            clone.stackedTotal,
            this.inferUnits(this.labelY()),
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
      if (this.report()?.name === ReportingGraphName.NetworkInterface) {
        const [, unit] = normalizeFileSize(numero * 1000, 'b', 10);
        this.yLabelPrefix = unit;
        return;
      }
      const converted = this.formatLabelValue(numero, this.inferUnits(this.labelY()));
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
    let newValue: number = value;
    let shortName = '';

    if (value > TiB || (prefixRules && this.yLabelPrefix === 'Tebi')) {
      prefix = 'Tebi';
      shortName = 'TiB';
      newValue = value / TiB;
    } else if ((value < TiB && value > GiB) || (prefixRules && this.yLabelPrefix === 'Gibi')) {
      prefix = 'Gibi';
      shortName = 'GiB';
      newValue = value / GiB;
    } else if ((value < GiB && value > MiB) || (prefixRules && this.yLabelPrefix === 'Mebi')) {
      prefix = 'Mebi';
      shortName = 'MiB';
      newValue = value / MiB;
    } else if ((value < MiB && value > KiB) || (prefixRules && this.yLabelPrefix === 'Kibi')) {
      prefix = 'Kibi';
      shortName = 'KiB';
      newValue = value / KiB;
    }

    if (units === 'bits') {
      shortName = shortName.replace(/i/, '').trim();
      shortName = ` ${shortName.charAt(0).toUpperCase()}${shortName.substring(1).toLowerCase()}`; // Kb, Mb, Gb, Tb
    }

    return { value: newValue, prefix, shortName };
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
