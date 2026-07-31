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
      suggestions: jest.fn(() => of({
        generated_at: '1722060000',
        suggestions: [
          { subject: '家庭旅行计划.md — 行程安排', kind: 'summarize', filter: 'text' },
          { subject: '花园春景.jpg', kind: 'describe', filter: 'images' },
        ],
      })),
      conversations: jest.fn(() => of({
        conversations: [],
        settings: { history_limit: 10, context_turn_limit: 3, context_token_limit: 8192 },
      })),
      conversation: jest.fn(),
      deleteConversation: jest.fn(),
      saveConversationSettings: jest.fn(),
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
    expect(spectator.query('.composer-options > summary')).toHaveText('Automatic');
    expect(sourceOptions[0]).toHaveText('文档资料');
    expect(sourceOptions[0]).toHaveText('/mnt/documents');
    expect(sourceOptions[1]).toHaveText('摄像头录像');
  });

  it('renders and inserts questions generated from indexed knowledge', () => {
    spectator = createSearchComponent();
    const suggestions = spectator.queryAll<HTMLButtonElement>('.suggestion-card');
    const query = spectator.query<HTMLTextAreaElement>('textarea[aria-label="Assistant search query"]');

    spectator.click(suggestions[1]);

    expect(api.suggestions).toHaveBeenCalled();
    expect(suggestions[0]).toHaveText('What can I learn about “家庭旅行计划.md — 行程安排”?');
    expect(query?.value).toBe('Show me content about “花园春景.jpg”');
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
      conversation_id: expect.stringMatching(/^conv-/),
      include_videos: true,
      source_scope: 'all',
      source_root_ids: ['documents', 'camera-recordings'],
      retrieval_mode: 'auto',
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

  it('does not report the embedding model unavailable for partial vector coverage', fakeAsync(() => {
    api.search = jest.fn(() => of(searchResponse({
      warnings: ['Embedding cache 覆盖不足：9 / 108 个 BM25 候选在向量存储中不存在。'],
    })));
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
      search: () => void;
    };

    component.form.controls.query.setValue('大自然相关图片');
    component.search();
    tick();
    spectator.detectChanges();

    expect(spectator.query('.embedding-action')).not.toExist();
    expect(spectator.query('.notice.warning')).toHaveText('Embedding cache 覆盖不足');
    expect(spectator.query('.notice.warning')).not.toHaveText('Vector search model is unavailable');
  }));

  it('shows active knowledge indexing progress', () => {
    spectator = createSearchComponent();
    spectator.setInput('knowledgeIndexJob', {
      job_id: 'knowledge-index-1',
      source_root_id: 'documents',
      source_root_label: 'Documents',
      source_root_path: '/mnt/documents',
      modalities: ['document'],
      status: 'running',
      progress_percent: 85,
      retry_count: 0,
      checkpoint: { phase: 'embedding_warmup' },
      resource_profile: 'cpu_only',
      cancel_requested: false,
    });
    spectator.detectChanges();

    expect(spectator.query('.knowledge-index-progress')).toHaveText('Knowledge index is running');
    expect(spectator.query('.knowledge-index-progress')).toHaveText('Generating missing vectors');
    expect(spectator.query('.knowledge-index-progress')).toHaveText('85%');
  });

  it('keeps automatic routing when the @ source scope is cleared', fakeAsync(() => {
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: { controls: { query: { setValue: (value: string) => void } } };
      search: () => void;
    };
    const sourceTrigger = spectator.query<HTMLElement>('.composer-options > summary');
    const selectAll = spectator.query<HTMLButtonElement>('.source-option.all-sources');

    expect(sourceTrigger).toHaveClass('selected');
    expect(sourceTrigger).toHaveText('Automatic');
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
      retrieval_mode: 'auto',
    }));
  }));

  it('lets the user choose automatic, forced retrieval, or ordinary chat', fakeAsync(() => {
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: { controls: {
        query: { setValue: (value: string) => void };
        retrievalMode: { setValue: (value: 'auto' | 'on' | 'off') => void };
      } };
      search: () => void;
    };

    expect(spectator.query('.retrieval-mode-toggle')).toHaveText('Automatic');
    expect(spectator.query('.retrieval-mode-toggle')).toHaveText('Force retrieval');
    expect(spectator.query('.retrieval-mode-toggle')).toHaveText('Ordinary chat');

    component.form.controls.retrievalMode.setValue('on');
    component.form.controls.query.setValue('查找春天资料');
    component.search();
    tick();
    expect(api.search).toHaveBeenLastCalledWith(expect.objectContaining({ retrieval_mode: 'on' }));

    component.form.controls.retrievalMode.setValue('off');
    component.form.controls.query.setValue('陪我聊天');
    component.search();
    tick();
    expect(api.search).toHaveBeenLastCalledWith(expect.objectContaining({ retrieval_mode: 'off' }));
  }));

  it('leaves result count to natural-language planning', fakeAsync(() => {
    spectator = createSearchComponent();
    const component = spectator.component as unknown as {
      form: { controls: {
        query: { setValue: (value: string) => void };
      } };
      search: () => void;
    };

    component.form.controls.query.setValue('给我10张图片');
    component.search();
    tick();
    expect(api.search).toHaveBeenLastCalledWith(expect.not.objectContaining({ limit: expect.anything() }));
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
      retrieval_mode: 'auto',
    }));

    spectator.click(sourceOptions[1]);
    spectator.detectChanges();
    component.form.controls.query.setValue('全部资料');
    component.search();
    tick();

    expect(api.search).toHaveBeenLastCalledWith(expect.objectContaining({
      source_scope: 'all',
      source_root_ids: ['documents', 'camera-recordings'],
      retrieval_mode: 'auto',
    }));
  }));

  it('renders the grounded answer above the evidence results', fakeAsync(() => {
    api.search = jest.fn(() => of(searchResponse({
      answer: '春天相关的文章包括《spring.md》。 [1]',
      review_scope: {
        returned_count: 20,
        reviewed_count: 10,
        max_reviewed_count: 10,
        note: '共返回20个结果，本次只分析前10个。',
      },
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
    expect(spectator.query('.notice.compact')).toHaveText('共返回20个结果，本次只分析前10个。');
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

  it('loads a persisted conversation and renders its previous turns', fakeAsync(() => {
    api.conversations = jest.fn(() => of({
      conversations: [{
        conversation_id: 'conv-history', title: '春天的文章', turn_count: 1,
      }],
      settings: { history_limit: 10, context_turn_limit: 3, context_token_limit: 8192 },
    }));
    api.conversation = jest.fn(() => of({
      conversation_id: 'conv-history',
      turns: [{
        task_id: 'task-1',
        query: '有哪些春天的文章',
        answer: '找到《spring.md》。 [1]',
        response: {
          status: 'completed',
          degraded: false,
          query: '有哪些春天的文章',
          answer: '找到《spring.md》。 [1]',
          citations: [],
          search: searchResponse({ query: '有哪些春天的文章', answer: undefined }),
          warnings: [],
          query_understanding: { intent: 'search', needs_retrieval: true },
        },
      }],
    }));
    spectator = createSearchComponent();
    spectator.click(spectator.query<HTMLButtonElement>('.conversation-select') as HTMLButtonElement);
    tick();
    spectator.detectChanges();

    expect(api.conversation).toHaveBeenCalledWith('conv-history');
    expect(spectator.query('.user-bubble')).toHaveText('有哪些春天的文章');
    expect(spectator.query('.answer-markdown')).toHaveText('spring.md');
  }));

  it('keeps new chat, history, and settings in the left conversation column', () => {
    spectator = createSearchComponent();

    const sidebar = spectator.query<HTMLElement>('.conversation-sidebar') as HTMLElement;
    const newConversation = sidebar.querySelector('.new-conversation-button');
    const history = sidebar.querySelector('.conversation-list');
    const settings = sidebar.querySelector('.conversation-settings');

    expect(newConversation).toBeTruthy();
    expect(history).toBeTruthy();
    expect(settings).toBeTruthy();
    expect(newConversation?.compareDocumentPosition(history as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(history?.compareDocumentPosition(settings as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(settings).toHaveText('10 / 3');
  });

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
    review_scope: partial.review_scope,
  };
}
