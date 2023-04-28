import {EnclosureDispersalStrategy, MockStorageScenario} from '../../src/app/core/testing/enums/mock-storage.enum';
import { WebUiEnvironment } from 'environments/environment.interface';
import {TopologyItemType} from "../../src/app/enums/v-dev-type.enum";

export const environmentTemplate: WebUiEnvironment = {
  remote: '$SERVER$',
  port: 4200,
  production: false,
  sentryPublicDsn: 'https://7ac3e76fe2a94f77a58e1c38ea6b42d9@sentry.ixsystems.com/4',
  mockConfig: {
    enabled: false,
    enclosureOptions: {
      controllerModel: 'M40',
      expansionModels: [],
      dispersal: EnclosureDispersalStrategy.Default,
    },
    systemProduct: 'TRUENAS-M40',
    diskOptions: {
      enabled: false,
      topologyOptions: {
        scenario: MockStorageScenario.Uniform,
        layout: TopologyItemType.Mirror,
        diskSize: 12,
        width: 2,
        repeats: 1,
      },
      mockPools: false,
    }
  },
};
