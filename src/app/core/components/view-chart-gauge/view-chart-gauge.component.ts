import {
  Component, AfterViewInit, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { UUID } from 'angular2-uuid';
import * as d3 from 'd3';

export interface GaugeConfig {
  label: boolean; // to turn off the min/max labels.
  units: string;
  diameter: number;
  fontSize: number;
  min?: number; // 0 is default, //can handle negative min e.g. vacuum / voltage / current flow / rate of change
  max?: number; // 100 is default
  width?: number; // for adjusting arc thickness
  data: (string | number)[];
  subtitle?: string;
}

@Component({
  selector: 'viewchartgauge',
  templateUrl: './view-chart-gauge.component.html',
})
export class ViewChartGaugeComponent /* extends DisplayObject */ implements AfterViewInit, OnChanges {
  subtitle = '';
  chartType = 'gauge';
  chartClass = 'view-chart-gauge';
  private _data: (string | number)[];
  private arc: d3.Arc<unknown, d3.DefaultArcObject>;
  chartId = UUID.UUID();
  private doublePI = 2 * Math.PI;
  units = '%'; // default unit type
  diameter = 120; // default diameter

  @Input() config: GaugeConfig;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      if (changes.config.currentValue && changes.config.currentValue.subtitle) {
        this.subtitle = changes.config.currentValue.subtitle;
      }

      if (changes.config.currentValue && changes.config.currentValue.data) {
        this.data = changes.config.currentValue.data;
        if (!this.arc) {
          this.render();
        } else {
          this.update(changes.config.currentValue.data[1]);
        }
      }
    }
  }

  ngAfterViewInit(): void {
    this.render();
  }

  get data(): (string | number)[] {
    return this._data;
  }

  set data(d) {
    this._data = d;
  }

  render(): void {
    const lineWidth = 10;
    this.arc = d3.arc()
      .innerRadius(this.config.diameter / 2 - lineWidth) // 80
      .outerRadius(this.config.diameter / 2) // 90
      .startAngle(0);

    const width = this.config.diameter;
    const height = this.config.diameter;
    const svg = d3.select('#gauge-' + this.chartId).append('svg')
      .attr('width', width)
      .attr('height', height);

    // Arc Group
    const g = svg.append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    // Text Group
    const gt = svg.append('g').attr('class', 'text-group');

    // Setup value text element
    const text = gt.append('text').attr('id', 'text-value');
    if (!text.node()) {
      // Avoid console errors if text.node isn't available yet.
      return;
    }

    // Value as text
    text.style('fill', 'var(--fg2)')
      .style('font-size', this.config.fontSize.toString() + 'px')
      .style('font-weight', 500)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central');

    // Setup subtitle text element
    const subtext = gt.append('text').attr('id', 'text-subtitle');
    if (!subtext.node()) {
      // Avoid console errors if text.node isn't available yet.
      return;
    }
    // Subtitle as text
    subtext.style('fill', 'var(--fg2)')
      .style('font-size', (this.config.fontSize / 2) + 'px')
      .style('font-weight', 400)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central');

    if (this.subtitle) {
      this.updateSubtitle();
    }

    // Adjust group to compensate
    const isFirefox: boolean = navigator.userAgent.toLowerCase().includes('firefox');
    const offsetY = isFirefox ? 10 : 0;
    const bbox = gt.node().getBBox();
    const top = (height / 2) - (bbox.height / 2);
    text.attr('x', width / 2)
      .attr('y', top + offsetY);

    subtext.attr('x', width / 2)
      .attr('y', top + 24 + offsetY);

    // Arc background
    g.append('path')
      .datum({ endAngle: this.doublePI })
      .style('fill', 'var(--bg1)')
      .attr('d', this.arc);

    // Arc foreground
    g.append('path')
      .datum({ endAngle: 0.127 * this.doublePI })
      .style('fill', 'var(--primary)')
      .attr('class', 'value')
      .attr('d', this.arc);

    this.update(this.config.data[1] as number);
  }

  update(value: number): void {
    if (!document.hidden) {
      d3.transition()
        .select('#gauge-' + this.chartId + ' path.value')
        .duration(750)
        .attrTween('d', this.load(this.percentToAngle(value)));

      d3.select('#gauge-' + this.chartId + ' text#text-value')
        .text(value + this.config.units);
    }
  }

  load(newAngle: number) {
    return (d: any) => {
      const interpolate = d3.interpolate(d.endAngle, newAngle);

      return (t: number) => {
        d.endAngle = interpolate(t);

        return this.arc(d);
      };
    };
  }

  percentToAngle(value: number): number {
    return value / 100 * this.doublePI;
  }

  updateSubtitle(): void {
    d3.select('#gauge-' + this.chartId + ' #text-value');
    d3.select('#gauge-' + this.chartId + ' #text-subtitle')
      .text(this.subtitle);
  }
}
