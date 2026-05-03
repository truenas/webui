import {
  HarborBotSearchResponse,
} from 'app/pages/harborbot/interfaces/harborbot.interface';
import {
  buildHarborBotSearchPayload,
  buildHarborBotWaterfallItems,
  harborBotErrorMessage,
  harborBotHasNoResults,
  harborBotPreviewUrl,
  harborBotSameOriginAdminUrl,
} from 'app/pages/harborbot/utils/harborbot-results';

describe('HarborBot result helpers', () => {
  it('builds modality-aware search payloads', () => {
    expect(buildHarborBotSearchPayload(' 春天照片 ', 'all')).toEqual({
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
    expect(buildHarborBotSearchPayload('spring', 'images', 12)).toEqual({
      query: 'spring',
      limit: 12,
      include_documents: false,
      include_images: true,
      include_videos: false,
      source_scope: 'dvr_library',
    });
    expect(buildHarborBotSearchPayload('report', 'text')).toEqual({
      query: 'report',
      limit: 24,
      include_documents: true,
      include_images: false,
      include_videos: false,
      source_scope: 'dvr_library',
    });
    expect(buildHarborBotSearchPayload('clip', 'videos')).toEqual({
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
    expect(buildHarborBotSearchPayload('pouring drink', 'videos', 12, {
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
    expect(buildHarborBotSearchPayload('nas docs', 'all', 6, { sourceScope: 'nas_files' })).toEqual({
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
    const url = harborBotPreviewUrl('/mnt/software/photos/春天 01.jpg');

    expect(url).toBe('/api/harbordesk/knowledge/preview?path=%2Fmnt%2Fsoftware%2Fphotos%2F%E6%98%A5%E5%A4%A9%2001.jpg');
    expect(url).not.toContain(':4174');
    expect(url).not.toContain(':8787');
    expect(harborBotSameOriginAdminUrl('http://192.168.3.82:4174/api/knowledge/preview?path=/recordings/a.mp4'))
      .toBe('/api/harbordesk/knowledge/preview?path=/recordings/a.mp4');
    expect(harborBotSameOriginAdminUrl('/api/cameras/camera-main/snapshot.jpg'))
      .toBe('/api/harbordesk/cameras/camera-main/snapshot.jpg');
    expect(harborBotSameOriginAdminUrl('http://127.0.0.1/ui/assets/harbor-fixtures/public-fixture-dvr.jpg'))
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

    const items = buildHarborBotWaterfallItems(response, 'all');

    expect(items.map((item) => item.kind)).toEqual(['document', 'video', 'image']);
    expect(items[0].previewUrl).toBe('/api/harbordesk/knowledge/preview?path=%2Fmnt%2Fnote.md');
    expect(buildHarborBotWaterfallItems(response, 'images').map((item) => item.kind)).toEqual(['image']);
    expect(buildHarborBotWaterfallItems(response, 'text').map((item) => item.kind)).toEqual(['document']);
    expect(buildHarborBotWaterfallItems(response, 'videos').map((item) => item.kind)).toEqual(['video']);
  });

  it('detects empty result and extracts error state messages', () => {
    expect(harborBotHasNoResults(searchResponse())).toBe(true);
    expect(harborBotHasNoResults(null)).toBe(false);
    expect(harborBotErrorMessage({ error: { error: 'blocked by preview guard' } })).toBe('blocked by preview guard');
    expect(harborBotErrorMessage({ message: 'network failed' })).toBe('network failed');
    expect(harborBotErrorMessage(null)).toBe('HarborBot search failed.');
  });
});

function searchResponse(
  partial: Partial<Pick<HarborBotSearchResponse, 'images' | 'documents' | 'videos'>> = {},
): HarborBotSearchResponse {
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
