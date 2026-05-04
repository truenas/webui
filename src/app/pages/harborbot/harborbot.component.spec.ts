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
    localStorage.clear();
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
    expect(spectator.query('textarea[aria-label="Assistant search query"]')).toExist();
    expect(spectator.element.textContent).not.toContain('Multimodal RAG');
    expect(spectator.element.textContent).not.toContain('HarborBot');
    expect(spectator.element.textContent).not.toContain('RAG search');
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

    expect(spectator.query('.embedding-action')).toHaveText('向量检索模型不可用');
    expect(spectator.query('.embedding-action')).toHaveText('打开模型设置');
  }));

  it('shows a user-facing filter hint instead of debug evidence when the current type has no results', fakeAsync(() => {
    spectator = createComponent();
    const component = spectator.component as unknown as {
      form: {
        controls: {
          query: { setValue: (value: string) => void };
          filter: { setValue: (value: string) => void };
        };
      };
      search: () => void;
    };

    component.form.controls.query.setValue('找到和春天相关的照片');
    component.form.controls.filter.setValue('images');
    component.search();
    tick();
    spectator.detectChanges();

    expect(spectator.query('.filter-empty-state')).toHaveText('当前图片筛选没有相关结果');
    expect(spectator.query('.filter-empty-state')).toHaveText('添加并索引包含春天照片的文件夹');
    expect(spectator.element.textContent).not.toContain('Evidence');
    expect(spectator.element.textContent).not.toContain('Content match');
  }));

  it('stores only recent search terms and reuses them without changing filters', fakeAsync(() => {
    spectator = createComponent();
    const component = spectator.component as unknown as {
      form: {
        controls: {
          query: { value: string; setValue: (value: string) => void };
          filter: { value: string; setValue: (value: string) => void };
          sourceScope: { value: string; setValue: (value: string) => void };
          from: { value: string; setValue: (value: string) => void };
        };
      };
      search: () => void;
      useSearchHistoryTerm: (term: string) => void;
    };

    component.form.controls.query.setValue('谁在倒啤酒');
    component.form.controls.filter.setValue('videos');
    component.form.controls.sourceScope.setValue('dvr_library');
    component.form.controls.from.setValue('2026-05-04T10:00');
    component.search();
    tick();
    spectator.detectChanges();

    expect(JSON.parse(localStorage.getItem('harborAssistant.searchTerms.v1') ?? '[]')).toEqual(['谁在倒啤酒']);
    expect(spectator.query('.search-history-strip')).toHaveText('谁在倒啤酒');

    component.useSearchHistoryTerm('最近有哪些录像');
    spectator.detectChanges();

    expect(component.form.controls.query.value).toBe('最近有哪些录像');
    expect(component.form.controls.filter.value).toBe('videos');
    expect(component.form.controls.sourceScope.value).toBe('dvr_library');
    expect(component.form.controls.from.value).toBe('2026-05-04T10:00');
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
