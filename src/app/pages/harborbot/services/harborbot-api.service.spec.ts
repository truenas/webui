import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { firstValueFrom } from 'rxjs';
import { HarborBotApiService } from 'app/pages/harborbot/services/harborbot-api.service';

describe('HarborBotApiService', () => {
  let spectator: SpectatorService<HarborBotApiService>;
  let httpMock: HttpTestingController;

  const createService = createServiceFactory({
    service: HarborBotApiService,
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    httpMock = spectator.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts searches to the same-origin HarborDesk knowledge endpoint', async () => {
    const promise = firstValueFrom(spectator.service.search({
      query: '找到和春天相关的照片',
      limit: 24,
      include_documents: true,
      include_images: true,
      include_videos: true,
    }));

    const req = httpMock.expectOne('/api/harbordesk/knowledge/search');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      query: '找到和春天相关的照片',
      limit: 24,
      include_documents: true,
      include_images: true,
      include_videos: true,
    });
    expect(req.request.url).not.toContain(':4174');
    req.flush({
      query: '找到和春天相关的照片',
      roots: [],
      total_matches: 1,
      documents: [],
      images: [{
        modality: 'image',
        path: '/mnt/software/photos/neutral-001.jpg',
        title: 'neutral-001.jpg',
        score: 88,
        content_source_kinds: ['vlm'],
        content_indexed: true,
        filename_match_used: false,
        content_match_used: true,
      }],
      videos: [],
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
    });

    const response = await promise;
    expect(response.images[0].content_source_kinds).toEqual(['vlm']);
    expect(response.images[0].filename_match_used).toBe(false);
    expect(response.images[0].content_match_used).toBe(true);
  });

  it('builds encoded same-origin preview URLs', () => {
    const url = spectator.service.previewUrl('/mnt/software/photos/春天 01.jpg');

    expect(url).toBe('/api/harbordesk/knowledge/preview?path=%2Fmnt%2Fsoftware%2Fphotos%2F%E6%98%A5%E5%A4%A9%2001.jpg');
    expect(url).not.toContain(':4174');
    expect(url).not.toContain(':8787');
  });

  it('stays retrieval-only and avoids direct service ports', () => {
    const sources = [
      'src/app/pages/harborbot/services/harborbot-api.service.ts',
      'src/app/pages/harborbot/utils/harborbot-results.ts',
      'src/app/pages/harborbot/harborbot.component.ts',
    ].map((path) => readFileSync(join(process.cwd(), path), 'utf8')).join('\n');

    expect(sources).toContain('/api/harbordesk/knowledge/search');
    expect(sources).toContain('/api/harbordesk/knowledge/preview');
    [':4174', ':4175', ':4176', ':4196', ':8787', '/api/turns', '/api/web/turns'].forEach((forbidden) => {
      expect(sources).not.toContain(forbidden);
    });
  });
});
