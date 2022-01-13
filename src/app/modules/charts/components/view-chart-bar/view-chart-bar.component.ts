import {
  Component, AfterViewInit, Input, ViewChild, ElementRef, OnChanges, SimpleChanges,
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import { styler } from 'popmotion';
import { Styler } from 'stylefire/lib/styler/types';

export interface BarChartConfig {
  label: boolean; // to turn off the min/max labels.
  units: string;
  min?: number; // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  max?: number; // 100 is default
  width?: number;
  data: BarDataSource[];
  orientation?: string; // horizontal || vertical
}

export interface BarDataSource {
  coreNumber: number;
  usage?: number | string;
  temperature?: number | string;
}

@Component({
  selector: 'viewchartbar',
  templateUrl: './view-chart-bar.component.html',
  styleUrls: ['./view-chart-bar.component.scss'],
})
export class ViewChartBarComponent implements AfterViewInit, OnChanges {
  title = '';
  private chart: any;
  chartClass = 'view-chart-bar';
  chartConfig: any;
  private _data: any;
  chartId = UUID.UUID();
  private margin: number;
  private wrapperNode: Styler;

  @Input() config: BarChartConfig;
  @ViewChild('wrapper', { static: true }) el: ElementRef;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      if (changes.config.currentValue && changes.config.currentValue.data) {
        this.data = changes.config.currentValue.data;

        if (!this.wrapperNode) {
          this.render();
        } else {
          this.update(changes.config.currentValue.data);
        }
      }
    }
  }

  ngAfterViewInit(): void {
    this.render();
  }

  get data(): any {
    return this._data;
  }

  set data(d) {
    this._data = d;
  }

  render(): void {
    this.margin = 32;

    if (!this.el) { return; }
    this.wrapperNode = styler(this.el.nativeElement, {});

    this.chartConfig = this.makeConfig();
  }

  update(data?: any): void {
    if (!data) { data = this.config.data; }

    this.chart.load({
      columns: this.config.data,
    });
  }

  makeConfig(): any {
    this.chartConfig = {
      bindto: '#bar-' + this.chartId,
      data: {
        columns: this.config.data,
        type: 'bar',
      },
      bar: {
        label: {
          show: false,
        },
        width: 15,
        fullCircle: true,
      },
      tooltip: {
        show: false,
      },
      interaction: {
        enabled: false,
      },
      legend: {
        hide: true,
      },
    };
    return this.chartConfig;
  }
}
