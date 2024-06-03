import fs, { existsSync, readFileSync } from 'fs';
import { WebUiEnvironment } from 'environments/environment.interface';
import { invert, merge } from 'lodash';
import { DeepPartial } from 'utility-types';
import { MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { environmentTemplate, environmentTs } from './variables';

interface ConfigVariables {
  remote: string;
  mockConfig: {
    enabled: boolean;
    controllerModel: string;
    expansionModels: string[];
    scenario: MockStorageScenario;
  };
}

const defaults: ConfigVariables = {
  remote: '$REMOTE$',
  mockConfig: {
    enabled: false,
    controllerModel: 'M40',
    expansionModels: [],
    scenario: MockStorageScenario.FillSomeSlots,
  },
};

export function updateEnvironment(newValues: DeepPartial<ConfigVariables>): void {
  const currentConfig = getCurrentConfig();
  const valuesToWrite = merge({}, defaults, currentConfig, newValues);

  const configTemplate = getConfigTemplate();
  const configToWrite = configTemplate
    .replace('$REMOTE$', stringify(valuesToWrite.remote))
    .replace('$MOCK_ENABLED$', stringify(Boolean(valuesToWrite.mockConfig.enabled)))
    .replace('$MOCK_CONTROLLER$', stringify(valuesToWrite.mockConfig.controllerModel))
    .replace('$MOCK_EXPANSIONS$', stringify(valuesToWrite.mockConfig.expansionModels))
    .replace('$MOCK_SCENARIO$', printEnum({
      enumName: 'MockStorageScenario',
      enum: MockStorageScenario,
      value: valuesToWrite.mockConfig.scenario,
    }));

  fs.writeFileSync(environmentTs, configToWrite, 'utf8');
}

/**
 * Mostly JSON.stringify, but with single quotes for strings.
 */
function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return `'${value}'`;
  }
  return JSON.stringify(value);
}

function printEnum(options: { enumName: string; enum: Record<string, string>; value: string }): string {
  const flippedEnum = invert(options.enum);
  return `${options.enumName}.${flippedEnum[options.value]}`;
}

export function getConfigTemplate(): string {
  return readFileSync(environmentTemplate, 'utf8');
}

export function getCurrentConfigAsString(): string {
  if (!existsSync(environmentTs)) {
    return '';
  }
  return readFileSync(environmentTs, 'utf8');
}

export function getCurrentConfig(): WebUiEnvironment {
  if (!existsSync(environmentTs)) {
    return {} as WebUiEnvironment;
  }

  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-member-access,global-require,import/no-dynamic-require
  return require(environmentTs).environment;
}
