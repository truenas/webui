import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export interface MockEnclosureConfig {
  enabled: boolean;
  controllerModel: EnclosureModel | null;
  expansionModels: EnclosureModel[];
  scenario: MockEnclosureScenario;
}
