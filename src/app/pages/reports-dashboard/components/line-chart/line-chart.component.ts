import {
  Component, Input, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef,
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import { utcToZonedTime } from 'date-fns-tz';
import Dygraph, { dygraphs } from 'dygraphs';
// eslint-disable-next-line
import smoothPlotter from 'dygraphs/src/extras/smooth-plotter.js';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { LegendDataWithStackedTotalHtml, Report } from 'app/pages/reports-dashboard/components/report/report.component';
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
  @Input() stacked = false;

  @Input() legends?: string[];
  @Input() type = 'line';
  @Input() convertToCelsius?: true;
  @Input() dataStructure: 'columns'; // rows vs columns
  @Input() minY?: number = 0;
  @Input() maxY?: number = 100;
  @Input() labelY?: string = 'Label Y';
  @Input() interactive = false;

  library = 'dygraph'; // dygraph or chart.js

  chart: Dygraph;

  units = '';
  yLabelPrefix: string;

  theme: Theme;
  timeFormat = '%H:%M';
  culling = 6;
  controlUid: string;

  private utils: ThemeUtils;
  private _data: ReportingData;

  constructor(private core: CoreService, public themeService: ThemeService) {
    this.utils = new ThemeUtils();
    this.controlUid = 'chart_' + UUID.UUID();
  }

  render(update?: boolean): void {
    this.renderGraph(update);
  }

  // dygraph renderer
  renderGraph(update?: boolean): void {
    if (this.isReversed) {
      this.data.legend = this.data.legend.reverse();
      this.data.data.forEach((row, i) => this.data.data[i] = row.slice().reverse());
      this.data.aggregations.min = this.data.aggregations.min.slice().reverse();
      this.data.aggregations.max = this.data.aggregations.max.slice().reverse();
      this.data.aggregations.mean = this.data.aggregations.mean.slice().reverse();
    }

    const data = this.makeTimeAxis(this.data);
    const labels = data.shift();

    const fg2 = this.themeService.currentTheme().fg2;
    const fg2Type = this.utils.getValueType(fg2);
    const fg2Rgb = fg2Type === 'hex' ? this.utils.hexToRgb(this.themeService.currentTheme().fg2).rgb : this.utils.rgbToArray(fg2);
    const gridLineColor = `rgba(${fg2Rgb[0]}, ${fg2Rgb[1]}, ${fg2Rgb[2]}, 0.25)`;
    const yLabelSuffix = this.labelY === 'Bits/s' ? this.labelY.toLowerCase() : this.labelY;

    const options: dygraphs.Options = {
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
            return this.limitDecimals(converted.value).toString() + suffix;
          },
        },
      },
      legendFormatter: (data: dygraphs.LegendData) => {
        const getSuffix = (converted: Conversion): string => {
          if (converted.shortName !== undefined) {
            return converted.shortName;
          }

          return converted.suffix !== undefined ? converted.suffix : '';
        };

        const clone = { ...data } as LegendDataWithStackedTotalHtml;
        clone.series.forEach((item: dygraphs.SeriesLegendData, index: number) => {
          if (!item.y) { return; }
          const converted = this.formatLabelValue(item.y, this.inferUnits(this.labelY), 1, true);
          const suffix = getSuffix(converted);
          clone.series[index].yHTML = this.limitDecimals(converted.value).toString() + suffix;
          if (!clone.stackedTotal) {
            clone.stackedTotal = 0;
          }
          clone.stackedTotal += item.y;
        });
        if (clone.stackedTotal >= 0) {
          const converted = this.formatLabelValue(clone.stackedTotal, this.inferUnits(this.labelY), 1, true);
          const suffix = getSuffix(converted);
          clone.stackedTotalHTML = this.limitDecimals(converted.value).toString() + suffix;
        }
        this.core.emit({ name: 'LegendEvent-' + this.chartId, data: clone, sender: this });
        return '';
      },
      series: () => {
        const series: { [item: string]: { plotter: typeof smoothPlotter } } = {};
        this.data.legend.forEach((item) => {
          series[item] = { plotter: smoothPlotter };
        });

        return series;
      },
      drawCallback: (dygraph: any) => {
        if (dygraph.axes_) {
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

  protected makeTimeAxis(rd: ReportingData): any[] {
    const structure = this.library === 'chart.js' ? 'columns' : 'rows';
    if (structure === 'rows') {
      // Push dates to row based data...
      const rows = [];
      // Add legend with axis to beginning of array
      const legend = Object.assign([], rd.legend);
      legend.unshift('x');
      rows.push(legend);

      for (let i = 0; i < rd.data.length; i++) {
        const item = Object.assign([], rd.data[i]);
        let dateStr = utcToZonedTime(new Date(rd.start * 1000 + i * rd.step * 1000), this.timezone).toString();
        // UTC: 2020-12-17T16:33:10Z
        // Los Angeles: 2020-12-17T08:36:30-08:00
        // Change dateStr from '2020-12-17T08:36:30-08:00' to '2020-12-17T08:36'
        const list = dateStr.split(':');
        dateStr = list.join(':');
        const date = new Date(dateStr);

        item.unshift(date);
        rows.push(item);
      }

      return rows;
    } if (structure === 'columns') {
      const columns = [];

      for (let i = 0; i < rd.data.length; i++) {
        const date = new Date(rd.start * 1000 + i * rd.step * 1000);
        columns.push(date);
      }

      return columns;
    }
  }

  fetchData(rrdOptions: { start: number; end: number }, timeformat?: string, culling?: number): void {
    if (timeformat) {
      this.timeFormat = timeformat;
    }
    if (culling) {
      this.culling = culling;
    }

    // Convert from milliseconds to seconds for epoch time
    rrdOptions.start = Math.floor(rrdOptions.start / 1000);
    if (rrdOptions.end) {
      rrdOptions.end = Math.floor(rrdOptions.end / 1000);
    }
  }

  inferUnits(label: string): string {
    // if(this.report.units){ return this.report.units; }
    // Figures out from the label what the unit is
    let units = label;
    if (label.includes('%')) {
      units = '%';
    } else if (label.includes('°')) {
      units = '°';
    } else if (label.toLowerCase().includes('bytes')) {
      units = 'bytes';
    } else if (label.toLowerCase().includes('bits')) {
      units = 'bits';
    }

    if (typeof units === 'undefined') {
      console.warn('Could not infer units from ' + this.labelY);
    }

    return units;
  }

  formatLabelValue(value: number, units: string, fixed?: number, prefixRules?: boolean): Conversion {
    let output: Conversion = { value };
    if (!fixed) { fixed = -1; }
    if (typeof value !== 'number') { return value; }

    switch (units.toLowerCase()) {
      case 'bits':
      case 'bytes':
        output = this.convertKmgt(value, units.toLowerCase(), fixed, prefixRules);
        break;
      case '%':
      case '°':
      default:
        output = this.convertByKilo(value);
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
    const decimalPlaces = subZero && subZero[1] ? subZero[1].length : 0;
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
      shortName = ` ${shortName.charAt(0).toUpperCase()}${shortName.substr(1).toLowerCase()}`; // Kb, Mb, Gb, Tb
    }

    return { value: output, prefix, shortName };
  }

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data) {
      this.render();
    }

    if (changes.data) {
      if (this.chart) {
        this.render(true);
      } else {
        this.render();// make an update method?
      }
    }
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });

    this.chart.destroy();
  }
}
