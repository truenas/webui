import { fakeAsync, tick } from '@angular/core/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { MarkdownModule } from 'ngx-markdown';
import { of } from 'rxjs';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { KnowledgeSourceRoot } from 'app/pages/harbor-assistant/interfaces/harbor-assistant-status.interface';
import { HarborAssistantSearchComponent } from 'app/pages/harbor-assistant/search/harbor-assistant-search.component';
import { HarborAssistantContentApiService } from 'app/pages/harbor-assistant/shared/harbor-assistant-content-api.service';
import { HarborAssistantSearchResponse } from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';

describe('Harbor Assistant search component', () => {
  let spectator: Spectator<HarborAssistantSearchComponent>;
  let scrollToSpy: jest.Mock;
  let api: Partial<Record<keyof HarborAssistantContentApiService, jest.Mock>>;

  const createComponent = createComponentFactory({
    component: HarborAssistantSearchComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      MarkdownModule.forRoot(),
    ],
    providers: [
      {
        provide: HarborAssistantContentApiService,
        useFactory: (): Partial<Record<keyof HarborAssistantContentApiService, jest.Mock>> => api,
      },
    ],
  });

  const configuredRoots: KnowledgeSourceRoot[] = [
    {
      root_id: 'documents', label: '文档资料', path: '/mnt/documents', enabled: true, include: [], exclude: [],
    },
    {
      root_id: 'camera-recordings', label: '摄像头录像', path: '/mnt/camera', enabled: true, include: [], exclude: [],
    },
  ];

  function createSearchComponent(): Spectator<HarborAssistantSearchComponent> {
    const result = createComponent();
    result.setInput('knowledgeSourceRoots', configuredRoots);
    result.detectChanges();
    return result;
  }

  beforeEach(() => {
    scrollToSpy = jest.fn();
    (Element.prototype as unknown as { scrollTo: jest.Mock }).scrollTo = scrollToSpy;
    localStorage.clear();
    api = {
      search: jest.fn(() => of(searchResponse())),
      previewUrl: jest.fn((path: string) => `/api/beacon/knowledge/preview?path=${encodeURIComponent(path)}`),
    };
  });

  it('renders a WeKnora-style chat stream and bottom composer without DVR controls', () => {
    spectator = createSearchComponent();
    spectator.detectChanges();

    expect(spectator.query('[data-testid="harbor-assistant-chat-stream"]')).toExist();
    expect(spectator.query('.chat-composer')).toExist();
    expect(spectator.query('.chat-welcome')).toExist();
    expect(spectator.query('.chat-header')).not.toExist();
    expect(spectator.query('.live-panel')).not.toExist();
    expect(spectator.query('[data-testid="harbor-assistant-search-media-library"]')).not.toExist();
    expect(spectator.query('textarea[aria-label="Assistant search query"]')).toExist();
    expect(spectator.query('.assistant-panel')).not.toExist();
  });

  it('uses configured folders in the combined @ search settings', () => {
    spectator = createSearchComponent();
    const sourceOptions = spectator.queryAll<HTMLButtonElement>('.source-option:not(.all-sources)');

    expect(spectator.query('details.composer-options')).toExist();
    expect(spectator.query('.composer-options > summary')).toHaveText('2');
    expect(sourceOptions[0]).toHaveText('文档资料');
    expect(sourceOptions[0]).toHaveText('/mnt/documents');
    expect(sourceOptions[1]).toHaveText('摄像头录像');
  });

  it('inserts the full translated quick prompt', () => {
    spectator = createSearchComponent();
    const suggestions = spectator.queryAll<HTMLButtonElement>('.suggestion-card');
    const query = spectator.query<HTMLTextAreaElement>('textarea[aria-label="Assistant search query"]');

    spectator.click(suggestions[1]);

    expect(query?.value).toBe('Find recent camera videos');
  });

  it('closes search settings when clicking elsewhere', () => {
    spectator = createSearchComponent();
    const settings = spectator.query<HTMLDetailsElement>('details.composer-options') as HTMLDetailsElement;
    settings.open = true;

    document.body.click();
    spectator.detectChanges();

    expect(settings.open).toBe(false);
  });

  it('defaults Harbor Assistant search to all knowledge sources', fakeAsync(() => {
    spectator = createSearchComponent();
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
      source_root_ids: ['documents', 'camera-recordings'],
      use_retrieval: true,
    }));
    expect(scrollToSpy).toHaveBeenCalled();
  }));

  it('keeps embedding setup guidance visible in Harbor Assistant search', fakeAsync(() => {
    api.search = jest.fn(() => of(searchResponse({
      degraded: true,
      degraded_reason: 'embedding_unavailable',
      warnings: ['Embedding model unavailable'],
    })));
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
      search: () => void;
    };

    component.form.controls.query.setValue('spring photos');
    component.search();
    tick();
    spectator.detectChanges();

    expect(spectator.query('.embedding-action')).toHaveText('Vector search model is unavailable');
    expect(spectator.query('.embedding-action')).toHaveText('Open model settings');
  }));

  it('uses the @ source selector for multi-scope retrieval and ordinary conversation', fakeAsync(() => {
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
      search: () => void;
    };
    const sourceTrigger = spectator.query<HTMLElement>('.composer-options > summary');
    const selectAll = spectator.query<HTMLButtonElement>('.source-option.all-sources');

    expect(sourceTrigger).toHaveClass('selected');
    expect(sourceTrigger).toHaveText('2');
    expect(selectAll?.getAttribute('aria-checked')).toBe('true');
    spectator.click(selectAll as HTMLButtonElement);
    spectator.detectChanges();
    expect(sourceTrigger).not.toHaveClass('selected');
    expect(selectAll?.getAttribute('aria-checked')).toBe('false');

    component.form.controls.query.setValue('我今天不开心，跟我谈谈话');
    component.search();
    tick();

    expect(api.search).toHaveBeenCalledWith(expect.objectContaining({
      query: '我今天不开心，跟我谈谈话',
      use_retrieval: false,
    }));
  }));

  it('maps one selected source to its scope and multiple sources to all', fakeAsync(() => {
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
      search: () => void;
    };
    const sourceOptions = spectator.queryAll<HTMLButtonElement>('.source-option:not(.all-sources)');

    spectator.click(sourceOptions[1]);
    component.form.controls.query.setValue('NAS 文档');
    component.search();
    tick();

    expect(api.search).toHaveBeenLastCalledWith(expect.objectContaining({
      source_root_ids: ['documents'],
      use_retrieval: true,
    }));

    spectator.click(sourceOptions[1]);
    spectator.detectChanges();
    component.form.controls.query.setValue('全部资料');
    component.search();
    tick();

    expect(api.search).toHaveBeenLastCalledWith(expect.objectContaining({
      source_scope: 'all',
      source_root_ids: ['documents', 'camera-recordings'],
      use_retrieval: true,
    }));
  }));

  it('renders the grounded answer above the evidence results', fakeAsync(() => {
    api.search = jest.fn(() => of(searchResponse({
      answer: '春天相关的文章包括《spring.md》。 [1]',
    })));
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
      search: () => void;
    };

    component.form.controls.query.setValue('有哪些春天的文章');
    component.search();
    tick();
    spectator.detectChanges();
    tick();
    spectator.detectChanges();

    expect(spectator.query('.answer-markdown')).toHaveText('春天相关的文章包括《spring.md》。 [1]');
    expect(spectator.query('.references-panel')).toExist();
  }));

  it('renders ordinary conversation without search result chrome or empty guidance', fakeAsync(() => {
    api.search = jest.fn(() => of(searchResponse({
      answer: '听起来你今天有些难受，我在这里。愿意和我说说发生了什么吗？',
      answer_intent: 'conversation',
      total_matches: 0,
      videos: [],
    })));
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
      search: () => void;
    };

    component.form.controls.query.setValue('我今天不开心，跟我谈谈话');
    component.search();
    tick();
    spectator.detectChanges();
    tick();
    spectator.detectChanges();

    expect(spectator.query('.answer-meta')).toHaveText('Conversation');
    expect(spectator.query('.answer-markdown')).toHaveText('我在这里');
    expect(spectator.query('.filter-empty-state')).not.toExist();
    expect(spectator.query('.references-panel')).not.toExist();
  }));

  it('shows a user-facing filter hint instead of debug evidence when the current type has no results', fakeAsync(() => {
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: {
        controls: {
          query: { setValue: (value: string) => void };
          filter: { setValue: (value: string) => void };
        };
      };
      search: () => void;
    };

    component.form.controls.query.setValue('Find spring photos');
    component.form.controls.filter.setValue('images');
    component.search();
    tick();
    spectator.detectChanges();

    expect(spectator.query('.filter-empty-state')).toHaveText('The current image filter has no related results');
    expect(spectator.query('.filter-empty-state')).toHaveText('add and index a folder with spring photos');
    expect(spectator.element.textContent).not.toContain('Evidence');
    expect(spectator.element.textContent).not.toContain('Content match');
  }));

  it('stores only recent search terms and reuses them without changing filters', fakeAsync(() => {
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: {
        controls: {
          query: { value: string; setValue: (value: string) => void };
          filter: { value: string; setValue: (value: string) => void };
          from: { value: string; setValue: (value: string) => void };
        };
      };
      search: () => void;
      useSearchHistoryTerm: (term: string) => void;
    };

    component.form.controls.query.setValue('谁在倒啤酒');
    component.form.controls.filter.setValue('videos');
    component.form.controls.from.setValue('2026-05-04T10:00');
    component.search();
    tick();
    spectator.detectChanges();

    expect(JSON.parse(localStorage.getItem('harborAssistant.searchTerms.v1') ?? '[]')).toEqual(['谁在倒啤酒']);
    expect(spectator.query('.user-bubble')).toHaveText('谁在倒啤酒');

    component.useSearchHistoryTerm('最近有哪些录像');
    spectator.detectChanges();

    expect(component.form.controls.query.value).toBe('最近有哪些录像');
    expect(component.form.controls.filter.value).toBe('videos');
    expect(component.form.controls.from.value).toBe('2026-05-04T10:00');
  }));
});

function searchResponse(partial: Partial<HarborAssistantSearchResponse> = {}): HarborAssistantSearchResponse {
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
    answer: partial.answer,
    answer_degraded: partial.answer_degraded,
    answer_degraded_reason: partial.answer_degraded_reason,
    answer_intent: partial.answer_intent,
  };
}
