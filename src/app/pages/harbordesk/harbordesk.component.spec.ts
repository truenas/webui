import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { HarborDeskComponent } from 'app/pages/harbordesk/harbordesk.component';
import { HarborDeskApiService } from 'app/pages/harbordesk/services/harbordesk-api.service';

describe('HarborDeskComponent', () => {
  let spectator: Spectator<HarborDeskComponent>;
  let api: Partial<Record<keyof HarborDeskApiService, jest.Mock>>;
  let matDialog: { open: jest.Mock };
  const router = {
    events: of(),
    navigate: jest.fn(),
    createUrlTree: jest.fn(() => ({})),
    serializeUrl: jest.fn(() => '/'),
  };

  const createComponent = createComponentFactory({
    component: HarborDeskComponent,
    imports: [
      MockComponent(PageHeaderComponent),
    ],
    providers: [
      {
        provide: HarborDeskApiService,
        useFactory: (): Partial<Record<keyof HarborDeskApiService, jest.Mock>> => api,
      },
      mockProvider(ActivatedRoute, {
        queryParamMap: of(convertToParamMap({ tab: 'models' })),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({ path: '/mnt/pool/videos' }),
        })),
      }),
      mockProvider(Router, router),
    ],
  });

  beforeEach(() => {
    router.navigate.mockClear();
    api = harborDeskApiMock();
    matDialog = {
      open: jest.fn(() => ({
        afterClosed: () => of({ path: '/mnt/pool/videos' }),
      })),
    };
  });

  it('renders the AI settings subtabs without technical routing copy', () => {
    spectator = createComponent();
    spectator.detectChanges();

    expect(spectator.query('.harbordesk-page')).toExist();
    expect(spectator.query('.harbordesk-intro')).not.toExist();
    expect(spectator.query('.ai-settings-card')).toExist();
    expect(spectator.query('.ai-status-toolbar')).toExist();
    expect(spectator.query('.ai-settings-subtabs')).toHaveText('数据源');
    expect(spectator.query('.ai-settings-subtabs')).toHaveText('模型');
    expect(spectator.query('.ai-settings-subtabs')).toHaveText('云端 API');
    expect(spectator.query('.workflow-stepper')).not.toExist();
    expect(spectator.query('.model-library-card')).not.toExist();
    expect(spectator.element.textContent).not.toContain('Harbor AI Settings');
    expect(spectator.element.textContent).not.toContain('HarborBot / HarborCam');
    expect(spectator.element.textContent).not.toContain('本机能力与模型推荐');
    expect(spectator.element.textContent).not.toContain('系统诊断');
    expect(spectator.element.textContent?.toLowerCase()).not.toContain('endpoint');
    expect(spectator.element.textContent?.toLowerCase()).not.toContain('fallback order');
  });

  it('does not show raw endpoint errors in the AI settings page', () => {
    spectator = createComponent();
    spectator.detectChanges();

    (spectator.component as unknown as { endpointErrors: { set: (errors: Record<string, string>) => void } })
      .endpointErrors
      .set({
        knowledgeIndexStatus: 'knowledge-index-status: Http failure response for /api/harbordesk/knowledge/index/status: 500 OK',
      });
    spectator.detectChanges();

    expect(spectator.element.textContent).toContain('索引状态暂时没有刷新成功');
    expect(spectator.element.textContent).not.toContain('Http failure');
    expect(spectator.element.textContent).not.toContain('500 OK');
  });

  it('defaults the Assistant entry to search when no route query is present', () => {
    spectator = createComponent({
      providers: [
        mockProvider(ActivatedRoute, {
          queryParamMap: of(convertToParamMap({})),
        }),
      ],
    });
    spectator.detectChanges();

    expect(spectator.query('.assistant-search-tab')).toExist();
    expect(spectator.query('.settings-tab')).not.toExist();
  });

  it('uses one native Harbor Assistant shell for search, camera, messages, and settings', () => {
    spectator = createComponent();
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      selectTab: (tab: 'messages' | 'settings') => void;
      selectSettingsSection: (section: 'ai' | 'camera') => void;
    };

    expect(spectator.query('.tab-strip')).toHaveText('搜索');
    expect(spectator.query('.tab-strip')).toHaveText('摄像头');
    expect(spectator.query('.tab-strip')).toHaveText('消息连接');
    expect(spectator.query('.tab-strip')).toHaveText('设置');

    component.selectTab('messages');
    spectator.detectChanges();
    expect(spectator.query('.im-tab')).toExist();
    expect(spectator.query('.im-native-panel')).toExist();
    expect(spectator.query('.im-connector-row')).toExist();
    expect(spectator.query('input[type="radio"]')).toExist();
    expect(spectator.element.textContent).not.toContain('Route key');
    expect(spectator.element.textContent).not.toContain('route_key');

    component.selectTab('settings');
    component.selectSettingsSection('camera');
    spectator.detectChanges();
    expect(spectator.query('.devices-tab')).toExist();
    expect(spectator.query('.device-setup-stack')).toExist();
    expect(spectator.query('.simple-dvr-form')).toExist();
    expect(spectator.query('.device-edit-grid')).toExist();
    expect(spectator.query('.system-tab')).not.toExist();
  });

  it('keeps a non-AI tab selected when an old focus parameter is present', () => {
    spectator = createComponent({
      providers: [
        mockProvider(ActivatedRoute, {
          queryParamMap: of(convertToParamMap({ tab: 'devices', focus: 'models' })),
        }),
      ],
    });
    spectator.detectChanges();

    expect(spectator.query('.settings-tab')).toExist();
    expect(spectator.query('.devices-tab')).toExist();
    expect(spectator.query('.models-tab')).not.toExist();
  });

  it('selects exactly one default IM target from connector rows', () => {
    const defaultSubject = new Subject<unknown>();
    api.getNotificationTargets = jest.fn(() => of({
      targets: [
        { target_id: 'weixin-1', label: '微信', platform_hint: 'weixin', is_default: true },
        { target_id: 'feishu-1', label: '飞书', platform_hint: 'feishu', is_default: false },
      ],
    }));
    api.setDefaultNotificationTarget = jest.fn(() => defaultSubject.asObservable());
    spectator = createComponent({
      providers: [
        mockProvider(ActivatedRoute, {
          queryParamMap: of(convertToParamMap({ tab: 'messages' })),
        }),
      ],
    });
    spectator.detectChanges();

    const radios = spectator.queryAll<HTMLInputElement>('input[type="radio"]');
    expect(radios.length).toBe(2);
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);

    spectator.click(radios[1]);
    spectator.detectChanges();

    expect(api.setDefaultNotificationTarget).toHaveBeenCalledWith('feishu-1');
    expect(radios[0].checked).toBe(false);
    expect(radios[1].checked).toBe(true);
    expect(spectator.query('.im-connector-list')).toHaveText('正在保存');

    defaultSubject.next({
      targets: [
        { target_id: 'weixin-1', label: '微信', platform_hint: 'weixin', is_default: false },
        { target_id: 'feishu-1', label: '飞书', platform_hint: 'feishu', is_default: true },
      ],
    });
    defaultSubject.complete();
  });

  it('opens the model subtab and shows product capability names', () => {
    spectator = createComponent();

    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const panel = spectator.query('.model-capability-list');
    expect(spectator.query('.model-capability-header')).toHaveText('能力');
    expect(spectator.query('.model-capability-header')).toHaveText('当前模型');
    expect(spectator.query('.model-capability-header')).toHaveText('状态');
    expect(spectator.query('.model-capability-header')).toHaveText('操作');
    expect(panel).toHaveText('问题理解');
    expect(panel).toHaveText('向量检索');
    expect(panel).toHaveText('对话回答');
    expect(panel).toHaveText('图片/视频理解');
    expect(panel).not.toHaveText('语音转文字');
    expect(panel).not.toHaveText('事件检测');
    expect(panel?.textContent?.toLowerCase()).not.toContain('detector');
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { tab: 'settings', section: 'ai', focus: 'models', node: null },
    }));
  });

  it('shows installed models only after opening the vector retrieval model chooser', () => {
    spectator = createComponent();

    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      aiModelCapabilities: () => Array<{ id: string; kind: string }>;
      workflowModelChoices: (kind: string) => Array<{ displayName: string }>;
      toggleModelCapabilityChooser: (capability: { id: string; kind: string }) => void;
    };
    expect(component.workflowModelChoices('embedder').map((card) => card.displayName)).toContain('Harbor Embed Small');
    expect(spectator.query('.inline-model-panel')).not.toExist();

    component.toggleModelCapabilityChooser(component.aiModelCapabilities()[1]);
    spectator.detectChanges();

    expect(spectator.query('.model-capability-row .inline-model-panel')).toHaveText('Harbor Embed Small');
  });

  it('puts the More action inside an empty model chooser', () => {
    api.getLocalModelCatalog = jest.fn(() => of({
      models: [
        {
          model_id: 'harbor-vision-small',
          display_name: 'Harbor Vision Small',
          provider_key: 'local',
          model_kind: 'vlm',
          status: 'available',
          expected_capabilities: ['vision', 'video'],
          recommended_hardware: 'GPU',
          download_size_hint: '4 GiB',
        },
      ],
      download_jobs: [],
    }));
    spectator = createComponent();

    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      aiModelCapabilities: () => Array<{ id: string; kind: string }>;
      toggleModelCapabilityChooser: (capability: { id: string; kind: string }) => void;
    };
    component.toggleModelCapabilityChooser(component.aiModelCapabilities()[1]);
    spectator.detectChanges();

    const emptyState = spectator.query('.model-capability-row .inline-empty-action');
    expect(emptyState).toHaveText('还没有已安装模型');
    expect(emptyState).toHaveText('更多模型');

    spectator.click(spectator.query('.model-capability-row .inline-empty-action button'));
    spectator.detectChanges();

    expect(spectator.query('.model-library-card')).not.toExist();
    expect(spectator.query('.model-capability-row .inline-model-panel')).toHaveText('Hugging Face');
  });

  it('opens the folder picker and saves the selected folder as a data source', () => {
    spectator = createComponent({
      providers: [
        mockProvider(MatDialog, matDialog),
      ],
    });

    const component = spectator.component as unknown as {
      openKnowledgeFolderPicker: () => void;
    };
    component.openKnowledgeFolderPicker();
    spectator.detectChanges();

    expect(matDialog.open).toHaveBeenCalled();
    expect(api.saveKnowledgeSettings).toHaveBeenCalledWith(expect.objectContaining({
      source_roots: expect.arrayContaining([
        expect.objectContaining({ path: '/mnt/pool/videos', label: 'videos' }),
      ]),
    }));
    expect(spectator.query('.pending-source-card')).not.toExist();
  });

  it('uses Edit to choose a replacement folder for an existing data source', () => {
    spectator = createComponent({
      providers: [
        mockProvider(MatDialog, matDialog),
      ],
    });

    spectator.click(spectator.query('.source-roots-card .table-row button'));
    spectator.detectChanges();

    expect(matDialog.open).toHaveBeenCalled();
    expect(api.saveKnowledgeSettings).toHaveBeenCalledWith(expect.objectContaining({
      source_roots: expect.arrayContaining([
        expect.objectContaining({ root_id: 'nas', path: '/mnt/pool/videos' }),
      ]),
    }));
  });

  it('shows model downloads inline only after the user asks for more models', () => {
    spectator = createComponent();
    spectator.detectChanges();

    expect(spectator.query('.model-library-card')).not.toExist();
    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      aiModelCapabilities: () => Array<{ id: string; kind: string }>;
      openModelCapabilityMoreModels: (capability: { id: string; kind: string }) => void;
    };
    component.openModelCapabilityMoreModels(component.aiModelCapabilities()[1]);
    spectator.detectChanges();

    expect(spectator.query('.model-library-card')).not.toExist();
    expect(spectator.query('.model-capability-row .inline-model-panel')).toHaveText('Hugging Face');
    expect(spectator.query('.model-capability-row .inline-model-panel')).not.toHaveText('Harbor Vision Small');
  });

  it('shows failed download jobs with the error and a redownload action', () => {
    const failedJob = {
      job_id: 'job-qwen-failed',
      model_id: 'Qwen/Qwen3.5-4B',
      display_name: 'Qwen3.5 4B',
      provider_key: 'qwen',
      status: 'failed',
      target_path: '/mnt/models/qwen3.5-4b',
      progress_percent: 100,
      error_message: 'hf-mirror returned 404 for repo info',
      message: 'download failed',
      metadata: {},
    };
    api.getModelCapabilities = jest.fn(() => of(modelCapabilitiesWithEmbedder({
      status: 'needs_model',
      download_jobs: [failedJob],
    })));
    api.getLocalModelCatalog = jest.fn(() => of({
      models: [qwenCatalogModel({ status: 'needs-config' })],
      download_jobs: [failedJob],
    }));
    api.getLocalModelDownloads = jest.fn(() => of({ jobs: [failedJob] }));

    spectator = createComponent();
    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      aiModelCapabilities: () => Array<{ id: string; kind: string }>;
      openModelCapabilityMoreModels: (capability: { id: string; kind: string }) => void;
    };
    component.openModelCapabilityMoreModels(component.aiModelCapabilities()[1]);
    spectator.detectChanges();

    const panel = spectator.query('.model-capability-row .inline-model-panel');
    expect(panel).toHaveText('下载失败');
    expect(panel).toHaveText('hf-mirror returned 404 for repo info');
    expect(panel).toHaveText('重新下载');
    expect(panel).not.toHaveText('100%');
  });

  it('collapses repeated failed retries into the latest model download row', () => {
    const oldFailedJob = {
      job_id: 'job-qwen-old-failed',
      model_id: 'Qwen/Qwen3.5-4B',
      display_name: 'Qwen3.5 4B',
      provider_key: 'qwen',
      status: 'failed',
      requested_at: '1',
      updated_at: '1',
      target_path: '/mnt/models/qwen3.5-4b',
      progress_percent: 100,
      error_message: 'old hf-mirror 404',
      metadata: {},
    };
    const latestJob = {
      ...oldFailedJob,
      job_id: 'job-qwen-latest',
      status: 'downloading',
      requested_at: '2',
      updated_at: '3',
      progress_percent: 1,
      error_message: null,
    };
    api.getModelCapabilities = jest.fn(() => of(modelCapabilitiesWithEmbedder({
      status: 'downloading',
      download_jobs: [oldFailedJob, latestJob],
    })));
    api.getLocalModelCatalog = jest.fn(() => of({
      models: [qwenCatalogModel({ status: 'running' })],
      download_jobs: [oldFailedJob, latestJob],
    }));
    api.getLocalModelDownloads = jest.fn(() => of({ jobs: [oldFailedJob, latestJob] }));

    spectator = createComponent();
    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      downloadJobs: () => Array<{ job_id: string; model_id: string }>;
      aiModelCapabilities: () => Array<{ id: string; kind: string }>;
      openModelCapabilityMoreModels: (capability: { id: string; kind: string }) => void;
    };
    expect(component.downloadJobs().map((job) => job.job_id)).toEqual(['job-qwen-latest']);

    component.openModelCapabilityMoreModels(component.aiModelCapabilities()[1]);
    spectator.detectChanges();

    const rows = spectator.queryAll('.model-capability-row .inline-model-panel .model-option-row');
    expect(rows.length).toBe(1);
    expect(rows[0]).toHaveText('Qwen3.5 4B');
    expect(rows[0]).toHaveText('1%');
    expect(rows[0]).not.toHaveText('old hf-mirror 404');
  });

  it('offers downloaded local models as selectable installed choices', () => {
    const installedModel = {
      model_id: 'Qwen/Qwen3.5-4B',
      display_name: 'Qwen3.5 4B',
      provider_key: 'qwen',
      model_kind: 'embedder',
      status: 'ready',
      installed: true,
      local_path: '/mnt/models/qwen3.5-4b',
      download_job_id: 'job-qwen-completed',
      source_kind: 'huggingface',
      repo_id: 'Qwen/Qwen3.5-4B',
      file_policy: 'runtime_snapshot',
      expected_capabilities: ['embedder'],
    };
    api.getModelCapabilities = jest.fn(() => of(modelCapabilitiesWithEmbedder({
      status: 'installed_not_running',
      installed_models: [installedModel],
    })));
    api.getLocalModelCatalog = jest.fn(() => of({
      models: [qwenCatalogModel({
        status: 'ready',
        installed: true,
        local_path: '/mnt/models/qwen3.5-4b',
      })],
      download_jobs: [],
    }));
    api.getLocalModelDownloads = jest.fn(() => of({
      jobs: [{
        job_id: 'job-qwen-completed',
        model_id: 'Qwen/Qwen3.5-4B',
        display_name: 'Qwen3.5 4B',
        provider_key: 'qwen',
        status: 'completed',
        target_path: '/mnt/models/qwen3.5-4b',
        progress_percent: 100,
        metadata: {},
      }],
    }));

    spectator = createComponent();
    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      aiModelCapabilities: () => Array<{ id: string; kind: string }>;
      toggleModelCapabilityChooser: (capability: { id: string; kind: string }) => void;
    };
    component.toggleModelCapabilityChooser(component.aiModelCapabilities()[1]);
    spectator.detectChanges();

    const panel = spectator.query('.model-capability-row .inline-model-panel');
    expect(panel).toHaveText('Qwen3.5 4B');
    expect(panel).toHaveText('/mnt/models/qwen3.5-4b');
    expect(panel).toHaveText('选择');
  });

  it('treats choosing an installed model as a runtime start request', () => {
    const installedModel = {
      model_id: 'Qwen/Qwen3.5-4B',
      display_name: 'Qwen3.5 4B',
      provider_key: 'qwen',
      model_kind: 'embedder',
      status: 'ready',
      installed: true,
      local_path: '/mnt/models/qwen3.5-4b',
      source_kind: 'huggingface',
      repo_id: 'Qwen/Qwen3.5-4B',
      file_policy: 'runtime_snapshot',
      expected_capabilities: ['embedder'],
    };
    api.getModelCapabilities = jest.fn(() => of(modelCapabilitiesWithEmbedder({
      status: 'installed_not_running',
      runtime_model_id: '/models/old-embed.gguf',
      runtime_ready: true,
      current_model: {
        model_endpoint_id: 'embedder-local',
        model_name: '/models/old-embed.gguf',
        provider_key: 'local',
        status: 'active',
      },
      installed_models: [installedModel],
    })));
    api.selectModelCapability = jest.fn(() => of(modelCapabilitiesWithEmbedder({
      status: 'installed_not_running',
      selected_model_id: 'Qwen/Qwen3.5-4B',
      runtime_model_id: '/models/old-embed.gguf',
      runtime_ready: true,
      installed_models: [installedModel],
    })));

    spectator = createComponent();
    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      aiModelCapabilities: () => Array<{ id: string; kind: string }>;
      toggleModelCapabilityChooser: (capability: { id: string; kind: string }) => void;
    };
    component.toggleModelCapabilityChooser(component.aiModelCapabilities()[1]);
    spectator.detectChanges();

    spectator.click(spectator.query('.model-capability-row .inline-model-panel button'));
    spectator.detectChanges();

    expect(api.selectModelCapability).toHaveBeenCalledWith('embedder', 'Qwen/Qwen3.5-4B');
    expect(spectator.element.textContent).toContain('模型启动已发起');
    expect(spectator.element.textContent).not.toContain('需要配置或启动兼容运行时后才会生效');
  });

  it('groups installed 4B as not recommended and keeps FlashV4 visible as cloud backup', () => {
    api.getHardwareReadiness = jest.fn(() => of({
      status: 'ready',
      cpu: { status: 'ready', summary: 'ready', detail: 'ready', evidence: [] },
      memory: { status: 'ready', summary: '11.7 GiB', detail: 'ready', evidence: [] },
      gpu: { status: 'warn', summary: 'No confirmed GPU memory', detail: 'ready', evidence: [] },
      npu: { status: 'warn', summary: 'No NPU', detail: 'ready', evidence: [] },
      memory_mb: 11980,
      gpu_vram_total_mb: null,
      hardware_class: 'tiny_cpu',
      recommended_model_profile: 'lightweight-local-models',
    }));
    api.getModelEndpoints = jest.fn(() => of({
      endpoints: [
        modelEndpoint('llm-local', 'llm', '/models/chat.gguf'),
        {
          model_endpoint_id: 'llm-cloud-siliconflow',
          model_kind: 'llm',
          endpoint_kind: 'cloud',
          provider_key: 'openai_compatible',
          model_name: 'deepseek-ai/DeepSeek-V4-Flash',
          capability_tags: ['chat'],
          cost_policy: {},
          status: 'disabled',
          metadata: {
            provider: 'siliconflow',
            provider_label: 'SiliconFlow',
            base_url: 'https://api.siliconflow.cn/v1',
            api_key_configured: false,
          },
        },
      ],
    }));
    api.getLocalModelCatalog = jest.fn(() => of({
      models: [
        qwenCatalogModel({
          model_kind: 'llm',
          installed: true,
          status: 'ready',
          local_path: '/mnt/software/harborbeacon-agent-ci/model-store/qwen-qwen3.5-4b',
          expected_capabilities: ['chat'],
          hardware_fit: 'not_recommended',
          fit_reason: '4B model is installed, but current hardware has no confirmed 16GB+ usable GPU memory.',
          recommendation_group: 'installed_not_recommended',
        }),
        {
          model_id: 'qwen2.5-1.5b-instruct',
          display_name: 'Qwen2.5 1.5B Instruct',
          provider_key: 'qwen',
          model_kind: 'llm',
          source_kind: 'huggingface',
          status: 'available',
          installable: true,
          manual_only: false,
          repo_id: 'Qwen/Qwen2.5-1.5B-Instruct',
          revision: 'main',
          file_policy: 'runtime_snapshot',
          expected_capabilities: ['chat'],
          recommended_hardware: 'CPU',
          download_size_hint: '2 GiB',
          hardware_fit: 'recommended',
          fit_reason: 'Lightweight local profile fits the current machine.',
          recommendation_group: 'lightweight_local',
        },
      ],
      download_jobs: [],
    }));

    spectator = createComponent();
    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      workflowModelChoices: (kind: string) => Array<{ displayName: string; actionLabel: string; errorMessage: string | null }>;
      modelRecommendationLabel: (card: unknown) => string;
      modelHardwareFitLabel: (card: unknown) => string;
    };
    const choices = component.workflowModelChoices('semantic_router');
    const qwen4b = choices.find((card) => card.displayName === 'Qwen3.5 4B');
    const qwen25 = choices.find((card) => card.displayName === 'Qwen2.5 1.5B Instruct');
    const flash = choices.find((card) => card.displayName === 'deepseek-ai/DeepSeek-V4-Flash');

    expect(qwen4b).toBeTruthy();
    expect(component.modelRecommendationLabel(qwen4b)).toBe('已安装但不推荐当前硬件');
    expect(component.modelHardwareFitLabel(qwen4b)).toBe('不推荐当前硬件运行');
    expect(qwen25).toBeTruthy();
    expect(component.modelRecommendationLabel(qwen25)).toBe('轻量本地');
    expect(flash).toBeTruthy();
    expect(component.modelRecommendationLabel(flash)).toBe('云端备用');
    expect(flash?.actionLabel).toBe('配置 API Key');
    expect(flash?.errorMessage).toContain('FlashV4 没有丢失');
  });

  it('starts BGE M3 from Hugging Face metadata instead of asking for a manual URL', () => {
    api.getModelCapabilities = jest.fn(() => of(modelCapabilitiesWithEmbedder({
      status: 'needs_model',
      current_model: null,
      runtime_ready: false,
    })));
    api.getLocalModelCatalog = jest.fn(() => of({
      models: [
        {
          model_id: 'bge-m3',
          display_name: 'BGE M3 Embedding',
          provider_key: 'bge',
          model_kind: 'embedder',
          source_kind: 'huggingface',
          status: 'available',
          installable: true,
          manual_only: false,
          repo_id: 'BAAI/bge-m3',
          revision: 'main',
          file_policy: 'runtime_snapshot',
          expected_capabilities: ['embedding'],
          recommended_hardware: 'CPU',
          download_size_hint: '1-2 GB',
          hardware_fit: 'recommended',
          fit_reason: 'Lightweight local profile fits the current machine.',
          recommendation_group: 'lightweight_local',
        },
      ],
      download_jobs: [],
    }));

    spectator = createComponent();
    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const component = spectator.component as unknown as {
      workflowAvailableModelChoices: (kind: string) => Array<unknown>;
      handleModelCardAction: (card: unknown) => void;
    };
    const bge = component.workflowAvailableModelChoices('embedder')[0];
    component.handleModelCardAction(bge);

    expect(api.createLocalModelDownload).toHaveBeenCalledWith(expect.objectContaining({
      model_id: 'bge-m3',
      metadata: expect.objectContaining({
        repo_id: 'BAAI/bge-m3',
        source_kind: 'huggingface',
        file_policy: 'runtime_snapshot',
      }),
    }));
  });

  it('normalizes scan CIDR defaults and sends RTSP port separately', () => {
    api.getState = jest.fn(() => of({
      devices: [],
      defaults: {
        cidr: '192.168.3.0/554',
        discovery: 'RTSP',
        rtsp_port: 554,
      },
      writable_root: '/var/lib/harbor',
    }));

    spectator = createComponent();
    const component = spectator.component as unknown as {
      selectTab: (tab: 'settings') => void;
      selectSettingsSection: (section: 'camera') => void;
      scanForm: { controls: { cidr: { value: string }; rtspPort: { value: string }; username: { value: string }; password: { value: string } } };
      scanDevices: () => void;
    };
    component.selectTab('settings');
    component.selectSettingsSection('camera');
    spectator.detectChanges();

    expect(component.scanForm.controls.cidr.value).toBe('192.168.3.0/24');
    expect(component.scanForm.controls.rtspPort.value).toBe('554');
    expect(component.scanForm.controls.password.value).toBe('');

    component.scanDevices();
    expect(api.scanDevices).toHaveBeenCalledWith({
      cidr: '192.168.3.0/24',
      protocol: 'RTSP',
      rtsp_port: 554,
      rtsp_username: null,
      rtsp_password: null,
    });
  });

  it('shows password-required scan results instead of silently adding a protected camera', () => {
    api.scanDevices = jest.fn(() => of({
      scanned_hosts: 1,
      devices: [],
      defaults: {
        cidr: '192.168.3.0/24',
        discovery: 'RTSP',
        rtsp_port: 554,
        rtsp_username: 'admin',
      },
      results: [{
        candidate_id: 'rtsp-192-168-3-231',
        device_id: null,
        name: 'Camera 192.168.3.231',
        room: '待识别',
        ip: '192.168.3.231',
        port: 554,
        protocol: 'RTSP / 需密码',
        note: '摄像头需要密码。',
        reachable: false,
        registered: false,
        requires_auth: true,
        rtsp_paths: ['/stream1'],
      }],
    }));

    spectator = createComponent();
    const component = spectator.component as unknown as {
      selectTab: (tab: 'settings') => void;
      selectSettingsSection: (section: 'camera') => void;
      scanDevices: () => void;
    };
    component.selectTab('settings');
    component.selectSettingsSection('camera');
    spectator.detectChanges();

    component.scanDevices();
    spectator.detectChanges();

    expect(spectator.element.textContent).toContain('发现需要密码的摄像头');
    expect(spectator.element.textContent).toContain('填写密码接入');
    expect(spectator.element.textContent).toContain('RTSP / 需密码');
  });

  it('lets a password-required scan result be connected inline with credentials', () => {
    api.scanDevices = jest.fn(() => of({
      scanned_hosts: 1,
      devices: [],
      defaults: {
        cidr: '192.168.3.0/24',
        discovery: 'RTSP',
        rtsp_port: 554,
        rtsp_username: 'admin',
      },
      results: [{
        candidate_id: 'rtsp-192-168-3-231',
        device_id: null,
        name: 'Camera 192.168.3.231',
        room: '待识别',
        ip: '192.168.3.231',
        port: 554,
        protocol: 'RTSP / 需密码',
        note: '摄像头需要密码。',
        reachable: false,
        registered: false,
        requires_auth: true,
        rtsp_paths: ['/stream1'],
      }],
    }));
    api.addManualDevice = jest.fn(() => of({ devices: [], defaults: {}, writable_root: '/var/lib/harbor' }));

    spectator = createComponent();
    const component = spectator.component as unknown as {
      selectTab: (tab: 'settings') => void;
      selectSettingsSection: (section: 'camera') => void;
      scanDevices: () => void;
      scanResults: () => Array<{
        candidate_id: string;
        name: string;
        room: string;
        ip: string;
        port: number;
        rtsp_paths?: string[];
      }>;
      prepareManualFromScan: (result: unknown) => void;
      scanCredentialForm: { patchValue: (value: { username: string; password: string }) => void };
      toggleScanCredentialPasswordVisible: () => void;
      connectScanResult: (result: unknown) => void;
    };
    component.selectTab('settings');
    component.selectSettingsSection('camera');
    spectator.detectChanges();

    component.scanDevices();
    spectator.detectChanges();
    const result = component.scanResults()[0];
    component.prepareManualFromScan(result);
    spectator.detectChanges();

    expect(spectator.query('.scan-credential-form')).toHaveText('用户名');
    expect(spectator.query('.scan-credential-form')).toHaveText('密码');
    expect(spectator.query('.scan-credential-form')).toHaveText('接入摄像头');
    expect(spectator.query('.password-visibility-button')).toExist();

    const passwordInput = spectator.query<HTMLInputElement>('.scan-credential-form input[formcontrolname="password"]');
    expect(passwordInput?.type).toBe('password');
    component.toggleScanCredentialPasswordVisible();
    spectator.detectChanges();
    expect(spectator.query<HTMLInputElement>('.scan-credential-form input[formcontrolname="password"]')?.type).toBe('text');

    component.scanCredentialForm.patchValue({ username: 'admin', password: 'secret' });
    component.connectScanResult(result);

    expect(api.addManualDevice).toHaveBeenCalledWith({
      name: 'Camera 192.168.3.231',
      room: null,
      ip: '192.168.3.231',
      path: '/stream1',
      snapshot_url: null,
      username: 'admin',
      password: 'secret',
      port: 554,
    });
  });

  it('keeps scan credential failures visible on the scan result row', () => {
    api.scanDevices = jest.fn(() => of({
      scanned_hosts: 1,
      devices: [],
      defaults: {
        cidr: '192.168.3.0/24',
        discovery: 'RTSP',
        rtsp_port: 554,
        rtsp_username: 'admin',
      },
      results: [{
        candidate_id: 'rtsp-192-168-3-231',
        device_id: null,
        name: 'Camera 192.168.3.231',
        room: '待识别',
        ip: '192.168.3.231',
        port: 554,
        protocol: 'RTSP / 需密码',
        note: '摄像头需要密码。',
        reachable: false,
        registered: false,
        requires_auth: true,
        rtsp_paths: ['/stream1'],
      }],
    }));
    api.addManualDevice = jest.fn(() => throwError(() => ({ error: { error: 'RTSP authentication failed' } })));

    spectator = createComponent();
    const component = spectator.component as unknown as {
      selectTab: (tab: 'settings') => void;
      selectSettingsSection: (section: 'camera') => void;
      scanDevices: () => void;
      scanResults: () => Array<{
        candidate_id: string;
        name: string;
        room: string;
        ip: string;
        port: number;
        rtsp_paths?: string[];
      }>;
      prepareManualFromScan: (result: unknown) => void;
      scanCredentialForm: { patchValue: (value: { username: string; password: string }) => void };
      connectScanResult: (result: unknown) => void;
    };
    component.selectTab('settings');
    component.selectSettingsSection('camera');
    spectator.detectChanges();

    component.scanDevices();
    spectator.detectChanges();
    const result = component.scanResults()[0];
    component.prepareManualFromScan(result);
    component.scanCredentialForm.patchValue({ username: 'admin', password: 'bad-secret' });
    component.connectScanResult(result);
    spectator.detectChanges();

    expect(spectator.query('.scan-credential-form')).toHaveText('RTSP authentication failed');
    expect(spectator.query('.scan-credential-form')).toHaveText('接入摄像头');
  });

  it('requires a second click before deleting a camera and uses readable confirmation controls', () => {
    const device = {
      device_id: 'cam-tp1',
      name: 'TP1',
      room: '客厅',
      ip_address: '192.168.3.231',
      status: 'ready',
      vendor: 'TP-Link',
      model: 'Tapo',
      discovery_source: 'manual',
    };
    api.getState = jest.fn(() => of({
      devices: [device],
      defaults: {
        selected_camera_device_id: null,
        cidr: '192.168.3.0/24',
        rtsp_port: 554,
      },
      writable_root: '/var/lib/harbor',
    }));
    api.deleteDevice = jest.fn(() => of({
      devices: [],
      defaults: {
        selected_camera_device_id: null,
        rtsp_username: 'admin',
        rtsp_password: '',
      },
      writable_root: '/var/lib/harbor',
    }));

    spectator = createComponent();
    const component = spectator.component as unknown as {
      selectTab: (tab: 'settings') => void;
      selectSettingsSection: (section: 'camera') => void;
    };
    component.selectTab('settings');
    component.selectSettingsSection('camera');
    spectator.detectChanges();

    const deleteButton = spectator.queryAll<HTMLButtonElement>('.device-actions button')
      .find((button) => button.textContent?.includes('删除'));
    expect(deleteButton).toBeTruthy();
    expect(deleteButton?.classList.contains('delete-button')).toBe(true);
    expect(deleteButton?.getAttribute('color')).toBeNull();
    spectator.click(deleteButton);
    spectator.detectChanges();

    expect(api.deleteDevice).not.toHaveBeenCalled();
    const confirmButton = spectator.query<HTMLButtonElement>('.confirm-delete-button');
    expect(confirmButton).toHaveText('确认删除');
    expect(confirmButton?.getAttribute('color')).toBeNull();
    expect(spectator.element.textContent).toContain('取消');

    spectator.click(confirmButton);
    expect(api.deleteDevice).toHaveBeenCalledWith('cam-tp1');
  });

  it('shows cloud API settings only in the cloud subtab', () => {
    spectator = createComponent();
    spectator.detectChanges();

    expect(spectator.query('[formcontrolname="baseUrl"]')).not.toExist();

    const component = spectator.component as unknown as {
      selectAiSettingsTab: (tab: 'cloud-api') => void;
    };
    component.selectAiSettingsTab('cloud-api');
    spectator.detectChanges();

    expect(spectator.query('mat-select[formcontrolname="provider"]')).toExist();
    expect(spectator.query('[formcontrolname="baseUrl"]')).toExist();
    expect(spectator.query('.cloud-api-panel')?.textContent?.toLowerCase()).not.toContain('fallback order');
  });

  it('saves API key settings without echoing or clearing an existing key', () => {
    spectator = createComponent();

    const component = spectator.component as unknown as {
      selectAiSettingsTab: (tab: 'cloud-api') => void;
      cloudApiForm: {
        patchValue: (value: Record<string, unknown>) => void;
      };
      saveCloudApiSettings: () => void;
    };
    component.selectAiSettingsTab('cloud-api');
    component.cloudApiForm.patchValue({
      provider: 'siliconflow',
      baseUrl: 'https://api.siliconflow.cn/v1',
      modelName: 'deepseek-ai/DeepSeek-V4-Flash',
      apiKey: '',
      usageMode: 'selected_capabilities',
      allowQuestionUnderstanding: true,
      allowAnswer: false,
    });
    component.saveCloudApiSettings();

    expect(api.updateModelEndpoint).toHaveBeenCalledWith('llm-cloud-siliconflow', expect.objectContaining({
      metadata: expect.objectContaining({
        api_key_configured: true,
        base_url: 'https://api.siliconflow.cn/v1',
      }),
    }));
    const payload = api.updateModelEndpoint.mock.calls[0][1] as { metadata: Record<string, unknown> };
    expect(payload.metadata.api_key).toBeUndefined();
    expect(api.saveModelPolicies).toHaveBeenCalledWith(expect.objectContaining({
      route_policies: expect.arrayContaining([
        expect.objectContaining({
          route_policy_id: 'semantic.router',
          privacy_level: 'allow_redacted_cloud',
          fallback_order: ['local', 'sidecar', 'cloud'],
        }),
        expect.objectContaining({
          route_policy_id: 'retrieval.answer',
          privacy_level: 'strict_local',
          fallback_order: ['local', 'sidecar'],
        }),
      ]),
    }));
  });
});

function harborDeskApiMock(): Partial<Record<keyof HarborDeskApiService, jest.Mock>> {
  const statusComponent = { status: 'ready', summary: 'ready', detail: 'ready', evidence: [] };
  return {
    getState: jest.fn(() => of({ devices: [], defaults: {}, writable_root: '/var/lib/harbor' })),
    scanDevices: jest.fn((payload) => of(payload)),
    deleteDevice: jest.fn(() => of({ devices: [], defaults: {}, writable_root: '/var/lib/harbor' })),
    getDeviceEvidence: jest.fn(() => of({ results: [] })),
    getGatewayStatus: jest.fn(() => of({ status: 'ready', channels: [] })),
    getInferenceHealth: jest.fn(() => of({ status: 'ready', ready: true })),
    getNotificationTargets: jest.fn(() => of({ targets: [] })),
    setDefaultNotificationTarget: jest.fn(() => of({ ok: true })),
    deleteNotificationTarget: jest.fn(() => of({ ok: true })),
    getModelEndpoints: jest.fn(() => of({
      endpoints: [
        modelEndpoint('embedder-local', 'embedder', '/models/embed.gguf'),
        modelEndpoint('llm-local', 'llm', '/models/chat.gguf'),
        {
          ...(modelEndpoint('llm-cloud-siliconflow', 'llm', 'deepseek-ai/DeepSeek-V4-Flash') as Record<string, unknown>),
          endpoint_kind: 'cloud',
          provider_key: 'openai_compatible',
          status: 'active',
          metadata: {
            provider: 'siliconflow',
            provider_label: 'SiliconFlow',
            base_url: 'https://api.siliconflow.cn/v1',
            api_key_configured: true,
          },
        },
      ],
    })),
    createModelEndpoint: jest.fn((payload) => of({ endpoints: [payload] })),
    updateModelEndpoint: jest.fn((id, payload) => of({ endpoints: [{ ...payload, model_endpoint_id: id }] })),
    testModelEndpoint: jest.fn(() => of({ ok: true, status: 'active', summary: 'ok' })),
    getModelCapabilities: jest.fn(() => of({
      generated_at: '1',
      checked_at: '1',
      status: 'ready',
      capabilities: [
        {
          capability_id: 'semantic_router',
          label: '问题理解',
          model_kind: 'llm',
          status: 'ready',
          current_model: {
            model_endpoint_id: 'llm-local',
            model_name: '/models/chat.gguf',
            provider_key: 'local',
            status: 'active',
          },
          installable_models: [],
          download_jobs: [],
          next_action: '可以使用',
          runtime_ready: true,
        },
        {
          capability_id: 'embedder',
          label: '向量检索',
          model_kind: 'embedder',
          status: 'ready',
          current_model: {
            model_endpoint_id: 'embedder-local',
            model_name: '/models/embed.gguf',
            provider_key: 'local',
            status: 'active',
          },
          installable_models: [],
          download_jobs: [],
          next_action: '可以使用',
          runtime_ready: true,
        },
        {
          capability_id: 'retrieval_answer',
          label: '对话回答',
          model_kind: 'llm',
          status: 'ready',
          current_model: {
            model_endpoint_id: 'llm-local',
            model_name: '/models/chat.gguf',
            provider_key: 'local',
            status: 'active',
          },
          installable_models: [],
          download_jobs: [],
          next_action: '可以使用',
          runtime_ready: true,
        },
        {
          capability_id: 'vlm',
          label: '图片/视频理解',
          model_kind: 'vlm',
          status: 'needs_model',
          current_model: null,
          installable_models: [],
          download_jobs: [],
          next_action: '选择或安装模型',
          runtime_ready: false,
        },
      ],
      blockers: [],
      warnings: [],
    })),
    getModelPolicies: jest.fn(() => of({
      route_policies: [
        modelPolicy('semantic.router', 'allow_redacted_cloud', ['local', 'sidecar', 'cloud']),
        modelPolicy('retrieval.answer', 'allow_redacted_cloud', ['local', 'sidecar', 'cloud']),
      ],
    })),
    saveModelPolicies: jest.fn((payload) => of(payload)),
    getLocalModelCatalog: jest.fn(() => of({
      models: [
        {
          model_id: 'harbor-embed-small',
          display_name: 'Harbor Embed Small',
          provider_key: 'local',
          model_kind: 'embedding',
          status: 'installed',
          installed: true,
          local_path: '/models/embed.gguf',
          expected_capabilities: ['embedding'],
          recommended_hardware: 'CPU',
          download_size_hint: '1 GiB',
        },
        {
          model_id: 'harbor-vision-small',
          display_name: 'Harbor Vision Small',
          provider_key: 'local',
          model_kind: 'vlm',
          status: 'available',
          expected_capabilities: ['vision', 'video'],
          recommended_hardware: 'GPU',
          download_size_hint: '4 GiB',
        },
      ],
      download_jobs: [],
    })),
    getLocalModelDownloads: jest.fn(() => of({ jobs: [] })),
    getHardwareReadiness: jest.fn(() => of({
      status: 'ready',
      cpu: statusComponent,
      memory: statusComponent,
      gpu: statusComponent,
      npu: statusComponent,
      recommended_model_profile: 'cpu',
    })),
    getRagReadiness: jest.fn(() => of({
      status: 'ready',
      source_roots: statusComponent,
      index_directory: statusComponent,
      embedding_model: statusComponent,
      media_parser: statusComponent,
      storage_writable: statusComponent,
      capability_profiles: [],
      blockers: [],
      warnings: [],
    })),
    getKnowledgeSettings: jest.fn(() => of({
      source_roots: [
        { root_id: 'nas', label: 'NAS Library', path: '/mnt/pool/library', enabled: true, include: [], exclude: [] },
      ],
      index_root: '/var/lib/harbor/index',
      privacy_level: 'strict_local',
      default_resource_profile: 'cpu_only',
    })),
    getKnowledgeIndexStatus: jest.fn(() => of({
      status: 'ready',
      index_root_writable: true,
      source_roots: [
        { root_id: 'nas', path: '/mnt/pool/library', enabled: true, exists: true, status: 'ready' },
      ],
      image_count: 1,
      content_indexed_image_count: 1,
      vlm_indexed_image_count: 1,
      image_content_missing_count: 0,
      blockers: [],
    })),
    saveKnowledgeSettings: jest.fn((payload) => of(payload)),
    runKnowledgeIndex: jest.fn(() => of({ status: 'started' })),
    createLocalModelDownload: jest.fn((payload) => of({ job: { job_id: 'job-1', model_id: payload.model_id, status: 'queued' } })),
    cancelLocalModelDownload: jest.fn(() => of({ status: 'canceled' })),
    getDvrRecordingSettings: jest.fn(() => of({ enabled_device_ids: [] })),
    getDvrRecordingStatus: jest.fn(() => of({ statuses: [] })),
    getDvrTimeline: jest.fn(() => of({ segments: [] })),
    getHarborOsStatus: jest.fn(() => of({
      status: 'ready',
      version: '26.04',
      webui_url: 'https://192.168.3.82/ui',
      system_domain_only: true,
      services: [],
      jobs_alerts: harborOsService('jobs-alerts'),
      storage_files_entry: harborOsService('storage-files-entry'),
      blockers: [],
    })),
    getHarborOsImCapabilityMap: jest.fn(() => of({ items: [] })),
    getShareLinks: jest.fn(() => of([])),
  };
}

function modelCapabilitiesWithEmbedder(embedderOverrides: Record<string, unknown>): unknown {
  const llmCurrentModel = {
    model_endpoint_id: 'llm-local',
    model_name: '/models/chat.gguf',
    provider_key: 'local',
    status: 'active',
  };
  const embedder = {
    capability_id: 'embedder',
    label: '向量检索',
    model_kind: 'embedder',
    status: 'ready',
    current_model: {
      model_endpoint_id: 'embedder-local',
      model_name: '/models/embed.gguf',
      provider_key: 'local',
      status: 'active',
    },
    installed_models: [],
    installable_models: [],
    download_jobs: [],
    next_action: '可以使用',
    runtime_ready: true,
    ...embedderOverrides,
  };
  return {
    generated_at: '1',
    checked_at: '1',
    status: 'ready',
    capabilities: [
      {
        capability_id: 'semantic_router',
        label: '问题理解',
        model_kind: 'llm',
        status: 'ready',
        current_model: llmCurrentModel,
        installable_models: [],
        download_jobs: [],
        next_action: '可以使用',
        runtime_ready: true,
      },
      embedder,
      {
        capability_id: 'retrieval_answer',
        label: '对话回答',
        model_kind: 'llm',
        status: 'ready',
        current_model: llmCurrentModel,
        installable_models: [],
        download_jobs: [],
        next_action: '可以使用',
        runtime_ready: true,
      },
      {
        capability_id: 'vlm',
        label: '图片/视频理解',
        model_kind: 'vlm',
        status: 'needs_model',
        current_model: null,
        installable_models: [],
        download_jobs: [],
        next_action: '选择或安装模型',
        runtime_ready: false,
      },
    ],
    blockers: [],
    warnings: [],
  };
}

function qwenCatalogModel(overrides: Record<string, unknown> = {}): unknown {
  return {
    model_id: 'Qwen/Qwen3.5-4B',
    display_name: 'Qwen3.5 4B',
    provider_key: 'qwen',
    model_kind: 'embedder',
    source_kind: 'huggingface',
    status: 'needs-config',
    installable: true,
    manual_only: false,
    repo_id: 'Qwen/Qwen3.5-4B',
    revision: 'main',
    file_policy: 'runtime_snapshot',
    expected_capabilities: ['embedder'],
    recommended_hardware: 'GPU',
    download_size_hint: '4 GiB',
    ...overrides,
  };
}

function modelEndpoint(id: string, kind: string, modelName: string): unknown {
  return {
    model_endpoint_id: id,
    workspace_id: null,
    provider_account_id: null,
    model_kind: kind,
    endpoint_kind: 'local',
    provider_key: 'local',
    model_name: modelName,
    capability_tags: [kind],
    cost_policy: {},
    status: 'active',
    metadata: { local_path: modelName },
  };
}

function modelPolicy(routePolicyId: string, privacyLevel: string, fallbackOrder: string[]): unknown {
  return {
    route_policy_id: routePolicyId,
    workspace_id: 'home-1',
    domain_scope: routePolicyId === 'semantic.router' ? 'semantic' : 'retrieval',
    modality: 'text',
    privacy_level: privacyLevel,
    local_preferred: true,
    max_cost_per_run: null,
    fallback_order: fallbackOrder,
    status: 'active',
    metadata: {},
  };
}

function harborOsService(id: string): unknown {
  return {
    service_id: id,
    label: id,
    status: 'ready',
    detail: 'ready',
  };
}
