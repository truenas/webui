import {
  MockEnclosureConfig,
} from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';

export interface WebUiEnvironment {
  environmentVersion: string;
  remote: string;
  buildYear: number;
  port?: number;
  production: boolean;
  sentryPublicDsn: string;
  mockConfig: MockEnclosureConfig;
}

export const environmentVersion = '0.0.3';

export const sentryPublicDsn = 'https://7ac3e76fe2a94f77a58e1c38ea6b42d9@sentry.ixsystems.com/4';

export const remote = document.location.host;
