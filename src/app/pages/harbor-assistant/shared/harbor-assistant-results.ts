import {
  HarborAssistantSearchResultFilter,
  HarborAssistantSearchHit,
  HarborAssistantRetrievalMode,
  HarborAssistantSearchRequest,
  HarborAssistantSearchResponse,
  HarborAssistantSearchSourceScope,
  HarborAssistantSearchWaterfallItem,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';
import { harborAssistantBeaconApiUrl } from 'app/pages/harbor-assistant/services/harbor-assistant-api-prefix';

export interface HarborAssistantSearchScope {
  cameraId?: string | null;
  from?: string | null;
  sourceScope?: HarborAssistantSearchSourceScope;
  sourceRootIds?: string[];
  to?: string | null;
  retrievalMode?: HarborAssistantRetrievalMode;
  useRetrieval?: boolean;
}

export function buildHarborAssistantSearchPayload(
  query: string,
  filter: HarborAssistantSearchResultFilter,
  limit: number | null = null,
  scope: HarborAssistantSearchScope = {},
): HarborAssistantSearchRequest {
  const payload: HarborAssistantSearchRequest = {
    query: query.trim(),
    include_documents: filter === 'all' || filter === 'text',
    include_audio: filter === 'all' || filter === 'audio',
    include_images: filter === 'all' || filter === 'images',
    include_videos: filter === 'all' || filter === 'videos',
    retrieval_mode: scope.retrievalMode ?? (scope.useRetrieval === false ? 'off' : 'auto'),
    source_scope: scope.sourceScope ?? 'dvr_library',
    source_root_ids: scope.sourceRootIds ?? [],
  };
  if (limit !== null) {
    payload.limit = Math.min(50, Math.max(1, Math.round(limit)));
  }
  if (filter === 'videos' || filter === 'all') {
    payload.camera_id = scope.cameraId || null;
    payload.from = scope.from || null;
    payload.to = scope.to || null;
  }
  return payload;
}

export function harborAssistantPreviewUrl(path: string): string {
  return harborAssistantBeaconApiUrl(`/knowledge/preview?path=${encodeURIComponent(path)}`);
}

export function harborAssistantSearchSameOriginAdminUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) {
    return null;
  }
  try {
    const parsed = new URL(url, 'http://harbor.local');
    const path = `${parsed.pathname}${parsed.search}`;
    if (path.startsWith('/api/beacon/')) {
      return path;
    }
    if (path.startsWith('/api/harbor-beacon/')) {
      return harborAssistantBeaconApiUrl(path.slice('/api/harbor-beacon'.length));
    }
    if (path.startsWith('/api/')) {
      return harborAssistantBeaconApiUrl(path.slice(4));
    }
    return path.startsWith('/') ? path : null;
  } catch {
    return url.startsWith('/') ? url : null;
  }
}

export function buildHarborAssistantSearchWaterfallItems(
  response: HarborAssistantSearchResponse | null,
  filter: HarborAssistantSearchResultFilter,
): HarborAssistantSearchWaterfallItem[] {
  if (!response) {
    return [];
  }

  const images = filter === 'all' || filter === 'images'
    ? response.images.map((hit) => toWaterfallItem('image', hit))
    : [];
  const documents = filter === 'all' || filter === 'text'
    ? response.documents
        .filter((hit) => hit.modality !== 'audio')
        .map((hit) => toWaterfallItem('document', hit))
    : [];
  const audio = filter === 'all' || filter === 'audio'
    ? response.documents
        .filter((hit) => hit.modality === 'audio')
        .map((hit) => toWaterfallItem('audio', hit))
    : [];
  const videos = filter === 'all' || filter === 'videos'
    ? response.videos.map((hit) => toWaterfallItem('video', hit))
    : [];

  return [...images, ...audio, ...documents, ...videos].sort((left, right) => {
    return right.hit.score - left.hit.score || left.hit.title.localeCompare(right.hit.title);
  });
}

export function harborAssistantSearchHasNoResults(response: HarborAssistantSearchResponse | null): boolean {
  return Boolean(
    response
    && response.images.length === 0
    && response.documents.length === 0
    && response.videos.length === 0,
  );
}

export function harborAssistantSearchErrorMessage(error: unknown): string {
  const fallback = 'Search failed.';
  if (!error || typeof error !== 'object') {
    return fallback;
  }
  const maybe = error as { error?: { error?: unknown; message?: unknown }; message?: unknown };
  const nested = maybe.error?.error ?? maybe.error?.message;
  if (typeof nested === 'string' && nested.trim()) {
    return nested;
  }
  if (typeof maybe.message === 'string' && maybe.message.trim()) {
    return maybe.message;
  }
  return fallback;
}

function toWaterfallItem(
  kind: 'audio' | 'image' | 'document' | 'video',
  hit: HarborAssistantSearchHit,
): HarborAssistantSearchWaterfallItem {
  return {
    kind,
    hit,
    previewUrl: harborAssistantPreviewUrl(hit.path),
  };
}
