import { confirm, select, input } from '@inquirer/prompts';
import { enclosureMocks } from 'app/core/testing/mock-enclosure/enclosure-templates/enclosure-mocks';
import {
  MockStorageScenario,
  mockStorageScenarioLabels,
} from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
// eslint-disable-next-line no-restricted-imports
import { getCurrentConfig, updateEnvironment } from '../utils/save-environment';

export async function mockEnclosureCommand(): Promise<void> {
  console.info(currentMockConfig());
  const enable = await confirm({ message: 'Enable enclosure mocking?' });

  if (!enable) {
    updateEnvironment({
      mockConfig: {
        enabled: false,
      },
    });
    return;
  }

  const controllerModel = await select({
    message: 'Select a controller model',
    choices: enclosureMocks
      .filter((mock) => mock.controller)
      .map((mock) => ({
        name: mock.model,
        value: mock.model,
      })),
  });

  const allShelves = enclosureMocks
    .filter((mock) => !mock.controller)
    .map((mock) => mock.model);

  const expansionModelsAnswer = await input({
    message: `What expansion shelves would you like to use?
Enter zero or more answers separated with a comma.
Available options: ${allShelves.join(', ')}:\n`,
    default: '',
  });
  const expansionModels = expansionModelsAnswer
    ? expansionModelsAnswer.split(',').map((model) => model.trim())
    : [];

  const scenario = await select({
    message: 'Select mocking scenario',
    choices: Array.from(mockStorageScenarioLabels).map(([key, name]) => ({
      name,
      value: key,
    })),
    default: MockStorageScenario.FillSomeSlots,
  });

  updateEnvironment({
    mockConfig: {
      controllerModel,
      expansionModels,
      scenario,
      enabled: true,
    },
  });
}

export function currentMockConfig(): string {
  const environment = getCurrentConfig();
  const printedConfig = `Enclosure Mocks: ${environment.mockConfig.enabled ? 'Enabled' : 'Disabled'}`;

  if (!environment.mockConfig.enabled) {
    return printedConfig;
  }

  return `
${printedConfig}
  - Controller: ${environment.mockConfig.controllerModel}
  - Expansion Shelves: ${environment.mockConfig.expansionModels.join(', ')}
  - Scenario: ${mockStorageScenarioLabels.get(environment.mockConfig.scenario)}`;
}
