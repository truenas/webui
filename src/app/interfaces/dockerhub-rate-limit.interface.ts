export interface DockerHubRateLimit {
  total_pull_limit: number | null;
  total_time_limit_in_secs: number | null;
  remaining_pull_limit: number | null;
  remaining_time_limit_in_secs: number | null;
  error: string | null;
}
