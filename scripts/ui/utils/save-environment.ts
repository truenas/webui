import fs, { existsSync, readFileSync } from 'fs';
import { WebUiEnvironment } from 'environments/environment.interface';
import {
  invert, isArray, mergeWith,
} from 'lodash';
import { DeepPartial } from 'utility-types';
import { MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { environmentTemplate, environmentTs } from './variables';

interface ConfigVariables {
  remote: string;
  buildYear: number;
  mockConfig: {
    enabled: boolean;
    controllerModel: string;
    expansionModels: string[];
    scenario: MockStorageScenario;
  };
}

const defaults: ConfigVariables = {
  remote: '_REMOTE_',
  buildYear: new Date().getFullYear(),
  mockConfig: {
    enabled: false,
    controllerModel: EnclosureModel.M40,
    expansionModels: [],
    scenario: MockStorageScenario.FillSomeSlots,
  },
};

export function updateEnvironment(newValues: DeepPartial<ConfigVariables>): void {
  const currentConfig = getCurrentConfig();
  const valuesToWrite = mergeWith({}, defaults, currentConfig, newValues, (_, b) => {
    return isArray(b) ? b : undefined;
  });

  const configTemplate = getConfigTemplate();
  const configToWrite = configTemplate
    .replace('_REMOTE_', stringify(valuesToWrite.remote))
    .replace('_BUILD_YEAR_', stringify(valuesToWrite.buildYear))
    .replace('_MOCK_ENABLED_', stringify(Boolean(valuesToWrite.mockConfig.enabled)))
    .replace('_MOCK_CONTROLLER_', printModel(valuesToWrite.mockConfig.controllerModel))
    .replace('_MOCK_EXPANSIONS_', printEnumArray({
      enumName: 'EnclosureModel',
      enum: EnclosureModel,
      values: valuesToWrite.mockConfig.expansionModels,
    }))
    .replace('_MOCK_SCENARIO_', printEnum({
      enumName: 'MockStorageScenario',
      enum: MockStorageScenario,
      value: valuesToWrite.mockConfig.scenario,
    }));

  writeToEnvironment(configToWrite);
}

export function writeToEnvironment(value: string): void {
  fs.writeFileSync(environmentTs, value, 'utf8');
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

function printModel(value: string): string {
  if (value.startsWith('Fake')) {
    return `'${value}' as unknown as EnclosureModel`;
  }

  return printEnum({
    value,
    enum: EnclosureModel,
    enumName: 'EnclosureModel',
  });
}

function printEnumArray(options: { enumName: string; enum: Record<string, string>; values: string[] }): string {
  return `[${options.values.map((value) => printModel(value)).join(', ')}]`;
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
