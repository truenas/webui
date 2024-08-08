export interface AppUpgradeSummary {
  latest_version: string;
  latest_human_version: string;
  upgrade_version: string;
  upgrade_human_version: string;
  changelog: string;
  available_versions_for_upgrade: {
    version: string;
    human_version: string;
  }[];
}
