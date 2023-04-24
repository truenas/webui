/* eslint-disable no-restricted-imports */
import { EnclosureDispersalStrategy } from "../../src/app/core/testing/enums/mock-storage.enum";
import { WebUiEnvironment } from "environments/environment.interface";

export const environment: WebUiEnvironment = {
  remote: '10.10.20.9',
  port: 4200,
  production: false,
  sentryPublicDsn: 'https://7ac3e76fe2a94f77a58e1c38ea6b42d9@sentry.ixsystems.com/4',
  mockConfig: {
    enabled: true,
    enclosureOptions: {
        controllerModel: 'M50',
        expansionModels: [
            'ES24'
        ],
        dispersal: EnclosureDispersalStrategy.Default
    },
    systemProduct: 'TRUENAS-M50'
},
}
