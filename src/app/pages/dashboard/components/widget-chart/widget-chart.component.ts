import {
  Component, OnDestroy,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { ChartData } from 'app/core/components/view-chart/view-chart.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { T } from 'app/translate-marker';

export interface TimeData {
  start: number;
  end: number;
  step: number;
  legend?: string;
}

@Component({
  selector: 'widget-chart',
  templateUrl: './widget-chart.component.html',
  styleUrls: ['./widget-chart.component.scss'],
})
export class WidgetChartComponent extends WidgetComponent implements OnDestroy {
  // Labels
  title: string = T('CPU Usage');
  subtitle: string = T('% of all cores');
  altTitle = '';
  altSubtitle = '';
  widgetColorCssVar = 'var(--warn)';

  // Loader
  loader = false;
  private _dataRcvd = false;
  get dataRcvd(): boolean {
    return this._dataRcvd;
  }
  set dataRcvd(val) {
    this._dataRcvd = val;
    if (val) {
      this.loader = false;
    }
  }

  // Chart Options
  showLegendValues = false;
  chartId = 'chart-' + UUID.UUID();
  maxY = 100; // Highest number in data
  startTime: string;
  endTime: string;
  private utils: ThemeUtils;

  constructor(public router: Router, public translate: TranslateService) {
    super(translate);

    setTimeout(() => {
      if (!this.dataRcvd) {
        this.loader = true;
      }
    }, 5000);
    const theme = this.themeService.currentTheme();
    this.utils = new ThemeUtils();
    this.widgetColorCssVar = (theme as any)[this.utils.colorFromMeta(theme.primary)];
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  // Override this method in subclasses
  chartSetup(): void {
  }

  timeFromDate(date: Date): string {
    let hh = date.getHours().toString();
    let mm = date.getMinutes().toString();
    let ss = date.getSeconds().toString();

    if (hh.length < 2) {
      hh = '0' + hh;
    }
    if (mm.length < 2) {
      mm = '0' + mm;
    }
    if (ss.length < 2) {
      ss = '0' + ss;
    }
    return hh + ':' + mm + ':' + ss;
  }

  aggregateData(wanted: string[], parsedData: ChartData[], operation?: string): ChartData {
    // operation options: total(default) or average
    if (!operation) {
      operation = 'total';
    }
    const result: ChartData = {
      legend: operation,
      data: [],
    };
    result.data.length = parsedData[0].data.length;
    result.data.fill(Number(0));

    parsedData.forEach((item) => {
      const stat = item.data;
      const isWanted = wanted.indexOf(item.legend);
      if (isWanted !== -1) {
        for (let i = 0; i < stat.length; i++) {
          const newNumber = Number(result.data[i]) + Number(stat[i]);
          result.data[i] = newNumber.toFixed(2);
        }
      }
    });

    if (operation && operation == 'average') {
      const average: string[] = [];
      result.data.forEach((item) => {
        const dataPoint = item / wanted.length;
        average.push(Number(dataPoint).toFixed(2));
      });
      result.data = average;
    }
    return result;
  }

  makeColumns(parsedData: ChartData[]): any[] {
    const columns: any[] = [];
    parsedData.forEach((item) => {
      const stat = item.data;
      stat.unshift(item.legend);
      columns.push(stat);
    });
    return columns;
  }

  // Will be used for back of flip card
  setPreferences(form: NgForm): void {
    const filtered: string[] = [];
    for (const i in form.value) {
      if (form.value[i]) {
        filtered.push(i);
      }
    }
  }
}
