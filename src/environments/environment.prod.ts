import { enableProdMode } from '@angular/core';
import { MockStorageScenario } from 'app/core/testing/mock-enclosure/enums/mock-storage.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import {
  WebUiEnvironment, environmentVersion, remote, sentryPublicDsn,
} from './environment.interface';

export const environment: WebUiEnvironment = {
  environmentVersion,
  remote,
  buildYear: 2024,
  production: true,
  sentryPublicDsn,
  mockConfig: {
    enabled: false,
    controllerModel: EnclosureModel.M40,
    expansionModels: [],
    scenario: MockStorageScenario.FillSomeSlots,
  },
};

// Production
enableProdMode();
