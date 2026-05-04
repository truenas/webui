import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of, Subject } from 'rxjs';
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

  it('guides the user when a selected local model is not loaded by the runtime yet', () => {
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
    expect(spectator.element.textContent).toContain('需要配置或启动兼容运行时后才会生效');
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
