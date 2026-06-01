import {
  HarborAssistantSearchResponse,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';
import {
  buildHarborAssistantSearchPayload,
  buildHarborAssistantSearchWaterfallItems,
  harborAssistantSearchErrorMessage,
  harborAssistantSearchHasNoResults,
  harborAssistantPreviewUrl,
  harborAssistantSearchSameOriginAdminUrl,
} from 'app/pages/harbor-assistant/shared/harbor-assistant-results';

describe('Harbor Assistant search result helpers', () => {
  it('builds modality-aware search payloads', () => {
    expect(buildHarborAssistantSearchPayload(' 春天照片 ', 'all')).toEqual({
      query: '春天照片',
      limit: 24,
      include_documents: true,
      include_images: true,
      include_videos: true,
      source_scope: 'dvr_library',
      camera_id: null,
      from: null,
      to: null,
    });
    expect(buildHarborAssistantSearchPayload('spring', 'images', 12)).toEqual({
      query: 'spring',
      limit: 12,
      include_documents: false,
      include_images: true,
      include_videos: false,
      source_scope: 'dvr_library',
    });
    expect(buildHarborAssistantSearchPayload('report', 'text')).toEqual({
      query: 'report',
      limit: 24,
      include_documents: true,
      include_images: false,
      include_videos: false,
      source_scope: 'dvr_library',
    });
    expect(buildHarborAssistantSearchPayload('clip', 'videos')).toEqual({
      query: 'clip',
      limit: 24,
      include_documents: false,
      include_images: false,
      include_videos: true,
      source_scope: 'dvr_library',
      camera_id: null,
      from: null,
      to: null,
    });
    expect(buildHarborAssistantSearchPayload('pouring drink', 'videos', 12, {
      cameraId: 'camera-main',
      from: '1714600000',
      to: '1714600300',
    })).toEqual({
      query: 'pouring drink',
      limit: 12,
      include_documents: false,
      include_images: false,
      include_videos: true,
      source_scope: 'dvr_library',
      camera_id: 'camera-main',
      from: '1714600000',
      to: '1714600300',
    });
    expect(buildHarborAssistantSearchPayload('nas docs', 'all', 6, { sourceScope: 'nas_files' })).toEqual({
      query: 'nas docs',
      limit: 6,
      include_documents: true,
      include_images: true,
      include_videos: true,
      source_scope: 'nas_files',
      camera_id: null,
      from: null,
      to: null,
    });
  });

  it('encodes same-origin preview URLs', () => {
    const url = harborAssistantPreviewUrl('/mnt/software/photos/春天 01.jpg');

    expect(url).toBe('/api/harbor-beacon/knowledge/preview?path=%2Fmnt%2Fsoftware%2Fphotos%2F%E6%98%A5%E5%A4%A9%2001.jpg');
    expect(url).not.toContain(':4174');
    expect(url).not.toContain(':8787');
    expect(harborAssistantSearchSameOriginAdminUrl('http://192.168.3.21:4174/api/knowledge/preview?path=/recordings/a.mp4'))
      .toBe('/api/harbor-beacon/knowledge/preview?path=/recordings/a.mp4');
    expect(harborAssistantSearchSameOriginAdminUrl('/api/cameras/camera-main/snapshot.jpg'))
      .toBe('/api/harbor-beacon/cameras/camera-main/snapshot.jpg');
    expect(harborAssistantSearchSameOriginAdminUrl('http://127.0.0.1/ui/assets/harbor-fixtures/public-fixture-dvr.jpg'))
      .toBe('/ui/assets/harbor-fixtures/public-fixture-dvr.jpg');
  });

  it('classifies and sorts waterfall items across image, text, and video hits', () => {
    const response = searchResponse({
      images: [
        { modality: 'image', path: '/mnt/photo-a.jpg', title: 'Photo A', score: 42 },
      ],
      documents: [
        { modality: 'document', path: '/mnt/note.md', title: 'Note', score: 77 },
      ],
      videos: [
        { modality: 'video', path: '/mnt/clip.mp4', title: 'Clip', score: 55 },
      ],
    });

    const items = buildHarborAssistantSearchWaterfallItems(response, 'all');

    expect(items.map((item) => item.kind)).toEqual(['document', 'video', 'image']);
    expect(items[0].previewUrl).toBe('/api/harbor-beacon/knowledge/preview?path=%2Fmnt%2Fnote.md');
    expect(buildHarborAssistantSearchWaterfallItems(response, 'images').map((item) => item.kind)).toEqual(['image']);
    expect(buildHarborAssistantSearchWaterfallItems(response, 'text').map((item) => item.kind)).toEqual(['document']);
    expect(buildHarborAssistantSearchWaterfallItems(response, 'videos').map((item) => item.kind)).toEqual(['video']);
  });

  it('detects empty result and extracts error state messages', () => {
    expect(harborAssistantSearchHasNoResults(searchResponse())).toBe(true);
    expect(harborAssistantSearchHasNoResults(null)).toBe(false);
    expect(harborAssistantSearchErrorMessage({ error: { error: 'blocked by preview guard' } })).toBe('blocked by preview guard');
    expect(harborAssistantSearchErrorMessage({ message: 'network failed' })).toBe('network failed');
    expect(harborAssistantSearchErrorMessage(null)).toBe('Search failed.');
  });
});

function searchResponse(
  partial: Partial<Pick<HarborAssistantSearchResponse, 'images' | 'documents' | 'videos'>> = {},
): HarborAssistantSearchResponse {
  return {
    query: 'spring',
    roots: [],
    total_matches: 0,
    documents: partial.documents ?? [],
    images: partial.images ?? [],
    videos: partial.videos ?? [],
    reply_pack: { summary: '', citations: [] },
    supported_modalities: ['document', 'image', 'video'],
    pending_modalities: [],
    status: 'ok',
    degraded: false,
    blockers: [],
    warnings: [],
    source_scope: [],
    privacy_level: 'strict_local',
    resource_profile: 'cpu_only',
  };
}
