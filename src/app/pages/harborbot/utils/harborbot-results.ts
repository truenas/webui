import {
  HarborBotResultFilter,
  HarborBotSearchHit,
  HarborBotSearchRequest,
  HarborBotSearchResponse,
  HarborBotWaterfallItem,
} from 'app/pages/harborbot/interfaces/harborbot.interface';

const DEFAULT_LIMIT = 24;

export function buildHarborBotSearchPayload(
  query: string,
  filter: HarborBotResultFilter,
  limit = DEFAULT_LIMIT,
): HarborBotSearchRequest {
  return {
    query: query.trim(),
    limit,
    include_documents: filter === 'all' || filter === 'text',
    include_images: filter === 'all' || filter === 'images',
    include_videos: filter === 'all' || filter === 'videos',
  };
}

export function harborBotPreviewUrl(path: string): string {
  return `/api/harbordesk/knowledge/preview?path=${encodeURIComponent(path)}`;
}

export function buildHarborBotWaterfallItems(
  response: HarborBotSearchResponse | null,
  filter: HarborBotResultFilter,
): HarborBotWaterfallItem[] {
  if (!response) {
    return [];
  }

  const images = filter === 'all' || filter === 'images'
    ? response.images.map((hit) => toWaterfallItem('image', hit))
    : [];
  const documents = filter === 'all' || filter === 'text'
    ? response.documents.map((hit) => toWaterfallItem('document', hit))
    : [];
  const videos = filter === 'all' || filter === 'videos'
    ? response.videos.map((hit) => toWaterfallItem('video', hit))
    : [];

  return [...images, ...documents, ...videos].sort((left, right) => {
    return right.hit.score - left.hit.score || left.hit.title.localeCompare(right.hit.title);
  });
}

export function harborBotHasNoResults(response: HarborBotSearchResponse | null): boolean {
  return Boolean(
    response
    && response.images.length === 0
    && response.documents.length === 0
    && response.videos.length === 0,
  );
}

export function harborBotErrorMessage(error: unknown): string {
  const fallback = 'HarborBot search failed.';
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

function toWaterfallItem(kind: 'image' | 'document' | 'video', hit: HarborBotSearchHit): HarborBotWaterfallItem {
  return {
    kind,
    hit,
    previewUrl: harborBotPreviewUrl(hit.path),
  };
}
