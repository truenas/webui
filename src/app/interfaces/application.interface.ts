export interface UpgradeSummary {
  latest_human_version: string;
  changelog: string;
  container_images_to_update: {
    [key: string]: {
      id: string;
      update_available: boolean;
    };
  };
}
