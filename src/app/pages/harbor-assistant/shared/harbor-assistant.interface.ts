export type HarborAssistantSearchResultFilter = 'all' | 'images' | 'text' | 'videos';
export type HarborAssistantSearchSourceScope = 'dvr_library' | 'nas_files' | 'all';
export type HarborAssistantRetrievalMode = 'auto' | 'on' | 'off';

export interface HarborAssistantSearchRequest {
  query: string;
  conversation_id?: string;
  limit?: number;
  include_documents: boolean;
  include_images: boolean;
  include_videos: boolean;
  use_retrieval?: boolean;
  retrieval_mode?: HarborAssistantRetrievalMode;
  source_scope?: HarborAssistantSearchSourceScope;
  source_root_ids?: string[];
  camera_id?: string | null;
  from?: string | null;
  to?: string | null;
}

export interface HarborAssistantRetrievalSettings {
  query_expansion_enabled: boolean;
  fusion_strategy: string;
  rrf_k: number;
  lexical_weight: number;
  vector_weight: number;
  candidate_limit: number;
  lexical_min_score: number;
  vector_min_score: number;
  semantic_only_min_score: number;
  rerank_enabled: boolean;
  rerank_top_k: number;
  rerank_min_score: number;
  mmr_enabled: boolean;
  mmr_lambda: number;
}

export interface HarborAssistantSearchHit {
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

export interface HarborAssistantSearchReplyPack {
  summary: string;
  citations: unknown[];
}

export interface HarborAssistantSearchResponse {
  conversation_id?: string;
  query: string;
  roots: string[];
  total_matches: number;
  documents: HarborAssistantSearchHit[];
  images: HarborAssistantSearchHit[];
  videos: HarborAssistantSearchHit[];
  reply_pack: HarborAssistantSearchReplyPack;
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
  answer?: string | null;
  answer_degraded?: boolean;
  answer_degraded_reason?: string | null;
  answer_intent?: string | null;
}

export interface HarborAssistantQueryUnderstanding {
  intent: string;
  needs_retrieval: boolean;
  target_modalities?: ('document' | 'image' | 'video')[];
  retrieval_strategy?: 'semantic' | 'recent';
}

export interface HarborAssistantKnowledgeAnswerResponse {
  conversation_id?: string;
  status: string;
  degraded: boolean;
  degraded_reason?: string | null;
  query: string;
  answer: string;
  citations: unknown[];
  search: HarborAssistantSearchResponse;
  warnings: string[];
  query_understanding?: HarborAssistantQueryUnderstanding | null;
}

export interface HarborAssistantConversationSettings {
  history_limit: number;
  context_turn_limit: number;
}

export interface HarborAssistantConversationSummary {
  conversation_id: string;
  title: string;
  updated_at?: string | null;
  turn_count: number;
}

export interface HarborAssistantConversationTurn {
  task_id: string;
  query: string;
  answer: string;
  created_at?: string | null;
  response: HarborAssistantKnowledgeAnswerResponse;
}

export interface HarborAssistantConversationDetail {
  conversation_id: string;
  turns: HarborAssistantConversationTurn[];
}

export interface HarborAssistantConversationListResponse {
  conversations: HarborAssistantConversationSummary[];
  settings?: HarborAssistantConversationSettings | null;
}

export interface HarborAssistantSearchWaterfallItem {
  kind: 'image' | 'document' | 'video';
  hit: HarborAssistantSearchHit;
  previewUrl: string;
}

export interface HarborAssistantSearchCameraDevice {
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

export interface HarborAssistantSearchCameraStateResponse {
  defaults?: {
    selected_camera_device_id?: string | null;
  };
  devices: HarborAssistantSearchCameraDevice[];
}

export interface HarborAssistantSearchDvrRecordingStatus {
  device_id: string;
  status: string;
  started_at?: string | null;
  updated_at?: string | null;
  stream_kind?: string;
  last_segment_path?: string | null;
  live_mjpeg_url?: string | null;
  message?: string;
}

export interface HarborAssistantSearchDvrStatusResponse {
  generated_at: string;
  statuses: HarborAssistantSearchDvrRecordingStatus[];
}

export interface HarborAssistantCameraLiveSessionResponse {
  device_id: string;
  session_id?: string | null;
  status: 'starting' | 'running' | 'stopped' | 'failed' | 'degraded' | string;
  playlist_url?: string | null;
  playlist_ready: boolean;
  mode: string;
  codec: string;
  started_at?: string | null;
  updated_at: string;
  message?: string | null;
}

export interface HarborAssistantSearchDvrTimelineSegment {
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

export interface HarborAssistantSearchDvrTimelineResponse {
  generated_at: string;
  recording_root: string;
  media_library_root?: string;
  segments: HarborAssistantSearchDvrTimelineSegment[];
}

export interface HarborAssistantSearchSnapshotTaskResponse {
  media_item?: HarborAssistantSearchDvrTimelineSegment | null;
}
