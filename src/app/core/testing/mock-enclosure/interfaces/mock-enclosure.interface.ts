import { MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export interface MockEnclosureConfig {
  enabled: boolean;
  controllerModel: EnclosureModel;
  expansionModels: EnclosureModel[];
  scenario: MockStorageScenario;
}
