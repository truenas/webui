import { enableProdMode } from '@angular/core';
import { MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { WebUiEnvironment } from './environment.interface';

// Sentry Error handling for production mode
export const environment: WebUiEnvironment = {
  environmentVersion: '0.0.3',
  remote: document.location.host,
  production: true,
  sentryPublicDsn: 'https://7ac3e76fe2a94f77a58e1c38ea6b42d9@sentry.ixsystems.com/4',
  mockConfig: {
    enabled: false,
    controllerModel: 'M40',
    expansionModels: [],
    scenario: MockStorageScenario.FillSomeSlots,
  },
};

// Production
enableProdMode();
