export interface UpgradeSummary {
  changelog: string;
  available_versions_for_upgrade: {
    version: string;
    human_version: string;
  }[];
  container_images_to_update: {
    [key: string]: {
      id: string;
      update_available: boolean;
    };
  };
  item_update_available: boolean;
  image_update_available: boolean;
  latest_version: string;
  upgrade_version: string;
  latest_human_version: string;
  upgrade_human_version: string;
}

export enum ApplicationUserEventName {
  SwitchTab = 'SwitchTab',
  UpdateToolbar = 'UpdateToolbar',
  CatalogToolbarChanged = 'catalogToolbarChanged',
}

export interface ApplicationUserEvent {
  name: ApplicationUserEventName;
  value?: boolean | /* tab index */ number;
  catalogNames?: string[];
  isSelectedAll?: boolean;
}
