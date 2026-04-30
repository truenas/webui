export type HarborBotResultFilter = 'all' | 'images' | 'text' | 'videos';

export interface HarborBotSearchRequest {
  query: string;
  limit?: number;
  include_documents: boolean;
  include_images: boolean;
  include_videos: boolean;
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
