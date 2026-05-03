import { fakeAsync, tick } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { HarborBotComponent } from 'app/pages/harborbot/harborbot.component';
import { HarborBotSearchResponse } from 'app/pages/harbor/shared/harbor.interface';
import { HarborApiService } from 'app/pages/harbor/shared/harbor-api.service';

describe('HarborBotComponent', () => {
  let spectator: Spectator<HarborBotComponent>;
  let scrollIntoViewSpy: jest.Mock;
  let api: Partial<Record<keyof HarborApiService, jest.Mock>>;

  const createComponent = createComponentFactory({
    component: HarborBotComponent,
    imports: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      {
        provide: HarborApiService,
        useFactory: (): Partial<Record<keyof HarborApiService, jest.Mock>> => api,
      },
    ],
  });

  beforeEach(() => {
    scrollIntoViewSpy = jest.fn();
    (Element.prototype as unknown as { scrollIntoView: jest.Mock }).scrollIntoView = scrollIntoViewSpy;
    api = {
      search: jest.fn(() => of(searchResponse())),
      previewUrl: jest.fn((path: string) => `/api/harbordesk/knowledge/preview?path=${encodeURIComponent(path)}`),
    };
  });

  it('renders a RAG workbench without DVR controls', () => {
    spectator = createComponent();
    spectator.detectChanges();

    expect(spectator.query('.rag-workbench')).toExist();
    expect(spectator.query('.live-panel')).not.toExist();
    expect(spectator.query('[data-testid="harborbot-media-library"]')).not.toExist();
    expect(spectator.query('textarea[aria-label="HarborBot multimodal search query"]')).toExist();
  });

  it('defaults HarborBot search to all knowledge sources', fakeAsync(() => {
    spectator = createComponent();
    const component = spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
      search: () => void;
    };

    component.form.controls.query.setValue('谁在倒啤酒');
    component.search();
    spectator.detectChanges();
    tick();

    expect(api.search).toHaveBeenCalledWith(expect.objectContaining({
      query: '谁在倒啤酒',
      include_videos: true,
      source_scope: 'all',
    }));
    expect(scrollIntoViewSpy).toHaveBeenCalled();
  }));

  it('keeps embedding setup guidance visible in HarborBot', fakeAsync(() => {
    api.search = jest.fn(() => of(searchResponse({
      degraded: true,
      degraded_reason: 'embedding_unavailable',
      warnings: ['Embedding model unavailable'],
    })));
    spectator = createComponent();
    const component = spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
      search: () => void;
    };

    component.form.controls.query.setValue('春天照片');
    component.search();
    tick();
    spectator.detectChanges();

    expect(spectator.query('.embedding-action')).toHaveText('语义索引');
  }));
});

function searchResponse(partial: Partial<HarborBotSearchResponse> = {}): HarborBotSearchResponse {
  return {
    query: partial.query ?? '谁在倒啤酒',
    roots: [],
    total_matches: partial.total_matches ?? 1,
    documents: partial.documents ?? [],
    images: partial.images ?? [],
    videos: partial.videos ?? [
      {
        modality: 'video',
        path: '/library/fixtures/beer.mp4',
        title: 'beer.mp4',
        score: 900,
        snippet: '有人在倒啤酒',
        content_source_kinds: ['video_sidecar'],
        content_indexed: true,
        filename_match_used: false,
        content_match_used: true,
      },
    ],
    reply_pack: { summary: '', citations: [] },
    supported_modalities: ['document', 'image', 'video'],
    pending_modalities: [],
    status: partial.status ?? 'ok',
    degraded: partial.degraded ?? false,
    degraded_reason: partial.degraded_reason,
    blockers: partial.blockers ?? [],
    warnings: partial.warnings ?? [],
    source_scope: [],
    privacy_level: 'strict_local',
    resource_profile: 'cpu_only',
  };
}
