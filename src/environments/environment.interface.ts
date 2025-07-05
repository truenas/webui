import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';

export interface WebUiEnvironment {
  environmentVersion: string;
  remote: string;
  buildYear: number;
  port?: number;
  production: boolean;
  sentryPublicDsn: string;
  debugPanel?: {
    enabled: boolean;
    defaultMessageLimit: number;
    mockJobDefaultDelay: number;
    persistMockConfigs: boolean;
  };
  mockConfig?: {
    enabled: boolean;
    controllerModel: EnclosureModel;
    expansionModels: EnclosureModel[];
    scenario: MockEnclosureScenario;
  };
}

export const environmentVersion = '0.0.3';

export const remote = document.location.host;
