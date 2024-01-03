export interface DockerHubRateLimit {
  total_pull_limit: number;
  total_time_limit_in_secs: number;
  remaining_pull_limit: number;
  remaining_time_limit_in_secs: number;
  error?: string | null;
}
