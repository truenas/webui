import fs, { existsSync, readFileSync } from 'fs';
import { WebUiEnvironment } from 'environments/environment.interface';
import {
  invert, isArray, mergeWith,
} from 'lodash-es';
import { DeepPartial } from 'utility-types';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { environmentTemplate, environmentTs } from './variables';

interface ConfigVariables {
  remote: string;
  buildYear: number;
  mockConfig: {
    enabled: boolean;
    controllerModel: string;
    expansionModels: string[];
    scenario: MockEnclosureScenario;
  };
}

const defaults: ConfigVariables = {
  remote: '_REMOTE_',
  buildYear: new Date().getFullYear(),
  mockConfig: {
    enabled: false,
    controllerModel: EnclosureModel.M40,
    expansionModels: [],
    scenario: MockEnclosureScenario.FillSomeSlots,
  },
};

export async function updateEnvironment(newValues: DeepPartial<ConfigVariables>): Promise<void> {
  const currentConfig = await getCurrentConfig();
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
      enumName: 'MockEnclosureScenario',
      enum: MockEnclosureScenario,
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

export async function getCurrentConfig(): Promise<WebUiEnvironment> {
  if (!existsSync(environmentTs)) {
    return {} as WebUiEnvironment;
  }

  return (await import(environmentTs) as { environment: WebUiEnvironment }).environment;
}
