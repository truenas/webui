import { enableProdMode } from '@angular/core';
import { sentryPublicDsn } from 'environments/sentry-public-dns.const';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { WebUiEnvironment, environmentVersion, remote } from './environment.interface';

export const environment: WebUiEnvironment = {
  environmentVersion,
  remote,
  buildYear: 2025,
  production: true,
  sentryPublicDsn,
  mockConfig: {
    enabled: false,
    controllerModel: EnclosureModel.M40,
    expansionModels: [],
    scenario: MockEnclosureScenario.FillSomeSlots,
  },
};

// Production
enableProdMode();
