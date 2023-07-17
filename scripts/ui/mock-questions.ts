import {QuestionCollection} from "inquirer";
import fs from "fs";
import {CommandOptions} from "./interfaces/ui-command.interface";

export function mockConfigLoaderQuestions(
  mockConfigDir: string,
  includedDir: string,
  customDir: string
): QuestionCollection {
  const locationChoices: string[] = ['included', 'custom'];
  const includedChoices: string[] = fs.readdirSync(mockConfigDir + includedDir).filter((fileName: string) => {
    return fileName.endsWith('config.json');
  });
  const customChoices: string[] = fs.readdirSync(mockConfigDir + customDir).filter((fileName: string) => {
    return fileName.endsWith('config.json');
  });

  return [
    {
      name: 'location',
      message: 'Would you like to load an included or a custom config?',
      type: 'list',
      choices: locationChoices,
      default: 'included'
    },
    {
      name: 'customFile',
      message: 'Which custom config would you like to load?',
      type: 'list',
      choices: customChoices,
      when: (answers) => {
        return answers.location === 'custom';
      },
    },
    {
      name: 'includedFile',
      message: 'Which config would you like to load?',
      type: 'list',
      choices: includedChoices,
      when: (answers) => {
        return answers.location === 'included';
      },
    },
  ];
}

export function mockConfigGeneratorQuestions(
  mockEnclosureChoices: string[],
  dispersalChoices: string[],
  models: CommandOptions,
): QuestionCollection {
  const controllerChoices: string[] = Object.keys(models.controllers);
  const shelfChoices: string[] = Object.keys(models.shelves);
  const loadAfterSaveChoices: string[] = ['Yes', 'No'];
  const mockDiskChoices: string[] = ['Yes', 'Skip'];
  const diskSizeChoices: string[] = ['2', '4', '6', '8', '12', '16', '18', '20'];
  const mockPoolChoices: string[] = ['Create Pool', 'Skip'];
  const mockPoolLayoutChoices: string[] = ['Stripe', 'Mirror','Raidz1','Raidz2','Raidz3'];
  const mockPoolScenarioChoices: string[] = [
    'Uniform',
    'MixedDiskCapacity',
    'MixedVdevCapacity',
    'MixedVdevLayout',
    'MixedVdevWidth',
    'NoRedundancy',
  ];
  const saveChoices: string[] = ['Save', 'Cancel'];

  return [
    // Pass your questions in here
    {
      name: 'fileName',
      message: 'Give your config file a name:',
      type: 'input',
    },
    {
      name: 'mockEnclosure',
      message: 'Mock Enclosures?',
      type: 'list',
      choices: mockEnclosureChoices,
      default: 'Skip',
    },
    {
      name: 'controller',
      message: 'Choose a controller:',
      type: 'list',
      choices: controllerChoices,
      default: 'M40',
      when: ( answers ) => {
        return answers.mockEnclosure === mockEnclosureChoices[0];
      },
    },
    {
      name: 'shelves',
      message: 'Specify shelves (' + shelfChoices.toString() + '):',
      type: 'input',
      default: '',
      when: ( answers ) => {
        return answers.mockEnclosure === mockEnclosureChoices[0];
      },
    },
    {
      name: 'dispersal',
      message: 'Choose a slot assignment method (Default or Existing)',
      type: 'list',
      choices: dispersalChoices,
      default: 'Default',
      when: ( answers ) => {
        return answers.mockEnclosure === mockEnclosureChoices[0];
      },
    },
    {
      name: 'mockDisk',
      message: 'Mock unassigned disks?',
      type: 'list',
      choices: mockDiskChoices,
      default: 'Skip',
    },
    {
      name: 'diskSize',
      message: 'Select HDD capacity in TB',
      type: 'list',
      choices: diskSizeChoices,
      default: '4',
      when: ( answers ) => {
        return answers.mockDisk === 'Yes';
      },
    },
    {
      name: 'repeats',
      message: 'How many devices?',
      type: 'input',
      default: '12',
      when: ( answers ) => {
        return answers.mockDisk === 'Yes';
      },
    },
    {
      name: 'mockPool',
      message: 'Create a mock pool?',
      type: 'list',
      choices: mockPoolChoices,
      default: 'Skip',
    },
    {
      name: 'vdevDiskSize',
      message: 'Choose a minimum disk size for vdev members?',
      type: 'list',
      choices: diskSizeChoices,
      default: '2',
      when: ( answers ) => {
        return answers.mockPool === 'Create Pool';
      },
    },
    {
      name: 'vdevScenario',
      message: 'Choose a storage scenario',
      type: 'list',
      choices: mockPoolScenarioChoices,
      default: 'Uniform',
      when: ( answers ) => {
        return answers.mockPool === 'Create Pool';
      },
    },
    {
      name: 'vdevLayout',
      message: 'Choose a VDEV layout?',
      type: 'list',
      choices: mockPoolLayoutChoices,
      default: 'Mirror',
      when: ( answers ) => {
        return answers.mockPool === 'Create Pool';
      },
    },
    {
      name: 'vdevWidth',
      message: 'Choose a vdev width',
      type: 'input',
      default: '2',
      when: ( answers ) => {
        return answers.mockPool === 'Create Pool';
      },
    },
    {
      name: 'vdevRepeats',
      message: 'How many VDEVs?',
      type: 'input',
      default: '2',
      when: ( answers ) => {
        return answers.mockPool === 'Create Pool';
      },
    },
    {
      name: 'loadAfterSave',
      message: 'Should we load the config after saving?',
      type: 'list',
      choices: loadAfterSaveChoices,
      default: 'Yes',
    },
    {
      name: 'saveOrCancel',
      message: 'Are you ready to save this configuration?',
      type: 'list',
      choices: saveChoices,
      default: 'save',
    },
  ]
}
