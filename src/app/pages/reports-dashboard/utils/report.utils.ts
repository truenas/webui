import { dygraphs } from 'dygraphs';
import _ from 'lodash';
import {
  TiB, GiB, MiB, KiB,
} from 'app/constants/bytes.constant';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { ReportingAggregationKeys, ReportingData } from 'app/interfaces/reporting.interface';

export function formatInterfaceUnit(value: string): string {
  if (value && value.split(' ', 2)[0] !== '0' && !value?.endsWith('/s')) {
    value += value?.endsWith('b') || value?.endsWith('B') ? '/s' : 'b/s';
  }
  return value;
}

export function formatLegendSeries(
  series: dygraphs.SeriesLegendData[],
  data: ReportingData,
): dygraphs.SeriesLegendData[] {
  if (data?.name === ReportingGraphName.NetworkInterface) {
    series.forEach((element) => {
      element.yHTML = formatInterfaceUnit(element.yHTML);
    });
  }
  return series;
}

// TODO: Messy. Nuke.
export function formatData(data: ReportingData): ReportingData {
  if (data.name === ReportingGraphName.NetworkInterface && data.aggregations) {
    delete data.aggregations.min; // Will always be showing bogus small values
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

export const maxDecimals = (input: number, max = 2): number => {
  const str = input.toString().split('.');
  if (!str[1]) {
    // Not a float
    return input;
  }
  const decimals = str[1].length;
  const output = decimals > max ? input.toFixed(max) : input;
  const prepareInput = parseFloat(output as string);
  return prepareInput < 1000 ? Number(prepareInput.toString().slice(0, 4)) : Math.round(prepareInput);
};

export function inferUnits(label: string): string {
  // Figures out from the label what the unit is
  let units = label;
  if (label.includes('%') || label.toLowerCase().includes('percentage')) {
    units = '%';
  } else if (label.includes('°') || label.toLowerCase().includes('celsius')) {
    units = '°';
  } else if (label.toLowerCase().includes('mebibytes')) {
    units = 'mebibytes';
  } else if (label.toLowerCase().includes('kibibytes')) {
    units = 'kibibytes';
  } else if (label.toLowerCase().includes('kilobits')) {
    units = 'kilobits';
  } else if (label.toLowerCase().includes('bytes')) {
    units = 'bytes';
  } else if (label.toLowerCase().includes('bits')) {
    units = 'bits';
  }

  if (typeof units === 'undefined') {
    console.warn('Could not infer units from ' + label);
  }

  return units;
}

export function convertKmgt(input: number, units: string): { value: number; prefix: string; shortName: string } {
  let prefix = '';
  let shortName = '';
  let output: number = input;

  if (input > TiB) {
    prefix = 'Tebi';
    shortName = ' TiB';
    output = input / TiB;
  } else if (input < TiB && input > GiB) {
    prefix = 'Gibi';
    shortName = ' GiB';
    output = input / GiB;
  } else if (input < GiB && input > MiB) {
    prefix = 'Mebi';
    shortName = ' MiB';
    output = input / MiB;
  } else if (input < MiB && input > KiB) {
    prefix = 'Kibi';
    shortName = ' KiB';
    output = input / KiB;
  }

  if (units === 'bits') {
    shortName = shortName.replace(/i/, '').trim();
    shortName = ` ${shortName.charAt(0).toUpperCase()}${shortName.substring(1).toLowerCase()}`;
  }

  return { value: output, prefix, shortName };
}

export function convertByKilo(input: number): { value: number; suffix: string; shortName: string } {
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

  return { value: output, suffix, shortName: '' };
}

export function formatValue(value: number, units: string): string | number {
  const day = 60 * 60 * 24;
  let output: string | number = value;
  if (typeof value !== 'number') { return value; }

  let converted;
  switch (units.toLowerCase()) {
    case 'seconds':
      converted = { value: value / day, shortName: ' days' };
      output = maxDecimals(converted.value, 1).toString() + converted.shortName;
      break;
    case 'mebibytes':
      converted = convertKmgt(value * MiB, 'bytes');
      output = maxDecimals(converted.value).toString() + converted.shortName;
      break;
    case 'kibibytes':
      converted = convertKmgt(value * KiB, 'bytes');
      output = maxDecimals(converted.value).toString() + converted.shortName;
      break;
    case 'kilobits':
      converted = convertByKilo(output * 1000);
      output = typeof output === 'number' ? maxDecimals(converted.value).toString() + converted.suffix : value;
      break;
    case 'bits':
    case 'bytes':
      converted = convertKmgt(value, units);
      output = maxDecimals(converted.value).toString() + converted.shortName;
      break;
    case '%':
    case '°':
    default:
      converted = convertByKilo(output);
      return typeof output === 'number' ? maxDecimals(converted.value).toString() + converted.suffix : value;
  }

  return output;
}

export function convertAggregations(input: ReportingData, labelY?: string): ReportingData {
  const output = { ...input };
  const units = inferUnits(labelY);
  const keys = Object.keys(output.aggregations);

  keys.forEach((key: ReportingAggregationKeys) => {
    const values = output.aggregations[key];

    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        (output.aggregations[key] as (string | number)[])[index] = formatValue(value as number, units);
      });
    } else {
      output.aggregations[key] = Object.values(values).map((value) => formatValue(value as number, units));
    }
  });
  return output;
}

export function optimizeLegend(input: ReportingData): ReportingData {
  const output = input;
  // Do stuff
  if (output.legend.includes('time')) {
    // remove `time` legend item
    output.legend.splice(0, 1);
  }
  switch (input.name) {
    case 'upsbatterycharge':
      output.legend = ['Percent Charge'];
      break;
    case 'upsremainingbattery':
      output.legend = ['Time remaining (Minutes)'];
      break;
    case 'load':
      output.legend = output.legend.map((label) => label.replace(/load_/, ''));
      break;
    case 'disktemp':
      output.legend = ['temperature'];
      break;
    case 'memory':
      output.legend = output.legend.map((label) => label.replace(/memory-/, ''));
      output.legend = output.legend.map((label) => label.replace(/_value/, ''));
      break;
    case 'swap':
      output.legend = output.legend.map((label) => label.replace(/swap-/, ''));
      output.legend = output.legend.map((label) => label.replace(/_value/, ''));
      break;
    case 'interface':
      output.legend = output.legend.map((label) => label.replace(/if_/, ''));
      output.legend = output.legend.map((label) => label.replace(/octets_/, 'octets '));
      break;
    case 'nfsstat':
      output.legend = output.legend.map((label) => label.replace(/nfsstat-/, ''));
      output.legend = output.legend.map((label) => label.replace(/_value/, ''));
      break;
    case 'nfsstatbytes':
      output.legend = output.legend.map((label) => label.replace(/nfsstat-/, ''));
      output.legend = output.legend.map((label) => label.replace(/_bytes_value/, ''));
      break;
    case 'df':
      output.legend = output.legend.map((label) => label.replace(/df_complex-/, ''));
      output.legend = output.legend.map((label) => label.replace(/_value/, ''));
      break;
    case 'processes':
      output.legend = output.legend.map((label) => label.replace(/ps_state-/, ''));
      output.legend = output.legend.map((label) => label.replace(/_value/, ''));
      break;
    case 'uptime':
      output.legend = output.legend.map((label) => label.replace(/_value/, ''));
      break;
    case 'ctl':
    case 'disk':
      output.legend = output.legend.map((label) => label.replace(/disk_octets_/, ''));
      break;
    case 'diskgeombusy':
      output.legend = output.legend.map(() => 'busy');
      break;
    case 'diskgeomlatency':
      output.legend = output.legend.map((label) => label.replace(/geom_latency-/, ''));
      output.legend = output.legend.map((label) => {
        const spl = label.split('_');
        return spl[1];
      });
      break;
    case 'diskgeomopsrwd':
      output.legend = output.legend.map((label) => label.replace(/geom_ops_rwd-/, ''));
      output.legend = output.legend.map((label) => {
        const spl = label.split('_');
        return spl[1];
      });
      break;
    case 'diskgeomqueue':
      output.legend = output.legend.map((label) => label.replace(/geom_queue-/, ''));
      output.legend = output.legend.map((label) => {
        const spl = label.split('_');
        return spl[1];
      });
      break;
  }
  return output;
}
