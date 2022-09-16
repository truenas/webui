/// <reference lib="webworker" />

// Write a bunch of pure functions above
// and add it to our commands below

export interface CoreEvent {
  name: string;
  sender?: unknown;
  data?: unknown;
}

export type ReportingAggregationKeys = 'min' | 'mean' | 'max';

export interface ReportingData {
  end: number;
  identifier: string;
  legend: string[];
  name: string;
  start: number;
  step: number;
  data: number[][];
  aggregations: {
    [key in ReportingAggregationKeys]: (string | number)[];
  };
}

export interface Command {
  command: string; // Use '|' or '--pipe' to use the output of previous command as input
  input: unknown;
  options?: unknown[]; // Function parameters
}

const maxDecimals = (input: number, max?: number): number => {
  if (!max) {
    max = 2;
  }
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
  if (label.includes('%')) {
    units = '%';
  } else if (label.includes('°')) {
    units = '°';
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
    shortName = ` ${shortName.charAt(0).toUpperCase()}${shortName.substr(1).toLowerCase()}`;
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
  let output: string | number = value;
  if (typeof value !== 'number') { return value; }

  let converted;
  switch (units.toLowerCase()) {
    case 'bits':
      converted = convertKmgt(value, units);
      output = maxDecimals(converted.value).toString() + converted.shortName;
      break;
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
    (output.aggregations[key]).forEach((value, index) => {
      output.aggregations[key][index] = formatValue(value as number, units);
    });
  });
  return output;
}

function optimizeLegend(input: ReportingData): ReportingData {
  const output = input;
  // Do stuff
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
    case 'arcsize':
      output.legend = output.legend.map((label) => label.replace(/cache_size-/, ''));
      output.legend = output.legend.map((label) => label.replace(/_value/, ''));
      break;
    case 'arcratio':
      output.legend = output.legend.map((label) => label.replace(/cache_ratio-/, ''));
      output.legend = output.legend.map((label) => label.replace(/_value/, ''));
      break;
    case 'arcresult':
      output.legend = output.legend.map((label) => {
        const noPrefix = label.replace(/cache_result-/, '');
        const noSuffix = noPrefix.replace(/_value/, '');
        if (noSuffix === 'total') {
          return noSuffix;
        }
        const spl = noSuffix.split('-');
        return spl[1];
      });
      break;
  }
  return output;
}

function avgCpuTempReport(report: ReportingData): ReportingData {
  const output = { ...report };
  // Handle Data
  output.data = avgFromReportData(report.data);

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
    const output = avgFromReportData(input);
    return output;
  },
  optimizeLegend: (input: ReportingData) => {
    const output = optimizeLegend(input);
    return output;
  },
  convertAggregations: (input: ReportingData, options?: [string]) => {
    const output = options ? convertAggregations(input, ...options) : input;
    if (!options) {
      console.warn('You must specify a label to parse. (Usually the Y axis label). Returning input value instead');
    }
    return output;
  },
  avgCpuTempReport: (input: ReportingData) => {
    const output = avgCpuTempReport(input);
    return output;
  },
  arrayAvg: (input: number[]) => {
    const output = arrayAvg(input);
    return output;
  },
  maxDecimals: (input: number, options?: [number]) => {
    const output = options ? maxDecimals(input, ...options) : maxDecimals(input);
    return output;
  },
};

function processCommands(list: Command[]): unknown {
  let output: unknown;
  list.forEach((item) => {
    const input = item.input === '--pipe' || item.input === '|' ? output : item.input;
    output = item.options
      ? (commands as any)[item.command](input, item.options)
      : (commands as any)[item.command](input);
  });

  return output;
}

function emit(evt: CoreEvent): void {
  postMessage(evt);
}

addEventListener('message', ({ data }) => { // eslint-disable-line no-restricted-globals
  const evt = data;
  let output;

  switch (evt.name) {
    case 'SayHello':
      const response = evt.data + ' World!';
      emit({ name: 'Response', data: response });
      break;
    case 'ProcessCommands':
      output = processCommands(evt.data);
      emit({ name: 'Response', data: output, sender: evt.sender });
      break;
    case 'ProcessCommandsAsReportData':
      output = processCommands(evt.data);
      emit({ name: 'ReportData', data: output, sender: evt.sender });
      break;
    case 'FetchingError':
      emit({ name: 'ReportData', data, sender: evt.sender });
      break;
  }
});
