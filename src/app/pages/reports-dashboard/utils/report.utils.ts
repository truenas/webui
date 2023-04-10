import { dygraphs } from 'dygraphs';
import _ from 'lodash';
import { ReportingData, ReportingAggregationKeys } from 'app/interfaces/reporting.interface';

export function formatInterfaceUnit(value: string): string {
  if (value && value.split(' ', 2)[0] !== '0') {
    value += value.split(' ', 2)[1] ? '/s' : 'b/s';
  }
  return value;
}

export function formatLegendSeries(
  series: dygraphs.SeriesLegendData[],
  data: ReportingData,
): dygraphs.SeriesLegendData[] {
  if (data.name === 'interface') {
    series.forEach((element) => {
      element.yHTML = formatInterfaceUnit(element.yHTML);
    });
  }
  return series;
}

export function formatData(data: ReportingData): ReportingData {
  if (data.name === 'interface' && data.aggregations) {
    Object.keys(data.aggregations).forEach((key) => {
      _.set(data.aggregations, key, data.aggregations[key as ReportingAggregationKeys].map(
        (value) => formatInterfaceUnit(value),
      ));
    });
  }
  return data;
}
