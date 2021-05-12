export interface Catalog {
  branch: string;
  builtin: boolean;
  healthy: boolean;
  id: string;
  label: string;

  /**
   * E.g. "/mnt/pool/ix-applications/catalogs/github_com_truenas_charts_git_master"
   */
  location: string;
  preferred_trains: string[];

  /**
   * E.g. https://github.com/truenas/charts.git
   */
  repository: string;
  trains: {
    [trainName: string]: CatalogTrain;
  };
}

export interface CatalogTrain {
  [application: string]: CatalogItem;
}

export interface CatalogItem {
  app_readme: string;
  categories: string[];
  healthy: boolean;
  healthy_error: string;
  icon_url: string;
  location: string;
  name: string;
  versions: { [version: string]: CatalogItemVersion };
}

export interface CatalogItemVersion {
  app_readme: string;
  changelog: string;
  chart_metadata: ChartMetadata;
  detailed_readme: string;
  healthy: boolean;
  healthy_error: string;
  human_version: string;
  location: string;
  required_features: string[];
  schema: any;
  supported: boolean;
  values: any;
  version: string;
}

export interface ChartMetadata {
  apiVersion: string;
  appVersion: string;
  dependencies: ChartMetadataDependency[];
  description: string;
  home: string;
  icon: string;
  keywords: string[];
  name: string;
  sources: string[];
  version: string;
}

export interface ChartMetadataDependency {
  name: string;
  repository: string;
  version: string;
}
