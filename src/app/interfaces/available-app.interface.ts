import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { AppMetadata } from 'app/interfaces/chart-release.interface';

export interface AvailableApp {
  healthy: boolean;
  installed: boolean;
  categories: string[];
  name: string;
  title: string;
  description: string;
  app_readme: string;
  app_metadata: AppMetadata;
  location: string;
  healthy_error: string;
  latest_version: string;
  latest_app_version: string;
  icon_url: string;
  train: string;
  catalog: string;
  last_update: ApiTimestamp;
  recommended: boolean;
  maintainers: AppMaintainer[];
  tags: string[];
}

export interface AppMaintainer {
  email: string;
  name: string;
  url: string;
}
