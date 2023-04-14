/* eslint-disable no-restricted-imports */
import { EnclosureDispersalStrategy } from '../app/core/testing/enums/mock-storage.enum';
import { WebUiEnvironment } from './environment.interface';

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
  },
};
