/// <reference lib="webworker" />

import { KiB, MiB } from 'app/constants/bytes.constant';
import { ReportingData, ReportingAggregationKeys } from 'app/interfaces/reporting.interface';

// Write a bunch of pure functions above
// and add it to our commands below

export interface CoreEvent {
  name: string;
  sender?: unknown;
  data?: unknown;
}

export interface Command {
  command: string; // Use '|' or '--pipe' to use the output of previous command as input
  input: unknown;
  options?: unknown[]; // Function parameters
}

const maxDecimals = (input: number, max = 2): number => {
  const str = input.toString().split('.');
  if (!str[1]) {
    // Not a float
    return input;
  }
  const decimals = str[1].length;
  const output = decimals > max ? input.toFixed(max) : input;
  return parseFloat(output as string);
};

function arrayAvg(input: number[]): number {
  const sum = input.reduce((acc, cv) => acc + cv);
  const avg = sum / input.length;
  return maxDecimals(avg);
}

function avgFromReportData(input: number[][]): number[][] {
  const output: number[][] = [];
  input.forEach((item) => {
    const avg = arrayAvg(item);
    output.push([avg]);
  });
  return output;
}

function inferUnits(label: string): string {
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

function convertKmgt(input: number, units: string): { value: number; prefix: string; shortName: string } {
  const kilo = 1024;
  const mega = kilo * 1024;
  const giga = mega * 1024;
  const tera = giga * 1024;

  let prefix = '';
  let shortName = '';
  let output: number = input;

  if (input > tera) {
    prefix = 'Tera';
    shortName = ' TiB';
    output = input / tera;
  } else if (input < tera && input > giga) {
    prefix = 'Giga';
    shortName = ' GiB';
    output = input / giga;
  } else if (input < giga && input > mega) {
    prefix = 'Mega';
    shortName = ' MiB';
    output = input / mega;
  } else if (input < mega && input > kilo) {
    prefix = 'Kilo';
    shortName = ' KiB';
    output = input / kilo;
  }

  if (units === 'bits') {
    shortName = shortName.replace(/i/, '').trim();
    shortName = ` ${shortName.charAt(0).toUpperCase()}${shortName.substring(1).toLowerCase()}`;
  }

  return { value: output, prefix, shortName };
}

function convertByKilo(input: number): { value: number; suffix: string; shortName: string } {
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

function formatValue(value: number, units: string): string | number {
  const day = 60 * 60 * 24;
  let output: string | number = value;
  if (typeof value !== 'number') { return value; }

  let converted;
  switch (units.toLowerCase()) {
    case 'seconds':
      converted = { value: value / day, shortName: ' days' };
      output = maxDecimals(converted.value, 0).toString() + converted.shortName;
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

function convertAggregations(input: ReportingData, labelY?: string): ReportingData {
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

function optimizeLegend(input: ReportingData): ReportingData {
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

function avgCpuTempReport(report: ReportingData): ReportingData {
  const output = { ...report };
  // Handle Data
  output.data = avgFromReportData(report.data as number[][]);

  // Handle Legend
  output.legend = ['Avg Temp'];

  // Handle Aggregations
  const keys = Object.keys(output.aggregations);
  keys.forEach((key: ReportingAggregationKeys) => {
    output.aggregations[key] = [arrayAvg(output.aggregations[key] as number[])];
  });

  return output;
}

// Pseudo command line interface
// we can call the worker's functions
// using text input. The Unix way ;-)
const commands = {
  // POC commands
  echo: (input: string) => {
    // eslint-disable-next-line no-console
    console.log(input);
    return input;
  },
  toLowerCase: (input: string) => {
    const output = input.toLowerCase();
    // eslint-disable-next-line no-console
    console.log(output);
    return output;
  },
  length: (input: string) => {
    const output = input.length;
    // eslint-disable-next-line no-console
    console.log(output);
    return output;
  },
  avgFromReportData: (input: number[][]) => {
    return avgFromReportData(input);
  },
  optimizeLegend: (input: ReportingData) => {
    return optimizeLegend(input);
  },
  convertAggregations: (input: ReportingData, options?: [string]) => {
    const output = options ? convertAggregations(input, ...options) : input;
    if (!options) {
      console.warn('You must specify a label to parse. (Usually the Y axis label). Returning input value instead');
    }
    return output;
  },
  avgCpuTempReport: (input: ReportingData) => {
    return avgCpuTempReport(input);
  },
  arrayAvg: (input: number[]) => {
    return arrayAvg(input);
  },
  maxDecimals: (input: number, options?: [number]) => {
    return options ? maxDecimals(input, ...options) : maxDecimals(input);
  },
};

function processCommands(list: Command[]): unknown {
  let output: unknown;
  list.forEach((item) => {
    const input = item.input === '--pipe' || item.input === '|' ? output : item.input;
    const command = commands[item.command as keyof typeof commands];
    output = item.options
      ? (command as (input: unknown, options: unknown[]) => unknown)(input, item.options)
      : (command as (input: unknown) => unknown)(input);
  });

  return output;
}

function emit(evt: CoreEvent): void {
  postMessage(evt);
}

addEventListener('message', ({ data }: { data: CoreEvent }) => { // eslint-disable-line no-restricted-globals
  const evt = data;
  let output;

  switch (evt.name) {
    case 'SayHello': {
      const response = `${String(evt.data)} World!`;
      emit({ name: 'Response', data: response });
      break;
    }
    case 'ProcessCommands':
      output = processCommands(evt.data as Command[]);
      emit({ name: 'Response', data: output, sender: evt.sender });
      break;
    case 'ProcessCommandsAsReportData':
      output = processCommands(evt.data as Command[]);
      emit({ name: 'ReportData', data: output, sender: evt.sender });
      break;
    case 'FetchingError':
      emit({ name: 'ReportData', data, sender: evt.sender });
      break;
  }
});
