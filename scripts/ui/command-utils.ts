import { Command } from 'commander';
import { EnclosureDispersalStrategy, MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { CommandOptions, Headers } from './interfaces/ui-command.interface';

export function commandOpts(command: Command): CommandOptions {
  const keys: string[] = command.options.map((option) => {
    return option.long.replace(/^--/, '');
  });

  const options: CommandOptions = {};

  keys.forEach((key) => {
    if (command.getOptionValue(key)) {
      options[key] = command.getOptionValue(key) as CommandOptions[keyof CommandOptions];
    }
  });

  return options;
}

export function enumAsString(value: string): string | null {
  const trimmed = value.replace(/"|: /g, '');
  let output: string;

  // eslint-disable-next-line no-restricted-syntax
  for (const key in EnclosureDispersalStrategy) {
    if (key.toLowerCase() === trimmed) {
      output = ': EnclosureDispersalStrategy.' + key;
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key in MockStorageScenario) {
    if (key !== 'Default' && key === capitalize(trimmed, true)) {
      output = ': MockStorageScenario.' + key;
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key in TopologyItemType) {
    if (key !== 'Default' && key.toUpperCase() === trimmed) {
      output = ': TopologyItemType.' + capitalize(key);
    }
  }

  return output || value.replace(/"/g, '\'');
}

export function capitalize(text: string, firstCharOnly = false): string {
  if (firstCharOnly) {
    return text[0].toUpperCase() + text.slice(1, text.length);
  }
  return text[0].toUpperCase() + text.slice(1, text.length).toLowerCase();
}

// eslint-disable-next-line consistent-return
export function wrap(key: string, value: unknown): string {
  switch (typeof value) {
    case 'string':
      return '\'' + value + '\'';
    case 'boolean':
    case 'number':
      return value.toString();
    case 'undefined':
      console.error('Property not defined');
      break;
    case 'object': {
      if (key === 'mockConfig') {
        const regexBefore = /".*":/g;
        const regexAfter = /: ".*"/g;
        // fix indentation

        return JSON.stringify(value, null, '  ')
          .replace(regexBefore, (match) => {
            return match.replace(/"/g, '');
          }).replace(regexAfter, (match) => {
            return enumAsString(match);
          }).replace(/"/g, '\'') // Double quotes to single quotes
          .replace(/'true'/g, 'true') // remove quotes from boolean true
          .replace(/'false'/g, 'false') // remove quotes from boolean false
          .replace(/\n/g, '\n  ');
      }
    }
  }
}

export function generateHeaders(content: string): Headers {
  const width = 44;
  const start = '\n ';
  const finish = '\n';
  const asterisk = '*';
  const asterisksPerSide = (width - (content.length + 2)) / 2;
  const asterisks = asterisk.repeat(asterisksPerSide);
  return {
    header: start + asterisks + ' ' + content.toUpperCase() + ' ' + asterisks + finish,
    footer: start + asterisk.repeat(width) + '\n',
  };
}
