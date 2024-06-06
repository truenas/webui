import { MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';

export interface MockEnclosureConfig {
  enabled: boolean;
  controllerModel: string;
  expansionModels: string[];
  scenario: MockStorageScenario;
}
