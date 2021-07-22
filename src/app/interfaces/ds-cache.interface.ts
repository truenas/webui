export interface DsUncachedUser {
  pw_dir: string;
  pw_gecos: string;
  pw_gid: number;
  pw_name: string;
  pw_shell: string;
  pw_uid: number;
}

export interface DsUncachedGroup {
  gr_gid: number;
  gr_mem: unknown[];
  gr_name: string;
}
