import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
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

    expect(spectator.query('.ai-settings-card')).toExist();
    expect(spectator.query('.ai-settings-subtabs')).toHaveText('数据源');
    expect(spectator.query('.ai-settings-subtabs')).toHaveText('模型');
    expect(spectator.query('.ai-settings-subtabs')).toHaveText('云端 API');
    expect(spectator.query('.workflow-stepper')).not.toExist();
    expect(spectator.query('.model-library-card')).not.toExist();
    expect(spectator.element.textContent?.toLowerCase()).not.toContain('endpoint');
    expect(spectator.element.textContent?.toLowerCase()).not.toContain('fallback order');
  });

  it('opens the model subtab and shows product capability names', () => {
    spectator = createComponent();

    spectator.click(spectator.queryAll('.ai-settings-subtab')[1]);
    spectator.detectChanges();

    const panel = spectator.query('.model-capability-list');
    expect(panel).toHaveText('问题理解');
    expect(panel).toHaveText('向量检索');
    expect(panel).toHaveText('对话回答');
    expect(panel).toHaveText('图片/视频理解');
    expect(panel).toHaveText('文字识别');
    expect(panel).toHaveText('语音转文字');
    expect(panel).not.toHaveText('事件检测');
    expect(panel?.textContent?.toLowerCase()).not.toContain('detector');
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { tab: 'models', focus: 'models' },
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
    getHarborOsStatus: jest.fn(() => of({ status: 'ready', services: [] })),
    getHarborOsImCapabilityMap: jest.fn(() => of({ items: [] })),
    getShareLinks: jest.fn(() => of([])),
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
