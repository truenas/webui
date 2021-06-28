import {
  Component, Input, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef,
} from '@angular/core';
import Dygraph from 'dygraphs';
// eslint-disable-next-line
import smoothPlotter from 'dygraphs/src/extras/smooth-plotter.js';
// import { BehaviorSubject } from 'rxjs';
// import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
// import { ViewComponent } from 'app/core/components/view/view.component';
// import { CoreService } from 'app/core/services/core.service';
// import { ThemeService, Theme } from 'app/services/theme/theme.service';

export interface ChartData {
  structure: string;
  data: any[];
}

@Component({
  selector: 'viewchartarea',
  templateUrl: './viewchartarea.component.html',
  styleUrls: ['./viewchartarea.component.scss'],
})
export class ViewChartAreaComponent implements OnDestroy, OnChanges {
  @ViewChild('wrapper', { static: true }) el: ElementRef;
  // @ViewChild('chartelement', {static: false}) el: ElementRef;
  chart: Dygraph;

  maxSources = 8;

  @Input() chartData: ChartData;

  render(data: ChartData): void {
    this.chart = new Dygraph(
      this.el.nativeElement,
      data,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data) {
      this.render(changes.data.currentValue);
    }

    if (changes.data) {
      if (this.chart) {
        // this.chart.destroy();
        // this.render('update');
      } else {
        this.render(changes.data.currentValue);// make an update method?
      }
    }
  }

  ngOnDestroy(): void {
    // this.core.unregister({ observerClass: this });

    this.chart.destroy();
  }
}
