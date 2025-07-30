import fs, { existsSync, readFileSync } from 'fs';
import { WebUiEnvironment } from 'environments/environment.interface';
import {
  isArray, mergeWith,
} from 'lodash-es';
import { DeepPartial } from 'utility-types';
import { environmentTemplate, environmentTs } from './variables';

interface ConfigVariables {
  remote: string;
  buildYear: number;
  debugPanel?: {
    enabled: boolean;
    defaultMessageLimit: number;
    mockJobDefaultDelay: number;
    persistMockConfigs: boolean;
  };
}

const defaults: ConfigVariables = {
  remote: '_REMOTE_',
  buildYear: new Date().getFullYear(),
  debugPanel: {
    enabled: true,
    defaultMessageLimit: 300,
    mockJobDefaultDelay: 1000,
    persistMockConfigs: true,
  },
};

export async function updateEnvironment(newValues: DeepPartial<ConfigVariables>): Promise<void> {
  const currentConfig = await getCurrentConfig();
  const valuesToWrite = mergeWith({}, defaults, currentConfig, newValues, (_, b) => {
    return isArray(b) ? b : undefined;
  });

  const configTemplate = getConfigTemplate();
  let configToWrite = configTemplate
    .replace('_REMOTE_', stringify(valuesToWrite.remote))
    .replace('_BUILD_YEAR_', stringify(valuesToWrite.buildYear));

  // Add debugPanel configuration if present
  if (valuesToWrite.debugPanel) {
    const debugPanelConfig = `
  debugPanel: {
    enabled: ${stringify(valuesToWrite.debugPanel.enabled)},
    defaultMessageLimit: ${stringify(valuesToWrite.debugPanel.defaultMessageLimit)},
    mockJobDefaultDelay: ${stringify(valuesToWrite.debugPanel.mockJobDefaultDelay)},
    persistMockConfigs: ${stringify(valuesToWrite.debugPanel.persistMockConfigs)},
  },`;

    // Insert debugPanel configuration after buildYear
    configToWrite = configToWrite.replace(
      /(\s*buildYear: [^,]+),/,
      `$1,${debugPanelConfig}`,
    );
  }

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
