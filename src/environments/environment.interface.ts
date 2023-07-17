/* eslint-disable no-restricted-imports */
import { MockEnclosureConfig } from '../app/core/testing/interfaces/mock-enclosure-utils.interface';

export interface WebUiEnvironment {
  environmentVersion: string;
  remote: string;
  port?: number;
  production: boolean;
  sentryPublicDsn: string;
  mockConfig?: MockEnclosureConfig;
}
