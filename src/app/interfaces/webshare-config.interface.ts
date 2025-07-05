export interface WebShareConfig {
  id: number;
  truenas_host: string;
  log_level: 'debug' | 'info' | 'warn' | 'error';
  pam_service_name: string;
  allowed_groups: string[];
  session_log_retention: number;
  enable_web_terminal: boolean;
  bulk_download_pool: string | null;
  search_index_pool: string | null;
  altroots: Record<string, string>;
  altroots_metadata: Record<string, { search_indexed: boolean }>;
  search_enabled: boolean;
  search_directories: string[];
  search_max_file_size: number;
  search_supported_types: ('image' | 'audio' | 'video' | 'document' | 'archive' | 'text' | 'disk_image')[];
  search_worker_count: number;
  search_archive_enabled: boolean;
  search_archive_max_depth: number;
  search_archive_max_size: number;
  search_index_max_size: number;
  search_index_cleanup_enabled: boolean;
  search_index_cleanup_threshold: number;
  search_pruning_enabled: boolean;
  search_pruning_schedule: 'hourly' | 'daily' | 'weekly';
  search_pruning_start_time: string;
}

export type WebShareConfigUpdate = Partial<Omit<WebShareConfig, 'id'>>;
