/// <reference lib="webworker" />

import { CoreEvent } from 'app/interfaces/events';
import { Command, ReportingData } from 'app/interfaces/reporting.interface';
import { optimizeLegend, convertAggregations } from 'app/pages/reports-dashboard/utils/report.utils';

// Write a bunch of pure functions above
// and add it to our commands below

const commands = {
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
    case 'ProcessCommandsAsReportData':
      output = processCommands(evt.data as Command[]);
      emit({ name: 'ReportData', data: output, sender: evt.sender });
      break;
    case 'FetchingError':
      emit({ name: 'ReportData', data, sender: evt.sender });
      break;
  }
});
