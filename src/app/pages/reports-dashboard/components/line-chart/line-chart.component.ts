import {
  Component, Input, AfterViewInit, OnDestroy, OnChanges, ViewChild, ElementRef,
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import { utcToZonedTime } from 'date-fns-tz';
import Dygraph, { dygraphs } from 'dygraphs';
// eslint-disable-next-line
import smoothPlotter from 'dygraphs/src/extras/smooth-plotter.js';
import { KiB, MiB } from 'app/constants/bytes.constant';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { ReportingGraphName } from 'app/enums/reporting-graph-name.enum';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { Report, LegendDataWithStackedTotalHtml } from 'app/pages/reports-dashboard/interfaces/report.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { ThemeService } from 'app/services/theme/theme.service';

interface Conversion {
  value: number;
  prefix?: string;
  suffix?: string;
  shortName?: string;
}

@Component({
  selector: 'ix-linechart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
})
export class LineChartComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('wrapper', { static: true }) el: ElementRef;
  @Input() chartId: string;
  @Input() chartColors: string[];
  @Input() set data(value: ReportingData) {
    this._data = value;
  }
  get data(): ReportingData {
    return this._data;
  }
  @Input() isReversed = false;
  @Input() report: Report;
  @Input() title: string;
  @Input() timezone: string;

  @Input() legends?: string[];
  @Input() type = 'line';
  @Input() convertToCelsius?: true;
  @Input() dataStructure: 'columns'; // rows vs columns
  @Input() minY?: number = 0;
  @Input() maxY?: number = 100;
  @Input() labelY?: string = 'Label Y';
  @Input() interactive = false;

  library: 'dygraph' | 'chart.js' = 'dygraph';

  chart: Dygraph;

  units = '';
  yLabelPrefix: string;

  theme: Theme;
  timeFormat = '%H:%M';
  culling = 6;
  controlUid = `chart_${UUID.UUID()}`;

  private utils: ThemeUtils = new ThemeUtils();
  private _data: ReportingData;

  get stacked(): boolean {
    return [
      ReportingGraphName.Uptime,
      ReportingGraphName.Swap,
      ReportingGraphName.ZfsArcResult,
    ].includes(this.data?.name as ReportingGraphName);
  }

  constructor(
    private core: CoreService,
    public themeService: ThemeService,
  ) {}

  render(update?: boolean): void {
    this.renderGraph(update);
  }

  // dygraph renderer
  renderGraph(update?: boolean): void {
    if (!this.data?.legend?.length) {
      return;
    }

    const data = this.makeTimeAxis(this.data);
    const labels = data.shift();

    const fg2 = this.themeService.currentTheme().fg2;
    const fg2Type = this.utils.getValueType(fg2);
    const fg2Rgb = fg2Type === 'hex' ? this.utils.hexToRgb(this.themeService.currentTheme().fg2).rgb : this.utils.rgbToArray(fg2);
    const gridLineColor = `rgba(${fg2Rgb[0]}, ${fg2Rgb[1]}, ${fg2Rgb[2]}, 0.25)`;
    const yLabelSuffix = this.labelY === 'Bits/s' ? this.labelY.toLowerCase() : this.labelY;

    const options: dygraphs.Options = {
      animatedZooms: true,
      drawPoints: false, // Must be disabled for smoothPlotter
      pointSize: 1,
      includeZero: true,
      highlightCircleSize: 4,
      strokeWidth: 1,
      colors: this.chartColors,
      labels, // time axis
      ylabel: this.yLabelPrefix + yLabelSuffix,
      gridLineColor,
      showLabelsOnHighlight: false,
      labelsSeparateLines: true,
      axes: {
        y: {
          yRangePad: 24,
          axisLabelFormatter: (numero: number) => {
            const converted = this.formatLabelValue(numero, this.inferUnits(this.labelY), 1, true);
            const suffix = converted.suffix ? converted.suffix : '';
            return `${this.limitDecimals(converted.value)} ${suffix}`;
          },
        },
      },
      legendFormatter: (legend: dygraphs.LegendData) => {
        const getSuffix = (converted: Conversion): string => {
          if (converted.shortName !== undefined) {
            return converted.shortName;
          }

          return converted.suffix !== undefined ? converted.suffix : '';
        };

        const clone = { ...legend } as LegendDataWithStackedTotalHtml;
        clone.series.forEach((item: dygraphs.SeriesLegendData, index: number) => {
          if (!item.y) { return; }
          const converted = this.formatLabelValue(item.y, this.inferUnits(this.labelY), 1, true);
          const suffix = getSuffix(converted);
          clone.series[index].yHTML = `${this.limitDecimals(converted.value)} ${suffix}`;
          if (!clone.stackedTotal) {
            clone.stackedTotal = 0;
          }
          clone.stackedTotal += item.y;
        });
        if (clone.stackedTotal >= 0) {
          const converted = this.formatLabelValue(clone.stackedTotal, this.inferUnits(this.labelY), 1, true);
          const suffix = getSuffix(converted);
          clone.stackedTotalHTML = `${this.limitDecimals(converted.value)} ${suffix}`;
        }
        this.core.emit({ name: `LegendEvent-${this.chartId}`, data: clone, sender: this });
        return '';
      },
      series: () => {
        const series: { [item: string]: { plotter: typeof smoothPlotter } } = {};
        this.data.legend.forEach((item) => {
          series[item] = { plotter: smoothPlotter };
        });

        return series;
      },
      drawCallback: (dygraph: Dygraph & { axes_: { maxyval: number }[] }) => {
        if (dygraph.axes_.length) {
          const numero = dygraph.axes_[0].maxyval;
          const converted = this.formatLabelValue(numero, this.inferUnits(this.labelY));
          if (converted.prefix) {
            this.yLabelPrefix = converted.prefix;
          } else {
            this.yLabelPrefix = '';
          }
        } else {
          console.warn('axes not found');
        }
      },
      stackedGraph: this.stacked,
    } as unknown as dygraphs.Options;

    if (update) {
      this.chart.updateOptions(options);
    } else {
      this.chart = new Dygraph(this.el.nativeElement, data, options);
    }
  }

  protected makeTimeAxis(rd: ReportingData): dygraphs.DataArray {
    const structure = this.library === 'chart.js' ? 'columns' : 'rows';
    const step = 10;
    const rowData = rd.data as number[][];

    if (structure === 'rows') {
      // Push dates to row based data...
      const rows = [];
      // Add legend with axis to beginning of array
      const legend = Object.assign([], rd.legend);
      legend.unshift('x');
      rows.push(legend);

      for (let i = 0; i < rowData.length; i++) {
        const item = Object.assign([], rowData[i]);
        let dateStr = utcToZonedTime(new Date(rd.start * 1000 + i * step * 1000), this.timezone).toString();
        // UTC: 2020-12-17T16:33:10Z
        // Los Angeles: 2020-12-17T08:36:30-08:00
        // Change dateStr from '2020-12-17T08:36:30-08:00' to '2020-12-17T08:36'
        const list = dateStr.split(':');
        dateStr = list.join(':');
        const date = new Date(dateStr);

        item[0] = date; // replace unix timestamp with date
        rows.push(item);
      }

      return rows;
    }
    if (structure === 'columns') {
      const columns = [];

      for (let i = 0; i < (rd.data as number[][]).length; i++) {
        const date = new Date(rd.start * 1000 + i * step * 1000);
        columns.push(date);
      }

      return columns as unknown as dygraphs.DataArray;
    }

    return undefined;
  }

  inferUnits(label: string): string {
    // if(this.report.units){ return this.report.units; }
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

  formatLabelValue(value: number, units: string, fixed?: number, prefixRules?: boolean): Conversion {
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
        break;
      case 'mebibytes':
        output = this.convertKmgt(value * MiB, 'bytes', fixed, prefixRules);
        break;
      case 'kibibytes':
        output = this.convertKmgt(value * KiB, 'bytes', fixed, prefixRules);
        break;
      case 'bits':
      case 'bytes':
        output = this.convertKmgt(value, units.toLowerCase(), fixed, prefixRules);
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
    const subZero = numero.toString().split('.');
    const decimalPlaces = subZero?.[1] ? subZero[1].length : 0;
    return decimalPlaces > 2 ? numero.toFixed(2) : numero;
  }

  convertKmgt(value: number, units: string, fixed?: number, prefixRules?: boolean): Conversion {
    const kilo = 1024;
    const mega = kilo * 1024;
    const giga = mega * 1024;
    const tera = giga * 1024;

    let prefix = '';
    let output: number = value;
    let shortName = '';

    if (value > tera || (prefixRules && this.yLabelPrefix === 'Tera')) {
      prefix = 'Tera';
      shortName = 'TiB';
      output = value / tera;
    } else if ((value < tera && value > giga) || (prefixRules && this.yLabelPrefix === 'Giga')) {
      prefix = 'Giga';
      shortName = 'GiB';
      output = value / giga;
    } else if ((value < giga && value > mega) || (prefixRules && this.yLabelPrefix === 'Mega')) {
      prefix = 'Mega';
      shortName = 'MiB';
      output = value / mega;
    } else if ((value < mega && value > kilo) || (prefixRules && this.yLabelPrefix === 'Kilo')) {
      prefix = 'Kilo';
      shortName = 'KB';
      output = value / kilo;
    }

    if (units === 'bits') {
      shortName = shortName.replace(/i/, '').trim();
      shortName = ` ${shortName.charAt(0).toUpperCase()}${shortName.substring(1).toLowerCase()}`; // Kb, Mb, Gb, Tb
    }

    return { value: output, prefix, shortName };
  }

  ngAfterViewInit(): void {
    this.render();
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

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
    this.chart?.destroy();
  }
}
