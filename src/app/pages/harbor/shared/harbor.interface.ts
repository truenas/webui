export type HarborBotResultFilter = 'all' | 'images' | 'text' | 'videos';
export type HarborBotSourceScope = 'dvr_library' | 'nas_files' | 'all';

export interface HarborBotSearchRequest {
  query: string;
  limit?: number;
  include_documents: boolean;
  include_images: boolean;
  include_videos: boolean;
  source_scope?: HarborBotSourceScope;
  camera_id?: string | null;
  from?: string | null;
  to?: string | null;
}

export interface HarborBotSearchHit {
  modality: string;
  path: string;
  title: string;
  score: number;
  lexical_score?: number | null;
  embedding_score?: number | null;
  hybrid_score?: number | null;
  chunk_id?: string | null;
  line_start?: number | null;
  line_end?: number | null;
  snippet?: string | null;
  matched_terms?: string[];
  provenance?: string | null;
  source_path?: string | null;
  content_source_kinds?: string[];
  content_indexed?: boolean;
  filename_match_used?: boolean;
  content_match_used?: boolean;
}

export interface HarborBotReplyPack {
  summary: string;
  citations: unknown[];
}

export interface HarborBotSearchResponse {
  query: string;
  roots: string[];
  total_matches: number;
  documents: HarborBotSearchHit[];
  images: HarborBotSearchHit[];
  videos: HarborBotSearchHit[];
  reply_pack: HarborBotReplyPack;
  supported_modalities: string[];
  pending_modalities: string[];
  status: string;
  degraded: boolean;
  degraded_reason?: string | null;
  blockers: string[];
  warnings: string[];
  source_scope: string[];
  privacy_level: string;
  resource_profile: string;
  empty_reason?: string | null;
  empty_guidance?: string | null;
}

export interface HarborBotWaterfallItem {
  kind: 'image' | 'document' | 'video';
  hit: HarborBotSearchHit;
  previewUrl: string;
}

export interface HarborBotCameraDevice {
  device_id: string;
  name: string;
  room?: string | null;
  ip_address?: string | null;
  snapshot_url?: string | null;
  capabilities?: {
    snapshot?: boolean;
    stream?: boolean;
    ptz?: boolean;
    audio?: boolean;
  } | null;
}

export interface HarborBotCameraStateResponse {
  defaults?: {
    selected_camera_device_id?: string | null;
  };
  devices: HarborBotCameraDevice[];
}

export interface HarborBotDvrRecordingStatus {
  device_id: string;
  status: string;
  started_at?: string | null;
  updated_at?: string | null;
  stream_kind?: string;
  last_segment_path?: string | null;
  live_mjpeg_url?: string | null;
  message?: string;
}

export interface HarborBotDvrStatusResponse {
  generated_at: string;
  statuses: HarborBotDvrRecordingStatus[];
}

export interface HarborBotDvrTimelineSegment {
  device_id: string;
  file_path: string;
  sidecar_path?: string | null;
  media_kind?: 'snapshot' | 'recording' | string;
  stream_kind: string;
  started_at: string;
  created_at?: string;
  ended_at: string;
  duration_seconds: number;
  duration_actual_seconds?: number | null;
  retention_expires_at: string;
  size_bytes: number;
  replay_url?: string | null;
  thumbnail_url?: string | null;
  playable?: boolean;
  indexed: boolean;
}

export interface HarborBotDvrTimelineResponse {
  generated_at: string;
  recording_root: string;
  media_library_root?: string;
  segments: HarborBotDvrTimelineSegment[];
}

export interface HarborBotSnapshotTaskResponse {
  media_item?: HarborBotDvrTimelineSegment | null;
}
