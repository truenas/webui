import * as inquirer from 'inquirer';
import type { QuestionCollection } from 'inquirer';
import { enclosureMocks } from 'app/core/testing/mock-enclosure/enclosure-templates';
import {
  MockStorageScenario,
  mockStorageScenarioLabels,
} from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
// eslint-disable-next-line no-restricted-imports
import { getCurrentConfig, updateEnvironment } from '../utils/save-environment.utils';

interface Answers {
  controllerModel: string;
  expansionModels: string;
  scenario: MockStorageScenario;
}

export async function mockEnclosureCommand(): Promise<void> {
  console.info(currentMockConfig());
  const { enable }: { enable: boolean } = await inquirer.prompt({
    name: 'enable',
    type: 'confirm',
    message: 'Enable enclosure mocking?',
  });

  if (!enable) {
    updateEnvironment({
      mockConfig: {
        enabled: false,
      },
    });
    return;
  }

  const answers = await inquirer.prompt<Answers>(getMockQuestions());

  const expansionModels = answers.expansionModels
    ? answers.expansionModels.split(',').map((model) => model.trim())
    : [];

  updateEnvironment({
    mockConfig: {
      expansionModels,
      enabled: true,
      controllerModel: answers.controllerModel,
      scenario: answers.scenario,
    },
  });
}

// MockEnclosureConfig
function getMockQuestions(): QuestionCollection {
  return [
    {
      name: 'controllerModel',
      message: 'Select a controller model',
      type: 'list',
      choices: Array.from(enclosureMocks.keys()).filter((model) => !model.startsWith('E')),
    },
    {
      name: 'expansionModels',
      message: () => {
        const shelves = Array.from(enclosureMocks.keys()).filter((model) => model.startsWith('E'));
        return `What expansion shelves would you like to use?
        \n Enter zero or more answers separated with a comma.
        \n Available options: ${shelves.join(', ')}`;
      },
      type: 'input',
      default: '',
    },
    {
      name: 'scenario',
      message: 'Select mocking scenario',
      type: 'list',
      choices: () => {
        return Array.from(mockStorageScenarioLabels).map(([key, name]) => ({
          name,
          value: key,
        }));
      },
      default: MockStorageScenario.FillSomeSlots,
    },
  ];
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
