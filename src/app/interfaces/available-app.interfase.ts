export interface AvailableApp {
  healthy: boolean;
  installed: boolean;
  categories: string[];
  name: string;
  title: string;
  description: string;
  app_readme: string;
  location: string;
  healthy_error: string;
  latest_version: string;
  latest_app_version: string;
  icon_url: string;
  train: string;
  catalog: string;
  last_update: {
    $date: number;
  };
  recommended: boolean;
}
