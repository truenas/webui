/// <reference lib="webworker" />

// Write a bunch of pure functions above
// and add it to our commands below

const tableUtils = {
  debug: true,
  maxDecimals: (input: any, max?: number) => {
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
    return parseFloat(output);
  },
  arrayAvg: (input: number[]) => {
    const sum = input.reduce((acc, cv) => acc + cv);
    const avg = sum / input.length;
    return maxDecimals(avg);
  },
  avgFromReportData: (input: number[][]) => {
    const output: number[][] = [];
    input.forEach((item) => {
      const avg = arrayAvg(item);
      output.push([avg]);
    });
    return output;
  },
  inferUnits: (label: string) => {
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
  },
  convertKmgt: (input: number, units: string) => {
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
      shortName = shortName.replace(/i/, '');
      shortName = shortName.toLowerCase();
    }

    return { value: output, prefix, shortName };
  },
  convertByKilo: (input: number) => {
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
  },
  formatValue: (value: number, units: string) => {
    let output: any = value;
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
        return typeof output === 'number' ? maxDecimals(converted.value).toString() + converted.suffix : value;// [this.limitDecimals(value), ''];
        // break;
    }

    return output; // ? output : value;
  },
  convertAggregations: (input: any, labelY?: string) => {
    const output = { ...input };
    const units = inferUnits(labelY);
    const keys = Object.keys(output.aggregations);

    keys.forEach((key) => {
      output.aggregations[key].forEach((value: number, index: number) => {
        output.aggregations[key][index] = formatValue(value, units);
      });
    });
    return output;
  },
};

function processTableCommands(list: any[]): any {
  let output: any;
  list.forEach((item) => {
    const input = item.input === '--pipe' || item.input === '|' ? output : item.input;
    output = item.options
      ? (tableUtils as any)[item.command](input, item.options)
      : (tableUtils as any)[item.command](input);
  });

  return output;
}

function tableUtilsEmit(evt: any): void {
  postMessage(evt);
}

addEventListener('message', ({ data }) => { // eslint-disable-line no-restricted-globals
  const evt = data;
  let output;

  switch (evt.name) {
    case 'SayHello':
      const response = evt.data + ' World!';
      tableUtilsEmit({ name: 'Response', data: response });
      break;
    case 'ProcessCommands':
      output = processTableCommands(evt.data);
      tableUtilsEmit({ name: 'Response', data: output, sender: evt.sender });
      break;
  }
});
