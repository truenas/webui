import {
  Component, AfterViewInit, Input, SimpleChanges, OnChanges,
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import {
  ChartConfiguration,
  LegendOptions,
  TooltipOptions,
} from 'app/modules/charts/components/view-chart/view-chart.component.types';

export interface ChartData {
  legend: string;
  data: any[];
}

export interface Legend {
  swatch?: string;
  name: string;
  value?: number | string;
  x?: number | string;
  visible: boolean;
}

export const viewChartMetadata = {
  template: `
    <div class="viewchart-wrapper {{chartClass}}-wrapper">
      <div *ngIf="chartLoaded" class="legend-wrapper">
        <div class="legend-x legend-item" *ngIf="chartConfig.data.x">Time: <span *ngIf="showLegendValues" class="legend-item-time">{{legend[0].x}}</span></div>
        <div class="legend-html" fxLayout="row wrap" fxLayoutAlign="space-between" fxLayoutGap="16px" >
          <ng-container *ngFor="let item of legend; let i=index ">
            <div fxFlex.xs="calc(33% - 16px)" class="legend-item" *ngIf="chartType !== 'gauge'" (click)="focus(legend[i])" [ngClass]="{'legend-item-disabled':!legend[i].visible}">
              <div>
                <span class="legend-swatch" [style.background-color]="legend[i].swatch"></span>
                <span class="legend-name">{{legend[i].name}}: </span>
              </div>
              <div class="legend-value" [style.color]="legend[i].swatch"><span *ngIf="showLegendValues">{{legend[i].value | number : '1.2-2'}}{{units}}</span></div>
            </div>
          </ng-container>
        </div>
      </div>
      <div id="{{chartId}}" [ngClass]="chartClass">
      </div>
    </div>
  `,
};

@Component({
  selector: 'viewchart',
  template: viewChartMetadata.template,
  styleUrls: ['./view-chart.component.scss'],
})
export class ViewChartComponent implements OnChanges, AfterViewInit {
  chartColors: string[];
  maxLabels: number;
  units: string;
  max: number;
  @Input() width: number;
  @Input() height: number;

  chart: any;
  chartLoaded = false;
  protected _chartType: string;
  protected _data: any[] = ['No Data', 1];
  protected _chartId: string;
  protected colors: string[];
  legend: Legend[] = [];
  showLegendValues = false;
  protected legendOptions: LegendOptions = {
    show: false,
  };
  protected tooltipOptions: TooltipOptions = {
    contents: (raw) => {
      if (!this.showLegendValues) {
        this.showLegendValues = true;
      }
      const time = raw[0].x;
      for (const legend of this.legend) {
        for (const item of raw) {
          if (legend.name === item.name) {
            legend.value = item.value;
          }
        }
        legend.x = time;
      }
      return '<div style="display:none">' + time + '</div>';
    },
  };

  chartConfig: ChartConfiguration;

  constructor() {
    this.chartId = 'chart-' + UUID.UUID();
    this.chartType = 'pie';
    this.units = '';
  }

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data) { // This only works with @Input() properties
      if (this.chartConfig) {
        this.chart.load({
          columns: [changes.data],
        });
      }
    }
  }

  get data(): ChartData[] {
    return this._data;
  }

  set data(chartData: ChartData[]) {
    if (!chartData) {
      this._data = [];
    } else {
      const result: any[] = [];

      chartData.forEach((data) => {
        // setup data
        const legend = [data.legend];
        const dataObj = legend.concat(data.data);
        result.push(dataObj);

        const legendHtmlItem: Legend = {
          swatch: '', name: data.legend, value: 'empty', x: 'empty', visible: true,
        };
        if (this.chartType === 'donut' || this.chartType === 'pie') {
          legendHtmlItem.value = data.data[0];
          this.showLegendValues = true;
        }

        // Don't duplicate legend items when new data comes in
        const legendIndex = this.findLegendItem(legendHtmlItem);
        if (legendIndex === -1) {
          this.legend.push(legendHtmlItem);
        } else {
          const dupe = this.legend[legendIndex];
          dupe.value = legendHtmlItem.value;
        }
      });
      this._data = result;

      this.render();
    }
  }

  get chartId(): string {
    return this._chartId;
  }

  set chartId(sel: string) {
    this._chartId = sel;
  }

  get chartClass(): string {
    return this._chartType;
  }

  get chartType(): string {
    return this._chartType;
  }

  set chartType(str: string) {
    this._chartType = str;
  }

  findLegendItem(item: Legend): number {
    for (let i = 0; i < this.legend.length; i++) {
      const legendItem = this.legend[i];
      if (legendItem.name === item.name) {
        return i;
      }
    }
    return -1;
  }

  makeConfig(): ChartConfiguration {
    this.chartConfig = {
      bindto: '#' + this.chartId,
      data: {
        columns: this._data,
        type: this.chartType,
      },
      size: {
        width: this.width,
        height: this.height,
      },
      tooltip: {
        show: false,
        format: {
          value: (value: any) => {
            if (this.units) {
              return value + this.units;
            }
            return value;
          },
        },
      },
    };
    return this.chartConfig;
  }

  focus(item: Legend): void {
    if (item.visible) {
      this.chart.hide(item.name);
    } else {
      this.chart.show(item.name);
    }
    item.visible = !item.visible;
  }

  refresh(): void {
    // Reset legend to avoid concatenation
    this.render();
  }

  render(): void {
  }
}
