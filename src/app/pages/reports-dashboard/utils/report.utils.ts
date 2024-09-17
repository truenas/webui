import {
  TiB, GiB, MiB, KiB,
} from 'app/constants/bytes.constant';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { toHumanReadableKey } from 'app/helpers/object-keys-to-human-readable.helper';
import { ReportingAggregationKeys, ReportingData } from 'app/interfaces/reporting.interface';

export function formatData(data: ReportingData): ReportingData {
  const formattedData: ReportingData = { ...data };

  if (
    formattedData.name as ReportingGraphName === ReportingGraphName.NetworkInterface
    && formattedData.aggregations
  ) {
    delete formattedData.aggregations.min;
  }

  if (formattedData.name as ReportingGraphName === ReportingGraphName.Cpu) {
    formattedData.legend = [...formattedData.legend].reverse();

    formattedData.data = (formattedData.data as number[][]).map((row) => [
      row[0],
      ...row.slice(1).reverse(),
    ]);

    if (formattedData.aggregations) {
      formattedData.aggregations.min = [...formattedData.aggregations.min].reverse();
      formattedData.aggregations.max = [...formattedData.aggregations.max].reverse();
      formattedData.aggregations.mean = [...formattedData.aggregations.mean].reverse();
    }
  }

  return formattedData;
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

export function inferUnits(label: string): string | undefined {
  const lowerLabel = label.toLowerCase();

  if (label.includes('%') || lowerLabel.includes('percentage')) return '%';
  if (label.includes('°') || lowerLabel.includes('celsius')) return '°';
  if (lowerLabel.includes('mebibytes')) return 'mebibytes';
  if (lowerLabel.includes('kibibytes')) return 'kibibytes';
  if (lowerLabel.includes('kilobits')) return 'kilobits';
  if (lowerLabel.includes('bytes')) return 'bytes';
  if (lowerLabel.includes('bits')) return 'bits';

  console.warn('Could not infer units from ' + label);
  return label;
}

export function convertKmgt(input: number, units: string): { value: number; prefix: string; shortName: string } {
  const unitsMap = [
    { threshold: TiB, prefix: 'Tebi', shortName: 'TiB' },
    { threshold: GiB, prefix: 'Gibi', shortName: 'GiB' },
    { threshold: MiB, prefix: 'Mebi', shortName: 'MiB' },
    { threshold: KiB, prefix: 'Kibi', shortName: 'KiB' },
  ];

  for (const unit of unitsMap) {
    if (input >= unit.threshold) {
      const value = input / unit.threshold;
      let { shortName } = unit;
      if (units === 'bits') {
        shortName = shortName.replace('i', '');
      }
      return { value, prefix: unit.prefix, shortName };
    }
  }

  return { value: input, prefix: '', shortName: 'B' };
}

export function convertByKilobits(input: number): { value: number; suffix: string } {
  let value = input;
  let suffix = 'b';

  if (input >= 1_000_000) {
    value = input / 1_000_000;
    suffix = 'Mb';
  } else if (input >= 1_000) {
    value = input / 1_000;
    suffix = 'kb';
  }

  return { value, suffix };
}

export function convertByThousands(input: number): { value: number; suffix: string } {
  let value = input;
  let suffix = '';

  if (input >= 1_000_000) {
    value = input / 1_000_000;
    suffix = 'm';
  } else if (input >= 1_000) {
    value = input / 1_000;
    suffix = 'k';
  }

  return { value, suffix };
}

export function formatValue(value: number, units: string): string {
  const dayInSeconds = 60 * 60 * 24;
  const days = value / dayInSeconds;
  const mebibytes = convertKmgt(value * MiB, 'bytes');
  const kibibytes = convertKmgt(value * KiB, 'bytes');
  const kilobits = convertByKilobits(value * 1000);
  const bytes = convertKmgt(value, units);
  const thousands = convertByThousands(value);

  if (typeof value !== 'number') return String(value);

  switch (units.toLowerCase()) {
    case 'seconds':
      return `${maxDecimals(days, 1)} days`;
    case 'mebibytes':
      return `${maxDecimals(mebibytes.value)} ${mebibytes.shortName}`;
    case 'kibibytes':
      return `${maxDecimals(kibibytes.value)} ${kibibytes.shortName}`;
    case 'kilobits':
      return `${maxDecimals(kilobits.value)} ${kilobits.suffix}`;
    case 'bits':
    case 'bytes':
      return `${maxDecimals(bytes.value)} ${bytes.shortName}`;
    default:
      return `${maxDecimals(thousands.value)}${thousands.suffix}`;
  }
}

export function convertAggregations(input: ReportingData, labelY?: string): ReportingData {
  const output = { ...input };
  const units = inferUnits(labelY);
  const keys = Object.keys(output.aggregations);

  keys.forEach((key: ReportingAggregationKeys) => {
    const values = output.aggregations[key];

    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        const formattedValue = formatValue(value as number, units);
        const suffix = labelY.endsWith('/s') && formattedValue !== '0' ? '/s' : '';
        (output.aggregations[key] as (string | number)[])[index] = formattedValue + suffix;
      });
    } else {
      output.aggregations[key] = Object.values(values).map((value) => {
        const formattedValue = formatValue(value as number, units);
        const suffix = labelY.endsWith('/s') && formattedValue !== '0' ? '/s' : '';
        return formattedValue + suffix;
      });
    }
  });
  return output;
}

export function optimizeLegend(input: ReportingData): ReportingData {
  const output = { ...input, legend: [...input.legend] };

  if (output.legend.includes('time')) {
    output.legend.shift();
  }

  const replacements: Record<string, (label: string) => string> = {
    upsbatterycharge: () => 'Percent Charge',
    upsremainingbattery: () => 'Time remaining (Minutes)',
    load: (label) => label.replace(/load_/, ''),
    disktemp: () => 'Temperature',
    memory: (label) => label.replace(/memory-|_value/g, ''),
    swap: (label) => label.replace(/swap-|_value/g, ''),
    interface: (label) => label.replace(/if_|octets_/g, (match) => (match === 'octets_' ? 'octets ' : '')),
    nfsstat: (label) => label.replace(/nfsstat-|_value/g, ''),
    nfsstatbytes: (label) => label.replace(/nfsstat-|_bytes_value/g, ''),
    df: (label) => label.replace(/df_complex-|_value/g, ''),
    processes: (label) => label.replace(/ps_state-|_value/g, ''),
    uptime: (label) => label.replace(/_value/g, ''),
    ctl: (label) => label.replace(/disk_octets_/, ''),
    disk: (label) => label.replace(/disk_octets_/, ''),
    diskgeombusy: () => 'Busy',
    diskgeomlatency: (label) => label.replace(/geom_latency-/, ''),
    diskgeomopsrwd: (label) => label.replace(/geom_ops_rwd-/, ''),
    diskgeomqueue: (label) => label.replace(/geom_queue-/, ''),
  };

  if (replacements[output.name]) {
    const replaceFn = replacements[output.name];
    output.legend = output.legend.map((value) => toHumanReadableKey(replaceFn(value)));
  }

  return output;
}
