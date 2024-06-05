import {
  MockEnclosureConfig,
} from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';

export interface WebUiEnvironment {
  environmentVersion: string;
  remote: string;
  port?: number;
  production: boolean;
  sentryPublicDsn: string;
  mockConfig?: MockEnclosureConfig;
}
