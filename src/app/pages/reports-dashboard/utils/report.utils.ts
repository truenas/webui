import { dygraphs } from 'dygraphs';
import _ from 'lodash';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { ReportingAggregationKeys, ReportingData } from 'app/interfaces/reporting.interface';

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

// TODO: Messy. Nuke.
export function formatData(data: ReportingData): ReportingData {
  if (data.name === ReportingGraphName.NetworkInterface && data.aggregations) {
    Object.keys(data.aggregations).forEach((key) => {
      _.set(data.aggregations, key, (data.aggregations[key as ReportingAggregationKeys] as string[]).map(
        (value) => formatInterfaceUnit(value),
      ));
    });
  }

  const shouldBeReversed = data.name === ReportingGraphName.Cpu;
  if (shouldBeReversed) {
    data.legend = data.legend.reverse();
    (data.data as number[][]).forEach((row, i) => {
      // Keep date column in first position and reverse everything else.
      (data.data as number[][])[i] = [
        row[0],
        ...row.slice(1).reverse(),
      ];
    });
    data.aggregations.min = data.aggregations.min.slice().reverse();
    data.aggregations.max = data.aggregations.max.slice().reverse();
    data.aggregations.mean = data.aggregations.mean.slice().reverse();
  }

  return data;
}
