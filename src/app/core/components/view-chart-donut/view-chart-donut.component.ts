import { Component, OnInit } from '@angular/core';
import { ViewChartComponent } from 'app/core/components/view-chart/view-chart.component';

@Component({
  selector: 'viewchartdonut',
  template: `
      <div class="viewchart-wrapper {{chartClass}}-wrapper" fxLayout="row wrap" fxLayoutAlign="space-around center">

      <div *ngIf="chartLoaded && legendPosition == 'top'" class="legend-wrapper">
        <div class="legend-x legend-item" *ngIf="chartConfig.data.x">Time: <span *ngIf="showLegendValues" class="legend-item-time">{{legend[0].x}}</span></div>
        <div class="legend-html" fxLayout="row wrap" fxLayoutAlign="space-between" fxLayoutGap="16px" >
          <ng-container *ngFor="let item of legend; let i=index ">
            <div fxFlex.xs="calc(33% - 16px)" class="legend-item" *ngIf="legendPosition == 'top'" (click)="focus(legend[i])" [ngClass]="{'legend-item-disabled':!legend[i].visible}">
              <span class="legend-swatch" [style.background-color]="legend[i].swatch"></span>
              <span class="legend-name">{{legend[i].name}}: </span>
              <div class="legend-value" [style.color]="legend[i].swatch"><span *ngIf="showLegendValues">{{legend[i].value | number : '1.2-2'}}{{units}}</span></div>
            </div>

          </ng-container>
        </div>
      </div>

      <div id="{{chartId}}" [ngClass]="chartClass" fxFlex="50"></div>

      <div *ngIf="chartLoaded && legendPosition == 'right'"  class="legend-wrapper" fxFlex="50">
        <div class="legend-x legend-item" *ngIf="chartConfig.data.x">Time: <span *ngIf="showLegendValues" class="legend-item-time">{{legend[0].x}}</span></div>
        <div class="legend-html" fxLayout="row wrap" fxLayoutAlign="space-between" fxLayoutGap="16px" >
          <ng-container *ngFor="let item of legend; let i=index ">
            <div fxFlex="100%" class="legend-item" (click)="focus(legend[i])" [ngClass]="{'legend-item-disabled':!legend[i].visible}">
              <span class="legend-swatch" [style.background-color]="legend[i].swatch"></span>
              <span class="legend-name">{{legend[i].name}}: </span>
              <div class="legend-value" [style.color]="legend[i].swatch"><span *ngIf="showLegendValues">{{legend[i].value | number : '1.2-2'}}{{units}}</span></div>
            </div>
          </ng-container>
        </div>
      </div>

    </div>
  `,
  // template:ViewChartDonutMetadata.template
  // templateUrl: './viewchartpie.component.html',
  // styleUrls: ['./viewchartdonut.component.css']
})
export class ViewChartDonutComponent extends ViewChartComponent implements OnInit {
  title = '';
  chartType = 'donut';
  legendPosition = 'right'; // Valid positions are top or right

  ngOnInit(): void {
    this.showLegendValues = true;
  }

  makeConfig(): any {
    this.chartConfig = {
      bindto: '#' + this._chartId,
      data: {
        columns: this._data,
        type: this.chartType,
      },
      donut: {
        title: this.title,
        width: 15,
        label: {
          show: false,
        },
      },
      size: {
        width: this.width,
        height: this.height,
      },
      tooltip: {
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
    this.tooltipOptions = {
      show: false,
    };
    return this.chartConfig;
  }
}
