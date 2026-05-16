import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { Observable, forkJoin, of, timer } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { HarborAssistantCameraComponent } from 'app/pages/harbor-assistant/camera/harbor-assistant-camera.component';
import { HarborAssistantHomeAssistantComponent } from 'app/pages/harbor-assistant/home-assistant/harbor-assistant-home-assistant.component';
import { HarborAssistantSearchComponent } from 'app/pages/harbor-assistant/search/harbor-assistant-search.component';
import {
  FolderPickerDialogComponent,
  FolderPickerDialogData,
  FolderPickerDialogResult,
} from 'app/pages/file-manager/folder-picker-dialog/folder-picker-dialog.component';
import {
  AdminDefaultsPayload,
  AdminStateResponse,
  AutomationRuleReview,
  AutomationReviewsResponse,
  CameraDevice,
  DeviceCredentialStatus,
  DeviceCredentialsPayload,
  DeviceEvidenceResponse,
  DeviceEvidenceResult,
  DiscoveryScanResponse,
  DiscoveryScanResultItem,
  DvrRecordingSettings,
  DvrRecordingStatus,
  DvrRecordingStatusResponse,
  DvrTimelineResponse,
  DvrTimelineSegment,
  EndpointResult,
  FilesBrowseResponse,
  GatewayPlatformStatus,
  GatewayStatusResponse,
  HarborAssistantMetric,
  HarborAssistantStatusTone,
  HarborAssistantTab,
  HarborAssistantTabId,
  HarborOsImCapabilityItem,
  HarborOsImCapabilityMapResponse,
  HarborOsServiceStatus,
  HarborOsStatusResponse,
  HardwareReadinessComponent,
  HardwareReadinessResponse,
  InferenceHealthResponse,
  KnowledgeIndexRootStatus,
  KnowledgeIndexStatusResponse,
  KnowledgeSettings,
  KnowledgeSourceRoot,
  LocalModelCatalogItem,
  LocalModelCatalogResponse,
  LocalModelDownloadJob,
  LocalModelDownloadsResponse,
  ModelCapabilitiesResponse,
  ModelCapabilityInstallableModel,
  ModelCapabilityStatus,
  ModelEndpointPayload,
  ModelEndpointRecord,
  ModelEndpointsResponse,
  ModelPoliciesResponse,
  ModelRoutePolicyRecord,
  NotificationTargetRecord,
  NotificationTargetsResponse,
  RagReadinessComponent,
  RagReadinessResponse,
  ShareLinkSummary,
} from 'app/pages/harbor-assistant/interfaces/harbor-assistant-status.interface';
import { HarborAssistantApiService } from 'app/pages/harbor-assistant/services/harbor-assistant-api.service';
import { harborGateConnectorManageUrl, harborGateConnectorSetupUrl } from 'app/pages/harbor-assistant/utils/harborgate-urls';

interface HarborAssistantPageData {
  state: EndpointResult<AdminStateResponse>;
  gatewayStatus: EndpointResult<GatewayStatusResponse>;
  inferenceHealth: EndpointResult<InferenceHealthResponse>;
  notificationTargets: EndpointResult<NotificationTargetsResponse>;
  modelEndpoints: EndpointResult<ModelEndpointsResponse>;
  modelCapabilities: EndpointResult<ModelCapabilitiesResponse>;
  modelPolicies: EndpointResult<ModelPoliciesResponse>;
  localCatalog: EndpointResult<LocalModelCatalogResponse>;
  localDownloads: EndpointResult<LocalModelDownloadsResponse>;
  hardware: EndpointResult<HardwareReadinessResponse>;
  rag: EndpointResult<RagReadinessResponse>;
  knowledgeSettings: EndpointResult<KnowledgeSettings>;
  knowledgeIndexStatus: EndpointResult<KnowledgeIndexStatusResponse>;
  dvrSettings: EndpointResult<DvrRecordingSettings>;
  dvrStatus: EndpointResult<DvrRecordingStatusResponse>;
  dvrTimeline: EndpointResult<DvrTimelineResponse>;
  harborOs: EndpointResult<HarborOsStatusResponse>;
  capabilityMap: EndpointResult<HarborOsImCapabilityMapResponse>;
  shareLinks: EndpointResult<ShareLinkSummary[]>;
  automationReviews: EndpointResult<AutomationReviewsResponse>;
  evidenceByDevice: Record<string, DeviceEvidenceResponse>;
  evidenceErrors: Record<string, string>;
}

type DeviceEvidenceEntry = readonly [string, DeviceEvidenceResponse | null, string | null];

interface ProtocolOption {
  label: string;
  value: string;
}

interface ConnectorCard {
  id: string;
  label: string;
  status: string;
  detail: string;
  configured: boolean;
  connected: boolean;
  setupUrl: string | null;
  manageUrl: string | null;
  lastCheckedAt: string | null;
  tone: HarborAssistantStatusTone;
}

interface StatusBlock {
  id: string;
  label: string;
  status: string;
  summary: string;
  detail: string;
  evidence: string[];
  tone: HarborAssistantStatusTone;
}

type CustomerModelSection = 'downloading' | 'installed' | 'available';
type CustomerModelAction = 'download' | 'downloading' | 'set-current' | 'current' | 'retry' | 'configure-cloud' | 'manual-source';

interface CurrentModelCard {
  kind: string;
  label: string;
  modelName: string;
  providerKey: string;
  status: string;
  tone: HarborAssistantStatusTone;
  baseUrl: string;
  localPath: string;
  endpoint: ModelEndpointRecord | null;
}

interface CustomerModelCard {
  key: string;
  modelId: string;
  capabilityId?: string | null;
  displayName: string;
  providerKey: string;
  kind: string;
  source: string;
  capabilities: string[];
  sizeHint: string;
  hardware: string;
  hardwareFit: string;
  fitReason: string;
  recommendationGroup: string;
  status: string;
  tone: HarborAssistantStatusTone;
  localPath: string | null;
  downloadJob: LocalModelDownloadJob | null;
  endpoint: ModelEndpointRecord | null;
  action: CustomerModelAction;
  actionLabel: string;
  progressLabel: string | null;
  bytesLabel: string | null;
  speedLabel: string | null;
  errorMessage: string | null;
  runtimeGuidance: string | null;
  evidence: string[];
  section: CustomerModelSection;
  catalogModel: LocalModelCatalogItem | null;
}

interface RagValidationStat {
  id: string;
  label: string;
  value: string;
  tone: HarborAssistantStatusTone;
}

interface RagSourceRootSummary {
  total: number;
  enabled: number;
  existing: number;
  status: string;
  tone: HarborAssistantStatusTone;
}

type AiSettingsTabId = 'sources' | 'models' | 'cloud-api';
type AssistantSettingsSectionId = 'ai' | 'camera';
type CloudUsageMode = 'local_only' | 'local_first_cloud' | 'selected_capabilities';
type CloudCapabilityId = 'semantic_router' | 'retrieval_answer';

interface AiSettingsTab {
  id: AiSettingsTabId;
  label: string;
  summary: string;
  tone: HarborAssistantStatusTone;
}

interface AssistantSettingsSection {
  id: AssistantSettingsSectionId;
  label: string;
  detail: string;
}

interface AiWorkflowSummary {
  label: string;
  detail: string;
  tone: HarborAssistantStatusTone;
}

interface AiModelCapability {
  id: string;
  capabilityId: string;
  label: string;
  detail: string;
  kind: string;
  optional: boolean;
  cloudCapability: CloudCapabilityId | null;
}

interface CloudProviderOption {
  value: string;
  label: string;
  endpointId: string;
  defaultBaseUrl: string;
  defaultModelName: string;
}

interface CameraNameDialogData {
  name: string;
  room: string;
}

interface CameraNameDialogResult {
  name: string;
  room: string | null;
}

@Component({
  selector: 'ix-camera-name-dialog',
  template: `
    <h2 mat-dialog-title>{{ 'Edit camera' | translate }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="camera-name-dialog-content">
        <mat-form-field>
          <mat-label>{{ 'Location' | translate }}</mat-label>
          <input matInput formControlName="room" placeholder="Living room" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>{{ 'Name' | translate }}</mat-label>
          <input matInput formControlName="name" placeholder="TP1" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">{{ 'Cancel' | translate }}</button>
        <button mat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ 'Save' | translate }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .camera-name-dialog-content {
      display: grid;
      gap: 12px;
      min-width: min(420px, 80vw);
      padding-top: 8px;
    }
    mat-form-field {
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
class CameraNameDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject<MatDialogRef<CameraNameDialogComponent, CameraNameDialogResult>>(MatDialogRef);
  private readonly data = inject<CameraNameDialogData>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.group({
    room: [this.data.room],
    name: [this.data.name, Validators.required],
  });

  protected close(): void {
    this.dialogRef.close();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      name: value.name.trim(),
      room: value.room.trim() || null,
    });
  }
}

// Dynamic template expressions that ngx-translate-extract does not reliably discover.
export const harborAssistantI18nMarkers = [
  T('Add Endpoint'),
  T('Capturing'),
  T('Configured; leave blank to keep'),
  T('Core capability'),
  T('Edit Endpoint'),
  T('Finalizing'),
  T('Health Test'),
  T('Indexing...'),
  T('No target path'),
  T('Optional capability'),
  T('Record'),
  T('Refresh cameras'),
  T('Save Endpoint'),
  T('Searching'),
  T('Start indexing'),
  T('Stop recording'),
  T('Test'),
  T('Testing...'),
  T('default'),
] as const;

@Component({
  selector: 'ix-harbor-assistant',
  templateUrl: './harbor-assistant.component.html',
  styleUrls: ['./harbor-assistant.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatAnchor,
    MatButton,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatCheckbox,
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    MatSuffix,
    MatOption,
    MatSelect,
    NgClass,
    HarborAssistantSearchComponent,
    HarborAssistantCameraComponent,
    HarborAssistantHomeAssistantComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
    TnIconComponent,
    TranslateModule,
  ],
})
export class HarborAssistantComponent implements OnInit {
  private harborAssistantApi = inject(HarborAssistantApiService);
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private matDialog = inject(MatDialog);

  protected readonly tabs: HarborAssistantTab[] = [
    { id: 'search', label: T('Search'), detail: '' },
    { id: 'camera', label: T('Camera'), detail: '' },
    { id: 'messages', label: T('Message connections'), detail: '' },
    { id: 'home-assistant', label: T('Home Assistant'), detail: '' },
    { id: 'settings', label: T('Settings'), detail: '' },
  ];

  protected readonly settingsSections: AssistantSettingsSection[] = [
    { id: 'ai', label: T('AI settings'), detail: '' },
    { id: 'camera', label: T('Camera settings'), detail: '' },
  ];

  protected readonly activeTab = signal<HarborAssistantTabId>('search');
  protected readonly activeSettingsSection = signal<AssistantSettingsSectionId>('ai');
  protected readonly activeTabDetail = computed(() => {
    return this.tabs.find((tab) => tab.id === this.activeTab())?.detail ?? T('Harbor Assistant settings');
  });
  protected readonly activeSettingsSectionDetail = computed(() => {
    return this.settingsSections.find((section) => section.id === this.activeSettingsSection())?.detail
      ?? T('Assistant settings');
  });
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly endpointErrors = signal<Record<string, string>>({});
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionInProgress = signal<string | null>(null);
  protected readonly optimisticDefaultNotificationTargetId = signal<string | null>(null);
  protected readonly state = signal<AdminStateResponse | null>(null);
  protected readonly gatewayStatus = signal<GatewayStatusResponse | null>(null);
  protected readonly inferenceHealth = signal<InferenceHealthResponse | null>(null);
  protected readonly notificationTargetsResponse = signal<NotificationTargetsResponse | null>(null);
  protected readonly modelEndpointsResponse = signal<ModelEndpointsResponse | null>(null);
  protected readonly modelCapabilitiesResponse = signal<ModelCapabilitiesResponse | null>(null);
  protected readonly modelPoliciesResponse = signal<ModelPoliciesResponse | null>(null);
  protected readonly localCatalog = signal<LocalModelCatalogResponse | null>(null);
  protected readonly localDownloads = signal<LocalModelDownloadsResponse | null>(null);
  protected readonly hardware = signal<HardwareReadinessResponse | null>(null);
  protected readonly rag = signal<RagReadinessResponse | null>(null);
  protected readonly knowledgeSettings = signal<KnowledgeSettings | null>(null);
  protected readonly knowledgeIndexStatus = signal<KnowledgeIndexStatusResponse | null>(null);
  protected readonly dvrSettings = signal<DvrRecordingSettings | null>(null);
  protected readonly dvrStatus = signal<DvrRecordingStatusResponse | null>(null);
  protected readonly dvrTimeline = signal<DvrTimelineResponse | null>(null);
  protected readonly filesBrowse = signal<FilesBrowseResponse | null>(null);
  protected readonly sourcePickerEditingRoot = signal<KnowledgeSourceRoot | null>(null);
  protected readonly harborOs = signal<HarborOsStatusResponse | null>(null);
  protected readonly capabilityMap = signal<HarborOsImCapabilityMapResponse | null>(null);
  protected readonly shareLinks = signal<ShareLinkSummary[]>([]);
  protected readonly automationReviews = signal<AutomationRuleReview[]>([]);
  protected readonly rulesDrawerOpen = signal(false);
  protected readonly evidenceByDevice = signal<Record<string, DeviceEvidenceResponse>>({});
  protected readonly selectedDeviceId = signal<string>('');
  protected readonly pendingDeleteDeviceId = signal<string | null>(null);
  protected readonly scanResults = signal<DiscoveryScanResultItem[]>([]);
  protected readonly scanCredentialCandidateId = signal<string | null>(null);
  protected readonly scanCredentialError = signal<string | null>(null);
  protected readonly scanCredentialPasswordVisible = signal(false);
  protected readonly activeAiSettingsTab = signal<AiSettingsTabId>('sources');
  protected readonly modelEndpointEditingId = signal<string | null>(null);
  protected readonly modelsAdvancedOpen = signal(false);
  protected readonly modelLibraryOpen = signal(false);
  protected readonly modelLibraryKind = signal<string | null>(null);
  protected readonly modelLibraryCapabilityId = signal<string | null>(null);
  protected readonly modelChooserCapabilityId = signal<string | null>(null);
  protected readonly manualModelDownloadCapabilityId = signal<string | null>(null);
  private readonly downloadPollInProgress = signal(false);

  protected readonly protocolOptions: ProtocolOption[] = [
    { label: T('RTSP'), value: 'rtsp' },
    { label: T('ONVIF'), value: 'onvif' },
    { label: T('Auto'), value: 'auto' },
  ];

  protected readonly knowledgePrivacyOptions: ProtocolOption[] = [
    { label: T('Strict local'), value: 'strict_local' },
    { label: T('Allow redacted cloud'), value: 'allow_redacted_cloud' },
    { label: T('Allow cloud'), value: 'allow_cloud' },
  ];

  protected readonly knowledgeResourceOptions: ProtocolOption[] = [
    { label: T('CPU only'), value: 'cpu_only' },
    { label: T('Local GPU'), value: 'local_gpu' },
    { label: T('Sidecar GPU'), value: 'sidecar_gpu' },
    { label: T('Cloud allowed'), value: 'cloud_allowed' },
  ];

  protected readonly cloudProviderOptions: CloudProviderOption[] = [
    {
      value: 'siliconflow',
      label: T('SiliconFlow'),
      endpointId: 'llm-cloud-siliconflow',
      defaultBaseUrl: 'https://api.siliconflow.cn/v1',
      defaultModelName: 'deepseek-ai/DeepSeek-V4-Flash',
    },
    {
      value: 'openrouter',
      label: T('OpenRouter'),
      endpointId: 'llm-cloud-openrouter',
      defaultBaseUrl: 'https://openrouter.ai/api/v1',
      defaultModelName: 'openai/gpt-4o-mini',
    },
    {
      value: 'custom_openai_compatible',
      label: T('Custom OpenAI-compatible'),
      endpointId: 'llm-cloud-openai-compatible-custom',
      defaultBaseUrl: '',
      defaultModelName: '',
    },
  ];

  protected readonly cloudUsageOptions: ProtocolOption[] = [
    { label: T('Use local models only'), value: 'local_only' },
    { label: T('Local first; allow cloud on failure'), value: 'local_first_cloud' },
    { label: T('Use cloud API for selected capabilities'), value: 'selected_capabilities' },
  ];

  protected readonly dvrSegmentOptions: ProtocolOption[] = [
    { label: T('30 seconds'), value: '30' },
    { label: T('1 minute'), value: '60' },
    { label: T('5 minutes'), value: '300' },
  ];

  protected readonly scanForm = this.fb.group({
    cidr: [''],
    protocol: ['rtsp'],
    rtspPort: ['554'],
    username: [''],
    password: [''],
  });

  protected readonly scanCredentialForm = this.fb.group({
    username: [''],
    password: ['', Validators.required],
  });

  protected readonly ruleDraftForm = this.fb.group({
    prompt: ['', Validators.required],
  });

  protected readonly manualForm = this.fb.group({
    name: ['', Validators.required],
    room: [''],
    ip: ['', Validators.required],
    path: [''],
    snapshotUrl: [''],
    username: [''],
    password: [''],
    port: ['554'],
  });

  protected readonly credentialsForm = this.fb.group({
    username: [''],
    password: [''],
    rtspPort: ['554'],
    rtspPaths: [''],
  });

  protected readonly defaultsForm = this.fb.group({
    cidr: [''],
    discovery: [''],
    recording: [''],
    capture: [''],
    ai: [''],
    notificationChannel: [''],
    rtspUsername: [''],
    rtspPassword: [''],
    rtspPort: ['554'],
    rtspPaths: [''],
    selectedCameraDeviceId: [''],
    captureSubdirectory: [''],
    clipLengthSeconds: ['30'],
    keyframeCount: ['3'],
    keyframeIntervalSeconds: ['5'],
  });

  protected readonly dvrForm = this.fb.group({
    recordingRoot: [''],
    mediaLibraryRoot: [''],
    retentionDays: ['7'],
    segmentSeconds: ['60'],
    continuousRecordingEnabled: [true],
    lowBitrateStreamPreferred: [true],
    continuousBitrateMbps: ['2'],
    diskBudgetGb: ['64'],
    continuousStreamPathHint: [''],
    highResStreamPathHint: [''],
    highResEventClipsEnabled: [false],
    highResEventClipSeconds: ['20'],
    keyframeCount: ['3'],
    keyframeIntervalSeconds: ['5'],
    enabledDeviceIds: [[] as string[]],
  });

  protected readonly metadataForm = this.fb.group({
    name: [''],
    room: [''],
    vendor: [''],
    model: [''],
    ipAddress: [''],
    snapshotUrl: [''],
    primaryStreamUrl: [''],
    rtspPath: [''],
    rtspPort: ['554'],
    requiresAuth: [''],
  });

  protected readonly modelEndpointForm = this.fb.group({
    modelEndpointId: ['', Validators.required],
    modelKind: ['llm'],
    endpointKind: ['local'],
    providerKey: ['local'],
    modelName: ['', Validators.required],
    status: ['active'],
    capabilityTags: ['chat'],
    baseUrl: [''],
    healthzUrl: [''],
    apiKey: [''],
  });

  protected readonly downloadForm = this.fb.group({
    modelId: ['', Validators.required],
    displayName: [''],
    providerKey: [''],
    targetPath: [''],
    sourceUrl: [''],
  });

  protected readonly policyForm = this.fb.group({
    routePolicyId: [''],
    fallbackOrder: [''],
    status: ['active'],
    localPreferred: ['true'],
  });

  protected readonly cloudApiForm = this.fb.group({
    provider: ['siliconflow'],
    baseUrl: ['https://api.siliconflow.cn/v1', Validators.required],
    modelName: ['deepseek-ai/DeepSeek-V4-Flash', Validators.required],
    apiKey: [''],
    usageMode: ['local_only'],
    allowQuestionUnderstanding: [true],
    allowAnswer: [true],
  });

  protected readonly knowledgeSourceForm = this.fb.group({
    rootId: [''],
    label: [''],
    path: ['', Validators.required],
    enabled: [true],
    include: [''],
    exclude: [''],
  });

  protected readonly knowledgeIndexForm = this.fb.group({
    indexRoot: [''],
    privacyLevel: ['strict_local'],
    resourceProfile: ['cpu_only'],
  });

  protected readonly devices = computed(() => this.state()?.devices ?? []);
  protected readonly defaults = computed(() => this.state()?.defaults ?? {});
  protected readonly dvrTimelineSegments = computed(() => this.dvrTimeline()?.segments ?? []);
  protected readonly modelEndpoints = computed(() => this.modelEndpointsResponse()?.endpoints ?? []);
  protected readonly modelPolicies = computed(() => this.modelPoliciesResponse()?.route_policies ?? []);
  protected readonly catalogModels = computed(() => this.localCatalog()?.models ?? []);
  protected readonly downloadJobs = computed(() => this.latestDownloadJobs(
    this.localDownloads()?.jobs ?? this.localCatalog()?.download_jobs ?? [],
  ));
  protected readonly currentModelCards = computed<CurrentModelCard[]>(() => this.buildCurrentModelCards());
  protected readonly customerModelCards = computed<CustomerModelCard[]>(() => this.buildCustomerModelCards());
  protected readonly downloadingModelCards = computed(() => this.customerModelCards().filter((card) => card.section === 'downloading'));
  protected readonly installedModelCards = computed(() => this.customerModelCards().filter((card) => card.section === 'installed'));
  protected readonly availableModelCards = computed(() => this.customerModelCards().filter((card) => card.section === 'available'));
  protected readonly visibleDownloadingModelCards = computed(() => this.filterModelLibraryCards(this.downloadingModelCards()));
  protected readonly visibleInstalledModelCards = computed(() => this.filterModelLibraryCards(this.installedModelCards()));
  protected readonly visibleAvailableModelCards = computed(() => this.filterModelLibraryCards(this.availableModelCards()));
  protected readonly aiSettingsTabs = computed<AiSettingsTab[]>(() => this.buildAiSettingsTabs());
  protected readonly aiModelCapabilities = computed<AiModelCapability[]>(() => this.buildAiModelCapabilities());
  protected readonly aiWorkflowSummary = computed<AiWorkflowSummary>(() => this.buildAiWorkflowSummary());
  protected readonly selectedAiSettingsTab = computed(() => {
    return this.aiSettingsTabs().find((tab) => tab.id === this.activeAiSettingsTab())
      ?? this.aiSettingsTabs()[0]
      ?? null;
  });
  protected readonly ragValidationEndpointCards = computed<CurrentModelCard[]>(() => this.endpointCardsForValidation());
  protected readonly vlmEndpointCard = computed(() => this.currentModelCards().find((card) => card.kind === 'vlm') ?? null);
  protected readonly localVlmModelCard = computed<CustomerModelCard | null>(() => this.findLocalVlmModelCard());
  protected readonly ragValidationImageStats = computed<RagValidationStat[]>(() => this.buildRagValidationImageStats());
  protected readonly ragValidationSourceSummary = computed<RagSourceRootSummary>(() => this.buildRagValidationSourceSummary());
  protected readonly knowledgeSourceRoots = computed(() => this.knowledgeSettings()?.source_roots ?? []);
  protected readonly defaultCamera = computed(() => {
    const selectedCameraId = this.defaults().selected_camera_device_id;
    return this.devices().find((device) => device.device_id === selectedCameraId) ?? null;
  });
  protected readonly selectedDevice = computed(() => {
    const selectedDeviceId = this.selectedDeviceId();
    return this.devices().find((device) => device.device_id === selectedDeviceId) ?? this.devices()[0] ?? null;
  });
  protected readonly isBusy = computed(() => this.actionInProgress() !== null);
  protected readonly metrics = computed<HarborAssistantMetric[]>(() => this.buildMetrics());
  protected readonly connectorCards = computed<ConnectorCard[]>(() => this.buildConnectorCards());
  protected readonly weixinConnector = computed(() => this.connectorCards().find((card) => card.id === 'weixin') ?? null);
  protected readonly weixinSetupUrl = computed(() => this.weixinConnector()?.setupUrl ?? '/api/harbor-gate/setup/weixin');
  protected readonly weixinManageUrl = computed(() => this.weixinConnector()?.manageUrl ?? '/api/harbor-gate/admin/im/weixin');
  protected readonly configuredConnectorCount = computed(() => this.connectorCards().filter((card) => card.configured).length);
  protected readonly notificationTargets = computed(() => {
    return this.notificationTargetsResponse()?.targets
      ?? this.state()?.account_management?.notification_targets
      ?? [];
  });
  protected readonly defaultNotificationTarget = computed(() => {
    const optimisticTargetId = this.optimisticDefaultNotificationTargetId();
    if (optimisticTargetId) {
      const optimisticTarget = this.notificationTargets().find((target) => target.target_id === optimisticTargetId);
      if (optimisticTarget) {
        return optimisticTarget;
      }
    }
    return this.notificationTargets().find((target) => target.is_default)
      ?? this.notificationTargets()[0]
      ?? null;
  });
  protected readonly hardwareBlocks = computed<StatusBlock[]>(() => this.buildHardwareBlocks());
  protected readonly ragBlocks = computed<StatusBlock[]>(() => this.buildRagBlocks());
  protected readonly harborOsBlocks = computed<StatusBlock[]>(() => this.buildHarborOsBlocks());
  protected readonly pendingRuleReviews = computed(() => this.automationReviews().filter((review) => {
    return review.status === 'draft' || review.status === 'pending';
  }));
  protected readonly activeRuleReviews = computed(() => this.automationReviews().filter((review) => {
    return review.status === 'active' || review.status === 'paused';
  }));
  protected readonly archivedRuleReviews = computed(() => this.automationReviews().filter((review) => {
    return review.status === 'discarded' || review.status === 'expired';
  }));
  protected readonly pendingRuleCount = computed(() => this.pendingRuleReviews().length);

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const rawTab = params.get('tab');
        const focusValue = params.get('focus') ?? params.get('node');
        if (!rawTab && !params.get('section') && !focusValue) {
          this.activeTab.set('search');
          this.activeSettingsSection.set('ai');
          this.activeAiSettingsTab.set('sources');
          return;
        }
        const tab = this.normalizeTab(rawTab);
        if (tab) {
          this.activeTab.set(tab);
        }
        const settingsSection = this.normalizeSettingsSection(params.get('section'));
        if (settingsSection) {
          this.activeTab.set('settings');
          this.activeSettingsSection.set(settingsSection);
        }
        const settingsFocus = this.normalizeAiSettingsTab(focusValue);
        if (settingsFocus && this.shouldApplyAiFocus(rawTab, params.get('section'))) {
          this.activeTab.set('settings');
          this.activeSettingsSection.set('ai');
          this.activeAiSettingsTab.set(settingsFocus);
        }
      });

    this.loadData();
    timer(2000, 2000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollModelDownloadsIfNeeded());
  }

  protected refresh(): void {
    this.loadData();
  }

  protected selectTab(tabId: HarborAssistantTabId): void {
    this.activeTab.set(tabId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId, section: null, focus: null, node: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected isTab(tabId: HarborAssistantTabId): boolean {
    return this.activeTab() === tabId;
  }

  protected toggleRulesDrawer(): void {
    this.rulesDrawerOpen.set(!this.rulesDrawerOpen());
  }

  protected saveRuleDraft(): void {
    if (this.ruleDraftForm.invalid) {
      this.ruleDraftForm.markAllAsTouched();
      return;
    }
    const prompt = this.ruleDraftForm.controls.prompt.value.trim();
    if (!prompt) {
      this.ruleDraftForm.markAllAsTouched();
      return;
    }
    this.actionInProgress.set('automation-review-create');
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.harborAssistantApi.createAutomationReview({
      source: 'harbor_assistant_chat',
      source_channel: 'HarborAssistant Chat',
      original_prompt: prompt,
      status: 'pending',
      risk_level: 'medium',
      requires_approval: true,
      trigger_definition: {},
      condition_definition: {},
      action_plan: {},
      device_refs: [],
      metadata: {
        pilot: 'chat_first_rule_review',
      },
    }).pipe(
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.automationReviews.set(response.reviews ?? []);
        this.ruleDraftForm.reset();
        this.rulesDrawerOpen.set(true);
        this.actionMessage.set(T('Rule draft is waiting for review.'));
      },
      error: (error: unknown) => this.actionError.set(this.getErrorMessage(error)),
    });
  }

  protected enableRuleReview(review: AutomationRuleReview): void {
    this.runRuleReviewAction(
      `automation-review-enable:${review.review_id}`,
      this.harborAssistantApi.enableAutomationReview(review.review_id),
      T('Rule review was enabled.'),
    );
  }

  protected pauseRuleReview(review: AutomationRuleReview): void {
    this.runRuleReviewAction(
      `automation-review-pause:${review.review_id}`,
      this.harborAssistantApi.pauseAutomationReview(review.review_id),
      T('Rule review was paused.'),
    );
  }

  protected discardRuleReview(review: AutomationRuleReview): void {
    this.runRuleReviewAction(
      `automation-review-discard:${review.review_id}`,
      this.harborAssistantApi.discardAutomationReview(review.review_id),
      T('Rule review was discarded.'),
    );
  }

  protected ruleReviewSourceLabel(review: AutomationRuleReview): string {
    const source = (review.source_channel || review.source || '').trim();
    switch (source) {
      case 'weixin':
      case 'Weixin':
        return T('Weixin');
      case 'feishu':
      case 'Feishu':
        return T('Feishu');
      case 'harbor_assistant_chat':
      case 'HarborAssistant Chat':
        return T('HarborAssistant Chat');
      default:
        return source || T('Unknown source');
    }
  }

  protected ruleReviewStatusTone(review: AutomationRuleReview): HarborAssistantStatusTone {
    switch (review.status) {
      case 'active':
        return 'good';
      case 'pending':
      case 'draft':
        return 'warn';
      case 'paused':
        return 'neutral';
      case 'discarded':
      case 'expired':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  protected selectSettingsSection(sectionId: AssistantSettingsSectionId): void {
    this.activeTab.set('settings');
    this.activeSettingsSection.set(sectionId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'settings', section: sectionId, focus: sectionId === 'ai' ? this.activeAiSettingsTab() : null, node: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected isSettingsSection(sectionId: AssistantSettingsSectionId): boolean {
    return this.activeSettingsSection() === sectionId;
  }

  protected selectAiSettingsTab(tabId: AiSettingsTabId): void {
    this.activeTab.set('settings');
    this.activeSettingsSection.set('ai');
    this.activeAiSettingsTab.set(tabId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'settings', section: 'ai', focus: tabId, node: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected targetRoutePreview(target: NotificationTargetRecord): string {
    const value = (target.route_key || target.target_id || '').trim();
    if (!value) {
      return T('redacted');
    }
    const suffix = value.slice(-6);
    return `...${suffix}`;
  }

  protected setDefaultNotificationTarget(target: NotificationTargetRecord): void {
    const previousDefaultId = this.defaultNotificationTarget()?.target_id ?? null;
    this.actionInProgress.set(`notification-target-default:${target.target_id}`);
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.optimisticDefaultNotificationTargetId.set(target.target_id);
    this.applyLocalDefaultNotificationTarget(target.target_id);

    this.harborAssistantApi.setDefaultNotificationTarget(target.target_id).pipe(
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.notificationTargetsResponse.set(response);
        this.optimisticDefaultNotificationTargetId.set(null);
        this.actionMessage.set(T('Default receiver was updated.'));
      },
      error: (error: unknown) => {
        this.optimisticDefaultNotificationTargetId.set(previousDefaultId);
        if (previousDefaultId) {
          this.applyLocalDefaultNotificationTarget(previousDefaultId);
        }
        this.actionError.set(this.getErrorMessage(error));
      },
    });
  }

  protected removeNotificationTarget(target: NotificationTargetRecord): void {
    this.runAction(
      `notification-target-remove:${target.target_id}`,
      this.harborAssistantApi.deleteNotificationTarget(target.target_id),
      T('Notification target was removed. HarborGate can register it again after the next private IM turn.'),
    );
  }

  protected selectDevice(deviceId: string): void {
    this.selectedDeviceId.set(deviceId);
    this.patchCredentialsForm(deviceId);
    this.patchMetadataForm(deviceId);
  }

  protected editDeviceName(device: CameraDevice): void {
    this.matDialog.open<CameraNameDialogComponent, CameraNameDialogData, CameraNameDialogResult>(
      CameraNameDialogComponent,
      {
        data: {
          name: device.name || device.device_id,
          room: device.room || '',
        },
        maxWidth: '95vw',
        width: '460px',
      },
    ).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result) {
          return;
        }
        this.runAction(
          `metadata:${device.device_id}`,
          this.harborAssistantApi.updateDeviceMetadata(device.device_id, {
            name: result.name,
            room: result.room,
          }),
          T('Camera name was updated.'),
        );
      });
  }

  protected removeDevice(device: CameraDevice): void {
    if (this.pendingDeleteDeviceId() !== device.device_id) {
      this.pendingDeleteDeviceId.set(device.device_id);
      this.actionMessage.set(T('Confirm again to delete the camera and its device credentials.'));
      return;
    }

    this.runAction(
      `device-remove:${device.device_id}`,
      this.harborAssistantApi.deleteDevice(device.device_id),
      T('Camera was deleted.'),
      () => this.pendingDeleteDeviceId.set(null),
    );
  }

  protected cancelDeviceDelete(): void {
    this.pendingDeleteDeviceId.set(null);
  }

  protected scanDevices(): void {
    const value = this.scanForm.getRawValue();
    this.actionInProgress.set('scan');
    this.actionError.set(null);
    this.actionMessage.set(null);

    this.harborAssistantApi.scanDevices({
        cidr: this.emptyToNull(value.cidr),
        protocol: this.emptyToNull(value.protocol),
        rtsp_port: this.parseOptionalNumber(value.rtspPort),
        rtsp_username: this.emptyToNull(value.username),
        rtsp_password: this.emptyToNull(value.password),
      }).pipe(
        finalize(() => this.actionInProgress.set(null)),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: (response) => this.handleScanResponse(response),
        error: (error: unknown) => this.actionError.set(this.getErrorMessage(error)),
      });
  }

  protected prepareManualFromScan(result: DiscoveryScanResultItem): void {
    const scanValue = this.scanForm.getRawValue();
    this.scanCredentialError.set(null);
    this.scanCredentialPasswordVisible.set(false);
    this.manualForm.patchValue({
      name: result.name || `Camera ${result.ip}`,
      room: result.room === T('Pending confirmation') || result.room === T('Pending identification') ? '' : result.room,
      ip: result.ip,
      path: result.rtsp_paths?.[0] ?? '',
      snapshotUrl: '',
      username: scanValue.username.trim(),
      password: '',
      port: String(result.port || scanValue.rtspPort || '554'),
    });
    this.scanCredentialCandidateId.set(result.candidate_id);
    this.scanCredentialForm.reset({
      username: scanValue.username.trim() || this.defaults().rtsp_username || '',
      password: '',
    });
    this.actionMessage.set(T('Enter the camera password before connecting.'));
  }

  protected isScanCredentialOpen(result: DiscoveryScanResultItem): boolean {
    return this.scanCredentialCandidateId() === result.candidate_id;
  }

  protected cancelScanCredential(): void {
    this.scanCredentialCandidateId.set(null);
    this.scanCredentialError.set(null);
    this.scanCredentialPasswordVisible.set(false);
    this.scanCredentialForm.reset({
      username: this.scanForm.controls.username.value.trim() || this.defaults().rtsp_username || '',
      password: '',
    });
  }

  protected toggleScanCredentialPasswordVisible(): void {
    this.scanCredentialPasswordVisible.set(!this.scanCredentialPasswordVisible());
  }

  protected connectScanResult(result: DiscoveryScanResultItem): void {
    if (this.scanCredentialForm.invalid) {
      this.scanCredentialForm.markAllAsTouched();
      this.scanCredentialError.set(T('Enter the camera password.'));
      return;
    }

    const value = this.scanCredentialForm.getRawValue();
    const scanValue = this.scanForm.getRawValue();
    const actionId = `scan-connect:${result.candidate_id}`;
    this.actionInProgress.set(actionId);
    this.actionError.set(null);
    this.scanCredentialError.set(null);
    this.actionMessage.set(T('Connecting camera.'));

    this.harborAssistantApi.addManualDevice({
      name: result.name || `Camera ${result.ip}`,
      room: this.scanResultRoom(result),
      ip: result.ip,
      path: this.emptyToNull(result.rtsp_paths?.[0] ?? ''),
      snapshot_url: null,
      username: this.emptyToNull(value.username),
      password: this.emptyToNull(value.password),
      port: result.port || this.parseOptionalNumber(scanValue.rtspPort),
    }).pipe(
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.scanCredentialCandidateId.set(null);
        this.scanCredentialPasswordVisible.set(false);
        this.scanCredentialForm.reset({
          username: value.username.trim(),
          password: '',
        });
        this.actionMessage.set(T('Camera was connected.'));
        this.refreshCameraState();
      },
      error: (error: unknown) => {
        const message = this.getErrorMessage(error);
        this.scanCredentialError.set(message);
        this.actionError.set(message);
        this.actionMessage.set(null);
      },
    });
  }

  protected addManualDevice(): void {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      this.actionError.set(T('Device name and IP address are required.'));
      return;
    }

    const value = this.manualForm.getRawValue();
    this.runAction(
      'manual-add',
      this.harborAssistantApi.addManualDevice({
        name: value.name.trim(),
        room: this.emptyToNull(value.room),
        ip: value.ip.trim(),
        path: this.emptyToNull(value.path),
        snapshot_url: this.emptyToNull(value.snapshotUrl),
        username: this.emptyToNull(value.username),
        password: this.emptyToNull(value.password),
        port: this.parseOptionalNumber(value.port),
      }),
      T('Device was submitted to HarborBeacon.'),
      () => {
        const currentPort = this.manualForm.controls.port.value;
        this.manualForm.reset({
          name: '',
          room: '',
          ip: '',
          path: '',
          snapshotUrl: '',
          username: '',
          password: '',
          port: currentPort || '554',
        });
      },
    );
  }

  protected saveDefaults(): void {
    this.runAction(
      'defaults',
      this.harborAssistantApi.saveDefaults(this.defaultsPayload()),
      T('Default AIoT settings were saved.'),
      () => this.defaultsForm.controls.rtspPassword.setValue(''),
    );
  }

  protected notificationTargetForConnector(connector: ConnectorCard): NotificationTargetRecord | null {
    const id = connector.id.toLowerCase();
    return this.notificationTargets().find((target) => {
      const platform = (target.platform_hint ?? '').toLowerCase();
      const label = (target.label ?? '').toLowerCase();
      return platform.includes(id) || label.includes(id);
    }) ?? null;
  }

  protected isDefaultConnector(connector: ConnectorCard): boolean {
    const target = this.notificationTargetForConnector(connector);
    if (!target) {
      return false;
    }
    return this.defaultNotificationTarget()?.target_id === target.target_id;
  }

  protected setDefaultConnectorTarget(connector: ConnectorCard): void {
    const target = this.notificationTargetForConnector(connector);
    if (!target || this.isDefaultConnector(connector)) {
      return;
    }
    this.setDefaultNotificationTarget(target);
  }

  protected connectorTargetStatus(connector: ConnectorCard): string {
    const target = this.notificationTargetForConnector(connector);
    if (target && this.actionBusy(`notification-target-default:${target.target_id}`)) {
      return T('Saving...');
    }
    if (this.isDefaultConnector(connector)) {
      return T('Default receiver for Harbor Assistant messages');
    }
    if (target) {
      return T('Can be set as default receiver');
    }
    if (connector.connected) {
      return T('Connected. Send one direct message before it can become the default receiver.');
    }
    return T('Not connected');
  }

  protected deviceRoomLabel(device: CameraDevice): string {
    return device.room || device.ip_address || T('No location set');
  }

  protected deviceNameLabel(device: CameraDevice): string {
    return device.name || device.device_id;
  }

  protected saveDvrSettings(): void {
    this.runAction(
      'dvr-settings',
      this.harborAssistantApi.saveDvrRecordingSettings(this.dvrSettingsPayload()),
      T('DVR settings were saved.'),
    );
  }

  protected openDvrFolderPicker(): void {
    const currentPath = this.dvrForm.controls.mediaLibraryRoot.value.trim()
      || this.dvrSettings()?.media_library_root
      || '/mnt';
    const data: FolderPickerDialogData = {
      title: T('Choose recording media library'),
      currentPath: currentPath.startsWith('/mnt/') ? currentPath : '/mnt',
      confirmLabel: T('Use this folder'),
      currentSelectionLabel: T('Current selection'),
      disabledSelectionTooltip: T('Choose a folder in a pool or USB device.'),
      allowDatasetRootSelection: true,
      itemSelectLabel: T('Use'),
    };

    this.matDialog.open<FolderPickerDialogComponent, FolderPickerDialogData, FolderPickerDialogResult>(
      FolderPickerDialogComponent,
      {
        data,
        maxWidth: '95vw',
        width: '760px',
      },
    ).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.path) {
          this.dvrForm.controls.mediaLibraryRoot.setValue(result.path);
          this.dvrForm.markAsDirty();
        }
      });
  }

  protected startDvr(device: CameraDevice): void {
    this.runAction(
      `dvr-start:${device.device_id}`,
      this.harborAssistantApi.startDvrRecording(device.device_id),
      T('DVR recording was started.'),
      () => this.refreshDvrState(),
    );
  }

  protected stopDvr(device: CameraDevice): void {
    this.runAction(
      `dvr-stop:${device.device_id}`,
      this.harborAssistantApi.stopDvrRecording(device.device_id),
      T('DVR recording was stopped.'),
      () => this.refreshDvrState(),
    );
  }

  protected openDvrReplay(segment: DvrTimelineSegment): void {
    const replayUrl = this.sameOriginAdminUrl(segment.replay_url)
      ?? `/api/harbor-beacon/knowledge/preview?path=${encodeURIComponent(segment.file_path)}`;
    window.open(replayUrl, '_blank', 'noopener');
  }

  protected saveDeviceMetadata(): void {
    const device = this.selectedDevice();
    if (!device) {
      this.actionError.set(T('Select a device before saving metadata.'));
      return;
    }

    const value = this.metadataForm.getRawValue();
    this.runAction(
      `metadata:${device.device_id}`,
      this.harborAssistantApi.updateDeviceMetadata(device.device_id, {
        name: this.emptyToNull(value.name),
        room: this.emptyToNull(value.room),
        vendor: this.emptyToNull(value.vendor),
        model: this.emptyToNull(value.model),
        ip_address: this.emptyToNull(value.ipAddress),
        snapshot_url: this.emptyToNull(value.snapshotUrl),
        primary_stream_url: this.emptyToNull(value.primaryStreamUrl),
        rtsp_path: this.emptyToNull(value.rtspPath),
        rtsp_port: this.parseOptionalNumber(value.rtspPort),
        requires_auth: this.parseOptionalBoolean(value.requiresAuth),
      }),
      T('Device metadata was updated.'),
    );
  }

  protected saveCredentials(): void {
    const device = this.selectedDevice();
    if (!device) {
      this.actionError.set(T('Select a device before saving credentials.'));
      return;
    }

    this.runAction(
      `credentials:${device.device_id}`,
      this.harborAssistantApi.saveDeviceCredentials(device.device_id, this.credentialsPayload()),
      T('Credential status was updated. Secret values remain redacted in admin responses.'),
      () => this.credentialsForm.controls.password.setValue(''),
    );
  }

  protected checkRtsp(device: CameraDevice): void {
    this.runAction(
      `rtsp:${device.device_id}`,
      this.harborAssistantApi.checkDeviceRtsp(device.device_id, this.credentialsPayload()),
      T('RTSP check completed.'),
    );
  }

  protected validateDevice(device: CameraDevice): void {
    this.runAction(
      `validate:${device.device_id}`,
      this.harborAssistantApi.runDeviceValidation(device.device_id, {
        scope: 'all',
        reason: 'harbor-assistant-settings-validation',
      }),
      T('Device validation completed.'),
    );
  }

  protected validateDefaultCamera(): void {
    const camera = this.defaultCamera();
    if (!camera) {
      this.actionError.set(T('Select a default camera before running validation.'));
      return;
    }
    this.validateDevice(camera);
  }

  protected setDefaultCamera(device: CameraDevice): void {
    this.runAction(
      `default:${device.device_id}`,
      this.harborAssistantApi.setDefaultCamera(device.device_id),
      T('Default camera updated.'),
    );
  }

  protected createSnapshot(device: CameraDevice): void {
    this.runAction(
      `snapshot:${device.device_id}`,
      this.harborAssistantApi.createCameraSnapshotTask(device.device_id),
      T('Snapshot check requested.'),
    );
  }

  protected createShareLink(device: CameraDevice): void {
    this.runAction(
      `share:${device.device_id}`,
      this.harborAssistantApi.createCameraShareLink(device.device_id),
      T('Share link created or queued.'),
    );
  }

  protected revokeShareLink(link: ShareLinkSummary): void {
    this.runAction(
      `revoke:${link.share_link_id}`,
      this.harborAssistantApi.revokeShareLink(link.share_link_id),
      T('Share link revoked.'),
    );
  }

  protected editModelEndpoint(endpoint: ModelEndpointRecord): void {
    this.modelEndpointEditingId.set(endpoint.model_endpoint_id);
    this.modelEndpointForm.patchValue({
      modelEndpointId: endpoint.model_endpoint_id,
      modelKind: endpoint.model_kind || 'llm',
      endpointKind: endpoint.endpoint_kind || 'local',
      providerKey: endpoint.provider_key || 'local',
      modelName: endpoint.model_name || '',
      status: endpoint.status || 'active',
      capabilityTags: (endpoint.capability_tags ?? []).join('\n'),
      baseUrl: this.metadataString(endpoint, 'base_url'),
      healthzUrl: this.metadataString(endpoint, 'healthz_url'),
      apiKey: '',
    });
  }

  protected clearModelEndpointForm(): void {
    this.modelEndpointEditingId.set(null);
    this.modelEndpointForm.reset({
      modelEndpointId: '',
      modelKind: 'llm',
      endpointKind: 'local',
      providerKey: 'local',
      modelName: '',
      status: 'active',
      capabilityTags: 'chat',
      baseUrl: '',
      healthzUrl: '',
      apiKey: '',
    });
  }

  protected saveModelEndpoint(): void {
    if (this.modelEndpointForm.invalid) {
      this.modelEndpointForm.markAllAsTouched();
      this.actionError.set(T('Model endpoint id and model name are required.'));
      return;
    }

    const payload = this.modelEndpointPayload();
    const editingId = this.modelEndpointEditingId();
    const request = editingId
      ? this.harborAssistantApi.updateModelEndpoint(editingId, payload)
      : this.harborAssistantApi.createModelEndpoint(payload);
    this.runAction(
      editingId ? `model-endpoint:${editingId}` : 'model-endpoint:create',
      request,
      editingId ? T('Model endpoint was updated.') : T('Model endpoint was created.'),
      () => this.clearModelEndpointForm(),
    );
  }

  protected testModelEndpoint(endpoint: ModelEndpointRecord): void {
    this.runAction(
      `model-test:${endpoint.model_endpoint_id}`,
      this.harborAssistantApi.testModelEndpoint(endpoint.model_endpoint_id),
      T('Model connection test completed.'),
    );
  }

  protected handleModelCardAction(card: CustomerModelCard): void {
    switch (card.action) {
      case 'download':
      case 'retry':
        this.createModelDownloadForCard(card);
        return;
      case 'set-current':
        this.useInstalledModel(card);
        return;
      case 'configure-cloud':
        this.openCloudModelSettings(card.endpoint ?? null);
        return;
      case 'manual-source':
        this.selectModelCardForManualDownload(card);
        return;
      case 'downloading':
      case 'current':
      default:
        return;
    }
  }

  protected modelCardActionDisabled(card: CustomerModelCard): boolean {
    return this.isBusy() || card.action === 'downloading' || card.action === 'current';
  }

  protected modelRecommendationLabel(card: CustomerModelCard): string {
    switch (card.recommendationGroup) {
      case 'lightweight_local':
        return T('Lightweight local');
      case 'installed_not_recommended':
        return T('Installed but not recommended for this hardware');
      case 'cloud_backup':
        return T('Cloud backup');
      case 'high_end_experimental':
        return T('High-end/experimental');
      case 'current_recommended':
      default:
        return T('Recommended for this machine');
    }
  }

  protected modelHardwareFitLabel(card: CustomerModelCard): string {
    switch (card.hardwareFit) {
      case 'recommended':
        return T('Recommended');
      case 'not_recommended':
        return T('Not recommended for this hardware');
      case 'needs_config':
        return T('Needs configuration');
      default:
        return T('Available');
    }
  }

  protected openAdvancedModels(scrollToEditor = false): void {
    this.modelsAdvancedOpen.set(true);
    if (scrollToEditor) {
      this.scrollEndpointEditorIntoView();
    }
  }

  protected validationVlmStatus(card: CustomerModelCard | null): string {
    if (!card) {
      return T('No local VLM catalog item');
    }
    if (card.action === 'current') {
      return T('Current');
    }
    if (card.section === 'downloading') {
      return card.progressLabel ?? card.status;
    }
    if (card.section === 'installed') {
      return T('Installed');
    }
    return card.status;
  }

  protected validationVlmDownloadTone(card: CustomerModelCard | null): HarborAssistantStatusTone {
    if (!card) {
      return 'warn';
    }
    if (card.action === 'current' || card.section === 'installed') {
      return 'good';
    }
    if (this.isFailedStatus(card.status)) {
      return 'danger';
    }
    return 'warn';
  }

  protected validationVlmActionLabel(card: CustomerModelCard | null): string {
    return card?.actionLabel ?? T('Manual download');
  }

  protected validationVlmActionDisabled(card: CustomerModelCard | null): boolean {
    return card ? this.modelCardActionDisabled(card) : this.isBusy();
  }

  protected prepareManualVlmDownload(): void {
    const card = this.localVlmModelCard();
    if (card) {
      if (card.catalogModel) {
        this.selectCatalogModel(card.catalogModel);
      } else {
        this.downloadForm.patchValue({
          modelId: card.modelId,
          displayName: card.displayName,
          providerKey: card.providerKey,
          targetPath: card.localPath ?? '',
          sourceUrl: '',
        });
      }
    } else {
      this.downloadForm.patchValue({
        modelId: '',
        displayName: '',
        providerKey: 'local',
        targetPath: '',
        sourceUrl: '',
      });
    }
    this.openAdvancedModels();
    this.scrollSelectorIntoView('.download-form');
  }

  protected selectCatalogModel(model: LocalModelCatalogItem): void {
    this.downloadForm.patchValue({
      modelId: model.model_id,
      displayName: model.display_name,
      providerKey: model.provider_key,
      targetPath: model.local_path ?? '',
      sourceUrl: '',
    });
  }

  protected selectModelCardForManualDownload(card: CustomerModelCard): void {
    if (card.catalogModel) {
      this.selectCatalogModel(card.catalogModel);
    } else {
      this.downloadForm.patchValue({
        modelId: card.modelId,
        displayName: card.displayName,
        providerKey: card.providerKey,
        targetPath: card.localPath ?? '',
        sourceUrl: '',
      });
    }
    this.openAdvancedModels();
  }

  protected createModelDownload(): void {
    if (this.downloadForm.invalid) {
      this.downloadForm.markAllAsTouched();
      this.actionError.set(T('Select a model before starting a download job.'));
      return;
    }

    const value = this.downloadForm.getRawValue();
    this.runAction(
      `model-download:${value.modelId}`,
      this.harborAssistantApi.createLocalModelDownload({
        model_id: value.modelId.trim(),
        display_name: this.emptyToNull(value.displayName),
        provider_key: this.emptyToNull(value.providerKey),
        target_path: this.emptyToNull(value.targetPath),
        metadata: {
          source_url: this.emptyToNull(value.sourceUrl),
        },
      }),
      T('Local model download job was started by explicit action.'),
    );
  }

  protected createModelDownloadForCard(card: CustomerModelCard): void {
    if (!this.modelCardIsInstallable(card)) {
      this.actionError.set(T('This model requires a manual download source and cannot be installed with one click.'));
      return;
    }

    this.runAction(
      `model-download:${card.modelId}`,
      this.harborAssistantApi.createLocalModelDownload({
        model_id: card.modelId,
        capability_id: card.capabilityId ?? null,
        display_name: card.displayName,
        provider_key: card.providerKey || null,
        target_path: null,
        hf_endpoint: card.catalogModel?.default_hf_endpoint ?? null,
        metadata: {
          catalog_action: 'customer_download',
          capability_id: card.capabilityId ?? null,
          source: card.source,
          source_kind: card.catalogModel?.source_kind ?? null,
          repo_id: card.catalogModel?.repo_id ?? null,
          revision: card.catalogModel?.revision ?? null,
          file_policy: card.catalogModel?.file_policy ?? null,
          hf_endpoint: card.catalogModel?.default_hf_endpoint ?? null,
        },
      }),
      T('Local model download job was started by explicit action.'),
    );
  }

  protected useInstalledModel(card: CustomerModelCard): void {
    if (card.capabilityId) {
      this.runAction(
        `model-capability-select:${card.capabilityId}`,
        this.harborAssistantApi.selectModelCapability(card.capabilityId, card.modelId),
        this.modelSelectionSuccessMessage(card),
      );
      return;
    }
    if (!card.localPath) {
      this.actionError.set(T('This model does not have a local path yet. Download it before setting it as current.'));
      return;
    }

    const targetKinds = this.targetEndpointKinds(card.kind);
    const missingKind = targetKinds.find((kind) => !this.endpointForKind(kind));
    if (missingKind) {
      this.prepareEndpointFormForModel(card, missingKind);
      return;
    }

    const endpoints = this.uniqueEndpointsForKinds(targetKinds);
    const requests = endpoints.map((endpoint) => {
      const metadata: Record<string, unknown> = {
        ...this.editableEndpointMetadata(endpoint),
        catalog_model_id: card.modelId,
        local_path: card.localPath,
      };
      return this.harborAssistantApi.updateModelEndpoint(endpoint.model_endpoint_id, {
        model_endpoint_id: endpoint.model_endpoint_id,
        workspace_id: endpoint.workspace_id ?? null,
        provider_account_id: endpoint.provider_account_id ?? null,
        model_kind: endpoint.model_kind,
        endpoint_kind: endpoint.endpoint_kind || 'local',
        provider_key: card.providerKey || endpoint.provider_key || 'local',
        model_name: card.localPath,
        capability_tags: card.capabilities.length > 0 ? card.capabilities : endpoint.capability_tags ?? [endpoint.model_kind],
        cost_policy: endpoint.cost_policy ?? {},
        status: 'active',
        metadata,
      });
    });

    this.runAction(
      `model-endpoint:set-current:${card.modelId}`,
      forkJoin(requests),
      T('Current model endpoints were updated. Run health checks before live use.'),
    );
  }

  protected prepareEndpointFormForModel(card: CustomerModelCard, endpointKind = this.targetEndpointKinds(card.kind)[0] ?? 'llm'): void {
    this.openAdvancedModels(true);
    this.modelEndpointEditingId.set(null);
    this.modelEndpointForm.patchValue({
      modelEndpointId: `${endpointKind}-local`,
      modelKind: endpointKind,
      endpointKind: 'local',
      providerKey: card.providerKey || 'local',
      modelName: card.localPath ?? card.modelId,
      status: 'active',
      capabilityTags: card.capabilities.length > 0 ? card.capabilities.join('\n') : card.kind,
      baseUrl: '',
      healthzUrl: '',
      apiKey: '',
    });
    this.actionMessage.set(T('Endpoint editor was prepared for this installed model. Add the runtime URL, then save and run health check.'));
    this.actionError.set(null);
  }

  protected prepareEndpointFormForKind(kind: string): void {
    this.openAdvancedModels(true);
    this.modelEndpointEditingId.set(null);
    this.modelEndpointForm.patchValue({
      modelEndpointId: `${kind}-local`,
      modelKind: kind,
      endpointKind: 'local',
      providerKey: 'local',
      modelName: '',
      status: 'active',
      capabilityTags: kind,
      baseUrl: '',
      healthzUrl: '',
      apiKey: '',
    });
    this.actionMessage.set(T('Endpoint editor was prepared. Add the model name and runtime URL, then save and run health check.'));
    this.actionError.set(null);
  }

  protected cancelModelDownload(job: LocalModelDownloadJob): void {
    this.runAction(
      `model-download-cancel:${job.job_id}`,
      this.harborAssistantApi.cancelLocalModelDownload(job.job_id),
      T('Local model download job was canceled.'),
    );
  }

  protected selectModelPolicy(policy: ModelRoutePolicyRecord): void {
    this.policyForm.patchValue({
      routePolicyId: policy.route_policy_id,
      fallbackOrder: policy.fallback_order.join('\n'),
      status: policy.status || 'active',
      localPreferred: policy.local_preferred ? 'true' : 'false',
    });
  }

  protected saveModelPolicy(): void {
    const value = this.policyForm.getRawValue();
    const policyId = value.routePolicyId.trim();
    if (!policyId) {
      this.actionError.set(T('Select a route policy before saving.'));
      return;
    }

    const routePolicies = this.modelPolicies().map((policy) => {
      if (policy.route_policy_id !== policyId) {
        return policy;
      }
      return {
        ...policy,
        fallback_order: this.parseLines(value.fallbackOrder),
        status: value.status.trim() || policy.status,
        local_preferred: value.localPreferred === 'true',
      };
    });

    this.runAction(
      `model-policy:${policyId}`,
      this.harborAssistantApi.saveModelPolicies({ route_policies: routePolicies }),
      T('Model routing policy was saved.'),
    );
  }

  protected applyCloudProviderDefaults(providerValue: string): void {
    const provider = this.cloudProviderOption(providerValue);
    this.cloudApiForm.patchValue({
      baseUrl: provider.defaultBaseUrl,
      modelName: provider.defaultModelName,
      apiKey: '',
    });
    this.cloudApiForm.markAsDirty();
  }

  protected saveCloudApiSettings(): void {
    if (this.cloudApiForm.invalid) {
      this.cloudApiForm.markAllAsTouched();
      this.actionError.set(T('Base URL and model name are required for cloud API settings.'));
      return;
    }

    const value = this.cloudApiForm.getRawValue();
    const provider = this.cloudProviderOption(value.provider);
    const existing = this.cloudEndpointForProvider(provider.value);
    const hasApiKey = value.apiKey.trim().length > 0 || this.metadataBoolean(existing, 'api_key_configured');
    const endpointPayload = this.cloudEndpointPayload(provider, existing, hasApiKey);
    const endpointRequest = existing
      ? this.harborAssistantApi.updateModelEndpoint(existing.model_endpoint_id, endpointPayload)
      : this.harborAssistantApi.createModelEndpoint(endpointPayload);

    this.runAction(
      'cloud-api-settings',
      endpointRequest.pipe(
        switchMap(() => this.harborAssistantApi.saveModelPolicies({ route_policies: this.cloudPolicyPayload() })),
      ),
      T('Cloud API settings were saved.'),
      () => {
        this.cloudApiForm.controls.apiKey.setValue('');
        this.cloudApiForm.markAsPristine();
      },
    );
  }

  protected testCloudApiSettings(): void {
    const endpoint = this.cloudEndpointForProvider(this.cloudApiForm.controls.provider.value);
    if (!endpoint || !this.metadataBoolean(endpoint, 'api_key_configured')) {
      this.actionError.set(T('Save the API key before testing the cloud API.'));
      return;
    }
    this.testModelEndpoint(endpoint);
  }

  protected openCloudModelSettings(endpoint: ModelEndpointRecord | null): void {
    this.selectAiSettingsTab('cloud-api');
    const providerValue = this.cloudProviderFromEndpoint(endpoint);
    const provider = this.cloudProviderOption(providerValue);
    this.cloudApiForm.patchValue({
      provider: provider.value,
      baseUrl: this.metadataString(endpoint, 'base_url') || provider.defaultBaseUrl,
      modelName: endpoint?.model_name || this.metadataString(endpoint, 'model') || provider.defaultModelName,
    });
    this.actionMessage.set(T('FlashV4 is a cloud backup model and will only be enabled after an API key is configured.'));
  }

  protected cloudApiConfiguredLabel(): string {
    return this.cloudApiConfigured() ? T('Configured') : T('Not configured');
  }

  protected cloudApiConfigured(): boolean {
    const endpoint = this.cloudEndpointForProvider(this.cloudApiForm.controls.provider.value);
    return this.metadataBoolean(endpoint, 'api_key_configured');
  }

  protected editKnowledgeSource(root: KnowledgeSourceRoot): void {
    this.openKnowledgeFolderPicker(root);
  }

  protected stageKnowledgeSource(root: KnowledgeSourceRoot): void {
    this.knowledgeSourceForm.patchValue({
      rootId: root.root_id,
      label: root.label,
      path: root.path,
      enabled: root.enabled,
      include: (root.include ?? []).join('\n'),
      exclude: (root.exclude ?? []).join('\n'),
    });
    this.knowledgeSourceForm.markAsDirty();
  }

  protected clearKnowledgeSourceForm(): void {
    this.knowledgeSourceForm.reset({
      rootId: '',
      label: '',
      path: '',
      enabled: true,
      include: '',
      exclude: '',
    });
  }

  protected saveKnowledgeSettings(): void {
    const payload = this.knowledgeSettingsPayload(true);
    this.runKnowledgeSettingsSave('knowledge-settings', payload, T('Knowledge settings were saved.'), true, T('Saving data settings...'));
  }

  protected saveKnowledgeSourceAndRunIndex(): void {
    if (!this.knowledgeSourceForm.controls.path.value.trim()) {
      this.actionError.set(T('Choose a folder before adding a data source.'));
      return;
    }

    const payload = this.knowledgeSettingsPayload(true);
    this.actionInProgress.set('knowledge-source-index');
    this.actionError.set(null);
    this.actionMessage.set(T('Adding data source and starting index...'));

    this.harborAssistantApi.saveKnowledgeSettings(payload).pipe(
      switchMap((settings) => {
        this.knowledgeSettings.set(settings);
        this.clearKnowledgeSourceForm();
        return this.harborAssistantApi.runKnowledgeIndex();
      }),
      switchMap(() => this.fetchKnowledgeIndexState()),
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.actionMessage.set(T('Data source was added and indexing has started.')),
      error: (error: unknown) => this.actionError.set(this.getErrorMessage(error)),
    });
  }

  protected saveKnowledgeAdvancedSettings(): void {
    const payload = this.knowledgeSettingsPayload(false);
    this.runKnowledgeSettingsSave('knowledge-settings', payload, T('Knowledge settings were saved.'), false, T('Saving data settings...'));
  }

  protected removeKnowledgeSource(root: KnowledgeSourceRoot): void {
    const current = this.knowledgeSettings() ?? { source_roots: [], index_root: '' };
    const payload: KnowledgeSettings = {
      source_roots: current.source_roots.filter((candidate) => candidate.root_id !== root.root_id && candidate.path !== root.path),
      index_root: this.knowledgeIndexForm.controls.indexRoot.value.trim() || current.index_root,
      privacy_level: this.knowledgeIndexForm.controls.privacyLevel.value || current.privacy_level || 'strict_local',
      default_resource_profile: this.knowledgeIndexForm.controls.resourceProfile.value || current.default_resource_profile || 'cpu_only',
    };
    this.runAction(
      `knowledge-source-remove:${root.root_id}`,
      this.harborAssistantApi.saveKnowledgeSettings(payload),
      T('Knowledge source root was removed.'),
    );
  }

  protected runKnowledgeIndex(): void {
    this.actionInProgress.set('knowledge-index');
    this.actionError.set(null);
    this.actionMessage.set(T('Starting index...'));

    this.harborAssistantApi.runKnowledgeIndex().pipe(
      switchMap(() => this.fetchKnowledgeIndexState()),
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.actionMessage.set(T('Knowledge index run completed.')),
      error: (error: unknown) => this.actionError.set(this.getErrorMessage(error)),
    });
  }

  protected startKnowledgeSourceRoot(): void {
    this.clearKnowledgeSourceForm();
    this.openKnowledgeFolderPicker();
  }

  protected inspectImageContentCounts(): void {
    this.scrollSelectorIntoView('.knowledge-card');
  }

  protected browseKnowledgeFiles(path?: string | null): void {
    this.actionInProgress.set('files-browse');
    this.actionError.set(null);
    this.actionMessage.set(null);

    this.harborAssistantApi.browseFiles(path).pipe(
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => this.filesBrowse.set(response),
      error: (error: unknown) => this.actionError.set(this.getErrorMessage(error)),
    });
  }

  protected openKnowledgeFolderPicker(root?: KnowledgeSourceRoot | null): void {
    this.sourcePickerEditingRoot.set(root ?? null);
    const currentPath = root?.path ?? this.knowledgeSourceForm.controls.path.value.trim();
    const pickerPath = currentPath.startsWith('/mnt/') ? currentPath : '/mnt';
    const data: FolderPickerDialogData = {
      title: root ? T('Edit data source') : T('Add data source'),
      currentPath: pickerPath,
      excludePaths: this.knowledgeSourceRoots()
        .filter((candidate) => candidate.root_id !== root?.root_id)
        .map((candidate) => candidate.path),
      confirmLabel: T('Use this folder'),
      currentSelectionLabel: T('Current selection'),
      disabledSelectionTooltip: T('Choose a folder in a pool or USB device.'),
      allowDatasetRootSelection: true,
      itemSelectLabel: T('Use'),
    };

    try {
      this.matDialog.open<FolderPickerDialogComponent, FolderPickerDialogData, FolderPickerDialogResult>(
        FolderPickerDialogComponent,
        {
          data,
          maxWidth: '95vw',
          width: '760px',
        },
      ).afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result?.path) {
            this.saveKnowledgeSourceFromPath(result.path, root ?? null);
          }
        });
    } catch {
      this.browseKnowledgeFiles(pickerPath);
    }
  }

  protected openModelStoreFolderPicker(): void {
    const currentPath = this.modelCapabilitiesResponse()?.model_store?.path ?? '/mnt';
    const pickerPath = currentPath.startsWith('/mnt/') ? currentPath : '/mnt';
    const data: FolderPickerDialogData = {
      title: T('Model storage location'),
      currentPath: pickerPath,
      excludePaths: [],
      confirmLabel: T('Use this folder'),
      currentSelectionLabel: T('Current selection'),
      disabledSelectionTooltip: T('Choose a writable folder on HarborOS.'),
      allowDatasetRootSelection: true,
      itemSelectLabel: T('Use'),
    };

    try {
      this.matDialog.open<FolderPickerDialogComponent, FolderPickerDialogData, FolderPickerDialogResult>(
        FolderPickerDialogComponent,
        {
          data,
          maxWidth: '95vw',
          width: '760px',
        },
      ).afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result?.path) {
            this.runAction(
              'model-store',
              this.harborAssistantApi.updateModelStore(result.path),
              T('Model storage location was updated.'),
            );
          }
        });
    } catch {
      this.actionError.set(T('Folder picker is temporarily unavailable. Try again later.'));
    }
  }

  protected saveKnowledgeSourceFromPath(path: string, root?: KnowledgeSourceRoot | null): void {
    const editingRoot = root === undefined ? this.sourcePickerEditingRoot() : root;
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      this.actionError.set(T('Choose a folder before adding a data source.'));
      return;
    }

    const duplicate = this.knowledgeSourceRoots().find((candidate) => {
      return candidate.path === trimmedPath && candidate.root_id !== editingRoot?.root_id;
    });
    if (duplicate) {
      this.actionError.set(T('This folder is already a data source.'));
      return;
    }

    const existing = editingRoot ?? this.knowledgeSourceRoots().find((candidate) => candidate.path === trimmedPath) ?? null;
    this.knowledgeSourceForm.patchValue({
      rootId: existing?.root_id ?? '',
      label: existing?.label ?? this.pathLabel(trimmedPath),
      path: trimmedPath,
      enabled: existing?.enabled ?? true,
      include: (existing?.include ?? []).join('\n'),
      exclude: (existing?.exclude ?? []).join('\n'),
    });
    this.knowledgeSourceForm.markAsDirty();

    const payload = this.knowledgeSettingsPayload(true);
    this.runKnowledgeSettingsSave(
      'knowledge-settings',
      payload,
      existing ? T('Data source was updated.') : T('Data source was added.'),
      true,
      existing ? T('Updating data source...') : T('Adding data source...'),
    );
  }

  protected useBrowsePathAsSource(path: string): void {
    const existing = this.knowledgeSourceRoots().find((root) => root.path === path);
    this.knowledgeSourceForm.patchValue({
      rootId: existing?.root_id ?? '',
      label: existing?.label ?? this.pathLabel(path),
      path,
      enabled: existing?.enabled ?? true,
      include: (existing?.include ?? []).join('\n'),
      exclude: (existing?.exclude ?? []).join('\n'),
    });
    this.knowledgeSourceForm.markAsDirty();
  }

  protected useDvrMediaLibraryAsSource(): void {
    const libraryRoot = this.dvrSettings()?.media_library_root
      || this.dvrSettings()?.recording_root
      || '';
    if (!libraryRoot) {
      this.actionError.set(T('DVR media library path is not configured yet.'));
      return;
    }

    const existing = this.knowledgeSourceRoots().find((root) => root.path === libraryRoot);
    this.knowledgeSourceForm.patchValue({
      rootId: existing?.root_id ?? 'dvr-media-library',
      label: existing?.label ?? T('DVR media library'),
      path: libraryRoot,
      enabled: existing?.enabled ?? true,
      include: (existing?.include ?? []).join('\n'),
      exclude: (existing?.exclude ?? []).join('\n'),
    });
    this.knowledgeSourceForm.markAsDirty();
  }

  protected pendingKnowledgeSourcePath(): string {
    return this.knowledgeSourceForm.controls.path.value.trim();
  }

  protected useBrowsePathAsIndex(path: string): void {
    this.knowledgeIndexForm.patchValue({ indexRoot: path });
    this.knowledgeIndexForm.markAsDirty();
  }

  protected workflowModelChoices(kind: string): CustomerModelCard[] {
    const capability = this.workflowCapabilityForKind(kind);
    if (capability) {
      const matchKind = capability.model_kind || kind;
      const installed = (capability.installed_models ?? [])
        .map((model) => this.modelCapabilityChoiceCard(capability.capability_id, model, 'installed'))
        .slice(0, 6);
      const catalogInstalled = this.customerModelCards()
        .filter((card) => card.section === 'installed' && this.modelCardMatchesWorkflowKind(card, matchKind))
        .slice(0, 6);
      const available = (capability.installable_models ?? [])
        .map((model) => this.modelCapabilityChoiceCard(capability.capability_id, model, 'available'))
        .slice(0, installed.length ? 4 : 8);
      const catalogAvailable = this.customerModelCards()
        .filter((card) => card.section === 'available' && this.modelCardMatchesWorkflowKind(card, matchKind))
        .slice(0, installed.length || catalogInstalled.length ? 4 : 8);
      return this.uniqueModelCards([
        ...installed,
        ...catalogInstalled,
        ...available,
        ...catalogAvailable,
        ...this.workflowCloudModelChoices(capability.capability_id),
      ]).slice(0, 12);
    }
    const installed = this.customerModelCards()
      .filter((card) => card.section === 'installed' && this.modelCardMatchesWorkflowKind(card, kind))
      .slice(0, 6);
    const available = this.customerModelCards()
      .filter((card) => card.section === 'available' && this.modelCardMatchesWorkflowKind(card, kind))
      .slice(0, 6);
    return this.uniqueModelCards([...installed, ...available, ...this.workflowCloudModelChoices(kind)])
      .slice(0, 12);
  }

  protected workflowCurrentModelName(kind: string): string {
    const capability = this.workflowCapabilityForKind(kind);
    if (capability?.current_model?.model_name && capability.status === 'ready') {
      return capability.current_model.model_name;
    }
    if (capability?.selected_model_id) {
      const selected = [
        ...(capability.installed_models ?? []),
        ...(capability.installable_models ?? []),
      ].find((model) => model.model_id === capability.selected_model_id);
      return selected?.display_name ?? capability.selected_model_id;
    }
    const current = this.currentModelCards().find((card) => card.kind === kind);
    if (!current?.endpoint || current.modelName === T('Not configured')) {
      return T('No model selected yet');
    }
    return current.modelName;
  }

  protected workflowCurrentModelDetail(kind: string): string {
    const capability = this.workflowCapabilityForKind(kind);
    if (capability) {
      return this.modelCapabilityUserStatus(capability);
    }
    const current = this.currentModelCards().find((card) => card.kind === kind);
    if (!current?.endpoint) {
      return T('Choose an installed model below, or open more models to download one.');
    }
    if (current.localPath) {
      return current.localPath;
    }
    return T('Local model service');
  }

  protected workflowCurrentEndpoint(kind: string): ModelEndpointRecord | null {
    return this.currentModelCards().find((card) => card.kind === kind)?.endpoint ?? null;
  }

  protected workflowCapabilityStatusLabel(kind: string): string {
    const capability = this.workflowCapabilityForKind(kind);
    if (capability) {
      return this.userStatusLabel(capability.status);
    }
    return this.workflowCurrentEndpoint(kind) ? T('Ready') : T('No model selected yet');
  }

  protected workflowCapabilityToneClass(kind: string): string {
    return `tone-${this.modelCapabilityTone(kind)}`;
  }

  protected workflowTestEndpoint(kind: string): ModelEndpointRecord | null {
    const capability = this.workflowCapabilityForKind(kind);
    const endpointId = capability?.current_model?.model_endpoint_id;
    if (endpointId) {
      return this.modelEndpoints().find((endpoint) => endpoint.model_endpoint_id === endpointId)
        ?? this.workflowCurrentEndpoint(kind);
    }
    return this.workflowCurrentEndpoint(kind);
  }

  protected modelCapabilityChooserOpen(capabilityId: string): boolean {
    return this.modelChooserCapabilityId() === capabilityId;
  }

  protected modelCapabilityMoreModelsOpen(capabilityId: string): boolean {
    return this.modelLibraryOpen() && this.modelLibraryCapabilityId() === capabilityId;
  }

  protected modelCapabilityManualDownloadOpen(capabilityId: string): boolean {
    return this.manualModelDownloadCapabilityId() === capabilityId;
  }

  protected workflowAvailableModelChoices(kind: string): CustomerModelCard[] {
    const capability = this.workflowCapabilityForKind(kind);
    if (capability) {
      const matchKind = capability.model_kind || kind;
      const capabilityChoices = capability.installable_models
        .map((model) => this.modelCapabilityChoiceCard(capability.capability_id, model, 'available'))
        .slice(0, 8);
      const catalogChoices = this.customerModelCards()
        .filter((card) => card.section === 'available' && this.modelCardMatchesWorkflowKind(card, matchKind))
        .filter((card) => this.modelCardIsInstallable(card) || card.action === 'configure-cloud' || card.action === 'manual-source')
        .slice(0, 8);
      return this.uniqueModelCards([...capabilityChoices, ...catalogChoices]).slice(0, 10);
    }
    return this.customerModelCards()
      .filter((card) => card.section === 'available' && this.modelCardMatchesWorkflowKind(card, kind))
      .filter((card) => this.modelCardIsInstallable(card))
      .slice(0, 8);
  }

  protected workflowCloudModelChoices(kind: string): CustomerModelCard[] {
    const capability = this.workflowCapabilityForKind(kind);
    const endpointKind = capability?.model_kind ?? kind;
    const targetKinds = this.targetEndpointKinds(endpointKind);
    if (!targetKinds.some((targetKind) => targetKind === 'llm')) {
      return [];
    }
    return this.modelEndpoints()
      .filter((endpoint) => endpoint.endpoint_kind === 'cloud' && this.endpointKindMatches(endpoint, 'llm'))
      .map((endpoint) => this.cloudEndpointModelCard(capability?.capability_id ?? kind, endpoint))
      .slice(0, 4);
  }

  private uniqueModelCards(cards: CustomerModelCard[]): CustomerModelCard[] {
    const seen = new Set<string>();
    return cards.filter((card) => {
      const key = `${card.section}:${card.modelId}:${card.endpoint?.model_endpoint_id ?? ''}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  protected workflowDownloadingModelChoices(kind: string): CustomerModelCard[] {
    const capability = this.workflowCapabilityForKind(kind);
    if (capability) {
      return this.latestDownloadJobs(capability.download_jobs)
        .map((job) => this.modelDownloadJobChoiceCard(capability.capability_id, job))
        .slice(0, 8);
    }
    return this.customerModelCards()
      .filter((card) => card.section === 'downloading' && this.modelCardMatchesWorkflowKind(card, kind))
      .slice(0, 8);
  }

  protected toggleModelCapabilityChooser(capability: AiModelCapability): void {
    const nextOpen = this.modelChooserCapabilityId() === capability.id ? null : capability.id;
    this.modelChooserCapabilityId.set(nextOpen);
    this.manualModelDownloadCapabilityId.set(null);
  }

  protected openModelCapabilityMoreModels(capability: AiModelCapability): void {
    const previousCapability = this.modelLibraryCapabilityId();
    const wasOpen = this.modelLibraryOpen();
    this.actionMessage.set(`${T('Select or download')} ${capability.label}`);
    this.actionError.set(null);
    this.modelLibraryKind.set(capability.kind);
    this.modelLibraryCapabilityId.set(capability.id);
    this.modelLibraryOpen.set(previousCapability !== capability.id || !wasOpen);
    this.modelChooserCapabilityId.set(null);
    this.manualModelDownloadCapabilityId.set(null);
  }

  protected prepareModelCapabilityManualDownload(capability: AiModelCapability): void {
    this.modelLibraryKind.set(capability.kind);
    this.modelLibraryCapabilityId.set(capability.id);
    this.modelLibraryOpen.set(true);
    const nextOpen = this.manualModelDownloadCapabilityId() === capability.id ? null : capability.id;
    this.manualModelDownloadCapabilityId.set(nextOpen);
    this.downloadForm.patchValue({
      modelId: '',
      displayName: '',
      providerKey: 'huggingface',
      targetPath: '',
      sourceUrl: '',
    });
  }

  protected knowledgeSourceStatus(root: KnowledgeSourceRoot): KnowledgeIndexRootStatus | null {
    return this.knowledgeIndexStatus()?.source_roots.find((status) => {
      return status.root_id === root.root_id || status.path === root.path;
    }) ?? null;
  }

  protected actionBusy(actionId: string): boolean {
    return this.actionInProgress() === actionId;
  }

  protected actionBusyPrefix(prefix: string): boolean {
    const action = this.actionInProgress();
    return action === prefix || Boolean(action?.startsWith(`${prefix}:`));
  }

  protected isDefaultCamera(device: CameraDevice): boolean {
    return this.defaults().selected_camera_device_id === device.device_id;
  }

  protected dvrEnabledFor(device: CameraDevice): boolean {
    return this.dvrSettings()?.enabled_device_ids?.includes(device.device_id) ?? false;
  }

  protected dvrStatusFor(device: CameraDevice): DvrRecordingStatus | null {
    return this.dvrStatus()?.statuses.find((status) => status.device_id === device.device_id) ?? null;
  }

  protected dvrTimelineFor(device: CameraDevice): DvrTimelineSegment[] {
    return this.dvrTimelineSegments()
      .filter((segment) => segment.device_id === device.device_id)
      .slice(0, 4);
  }

  protected dvrSegmentCountFor(device: CameraDevice): number {
    return this.dvrTimelineSegments().filter((segment) => segment.device_id === device.device_id).length;
  }

  protected dvrRecordingRootStatus(): string {
    const status = this.dvrStatus();
    if (!status) {
      return T('Unknown');
    }
    if (!status.root_exists) {
      return T('Missing');
    }
    return status.root_writable ? T('Writable') : T('Read-only');
  }

  protected formatUnix(value: string | number | undefined | null): string {
    const seconds = Number(value ?? 0);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return T('n/a');
    }
    return new Date(seconds * 1000).toLocaleString();
  }

  protected formatIndexedAt(value: string | number | undefined | null): string {
    const formatted = this.formatUnix(value);
    return formatted === T('n/a') ? T('Not indexed yet') : formatted;
  }

  protected credentialStatusFor(device: CameraDevice): DeviceCredentialStatus | null {
    return this.credentialStatusByDeviceId(device.device_id);
  }

  protected evidenceFor(device: CameraDevice): DeviceEvidenceResponse | null {
    return this.evidenceByDevice()[device.device_id] ?? null;
  }

  protected evidenceResult(device: CameraDevice, key: 'rtsp_check' | 'snapshot' | 'share_link' | 'credential_status'): DeviceEvidenceResult | null {
    const evidence = this.evidenceFor(device);
    if (!evidence) {
      return null;
    }

    return evidence[key] ?? evidence.results?.find((result) => result.kind === key) ?? null;
  }

  protected shareLinksFor(device: CameraDevice): ShareLinkSummary[] {
    return this.shareLinks().filter((link) => link.device_id === device.device_id);
  }

  protected activeShareLinksFor(device: CameraDevice): ShareLinkSummary[] {
    return this.shareLinksFor(device).filter((link) => !link.revoked_at && link.status !== 'revoked');
  }

  protected deviceMeta(device: CameraDevice): string {
    const parts = [
      device.room,
      device.ip_address,
      device.vendor,
      device.model,
      device.discovery_source,
    ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
    return parts.length > 0 ? parts.join(' | ') : T('No metadata reported.');
  }

  protected credentialLabel(status: DeviceCredentialStatus | null): string {
    if (!status) {
      return T('Unknown');
    }
    if (!status.configured) {
      return T('Not configured');
    }
    return status.redacted ? T('Configured and redacted') : T('Configured');
  }

  protected evidenceLabel(result: DeviceEvidenceResult | null): string {
    return result?.status || result?.summary || T('Not checked');
  }

  protected evidenceDetail(result: DeviceEvidenceResult | null): string {
    if (!result) {
      return T('No recent evidence.');
    }
    return result.detail || result.error_message || result.action_path || result.endpoint || T('Evidence recorded.');
  }

  protected statusTone(status: string | null | undefined): HarborAssistantStatusTone {
    const normalized = String(status ?? '').trim().toLowerCase().replace(/_/g, '-');
    switch (normalized) {
      case 'ready':
      case 'ok':
      case 'healthy':
      case 'available':
      case 'completed':
      case 'current':
      case 'configured':
      case 'installed':
      case 'passed':
      case 'success':
      case 'reachable':
      case 'online':
      case 'connected':
      case 'active':
      case 'cached':
        return 'good';
      case 'blocked':
      case 'failed':
      case 'error':
      case 'unavailable':
      case 'offline':
      case 'disabled':
      case 'missing':
        return 'danger';
      case 'pending':
      case 'queued':
      case 'running':
      case 'downloading':
      case 'needs-config':
      case 'needs-index':
      case 'degraded':
      case 'skipped':
      case 'not-downloaded':
      case 'not-configured':
      case 'external':
      case 'partial':
        return 'warn';
      default:
        return 'neutral';
    }
  }

  protected toneClass(status: string | null | undefined): string {
    return `tone-${this.statusTone(status)}`;
  }

  protected userStatusLabel(status: string | null | undefined): string {
    const normalized = String(status ?? '').trim().toLowerCase().replace(/_/g, '-');
    switch (normalized) {
      case 'ready':
      case 'ok':
      case 'healthy':
      case 'available':
      case 'active':
        return T('Ready');
      case 'enabled':
        return T('Enabled');
      case 'disabled':
        return T('Disabled');
      case 'needs-model':
      case 'needs-config':
      case 'not-configured':
        return T('Model selection required');
      case 'downloading':
        return T('Downloading');
      case 'installed-not-running':
        return T('Installed, not running');
      case 'unsupported':
        return T('Not supported yet');
      case 'degraded':
        return T('Needs check');
      case 'missing':
        return T('Not found');
      case 'running':
      case 'pending':
      case 'queued':
        return T('Processing');
      case 'failed':
      case 'error':
        return T('Error');
      default:
        return status ? String(status) : T('Unknown');
    }
  }

  protected endpointError(key: string): string | null {
    return this.endpointErrors()[key] ?? null;
  }

  protected endpointErrorNotice(key: string): string {
    switch (key) {
      case 'models':
        return T('The model list could not refresh. Try again later.');
      case 'knowledgeSettings':
        return T('Data source settings could not refresh. Try again later.');
      case 'knowledgeIndexStatus':
        return T('Index status could not refresh. Saved data sources are shown.');
      default:
        return T('Some status data could not refresh. Try again later.');
    }
  }

  protected inferenceHealthValue(): string {
    const health = this.inferenceHealth();
    return health ? this.inferenceHealthLabel(health) : T('Unknown');
  }

  protected inferenceHealthClass(): string {
    const health = this.inferenceHealth();
    if (!health) {
      return 'tone-neutral';
    }
    return `tone-${this.inferenceHealthTone(health)}`;
  }

  protected metadataString(endpoint: ModelEndpointRecord | null | undefined, key: string): string {
    const value = endpoint?.metadata?.[key];
    return typeof value === 'string' ? value : '';
  }

  protected metadataBoolean(endpoint: ModelEndpointRecord | null | undefined, key: string): boolean {
    return endpoint?.metadata?.[key] === true;
  }

  protected progressLabel(job: LocalModelDownloadJob): string {
    if (this.isFailedJob(job)) {
      return T('Download failed');
    }
    if (['canceled', 'cancelled'].includes((job.status || '').toLowerCase())) {
      return T('Canceled');
    }
    if (typeof job.progress_percent === 'number') {
      return `${job.progress_percent}%`;
    }
    return job.status;
  }

  protected formatBytes(value: number | null | undefined): string {
    if (!value || value <= 0) {
      return T('n/a');
    }
    if (value >= 1024 * 1024 * 1024) {
      return `${(value / 1024 / 1024 / 1024).toFixed(1)} GiB`;
    }
    if (value >= 1024 * 1024) {
      return `${(value / 1024 / 1024).toFixed(1)} MiB`;
    }
    if (value >= 1024) {
      return `${(value / 1024).toFixed(1)} KiB`;
    }
    return `${value} B`;
  }

  protected capabilitiesByClass(capabilityClass: string): HarborOsImCapabilityItem[] {
    return (this.capabilityMap()?.items ?? []).filter((item) => item.capability_class === capabilityClass);
  }

  protected isCancelableJob(job: LocalModelDownloadJob): boolean {
    return ['queued', 'running', 'downloading'].includes((job.status || '').toLowerCase());
  }

  private buildAiSettingsTabs(): AiSettingsTab[] {
    const sourceSummary = this.ragValidationSourceSummary();
    const indexState = this.knowledgeIndexStatus();
    const modelRows = this.aiModelCapabilities();
    const configuredRequiredModels = modelRows
      .filter((row) => !row.optional)
      .filter((row) => this.workflowCurrentEndpoint(row.kind));
    const cloudMode = this.cloudApiForm.controls.usageMode.value as CloudUsageMode;

    return [
      {
        id: 'sources',
        label: T('Data sources'),
        summary: sourceSummary.enabled === 0
          ? T('No data sources yet')
          : this.statusTone(indexState?.status) === 'good'
            ? T('Indexed')
            : T('Needs indexing'),
        tone: sourceSummary.enabled > 0 && this.statusTone(indexState?.status) === 'good' ? 'good' : 'warn',
      },
      {
        id: 'models',
        label: T('Model'),
        summary: `${configuredRequiredModels.length}/${modelRows.filter((row) => !row.optional).length} ${T('Configured')}`,
        tone: configuredRequiredModels.length >= modelRows.filter((row) => !row.optional).length ? 'good' : 'warn',
      },
      {
        id: 'cloud-api',
        label: T('Cloud API'),
        summary: cloudMode === 'local_only' ? T('Local only') : this.cloudApiConfiguredLabel(),
        tone: cloudMode === 'local_only'
          ? 'good'
          : this.metadataBoolean(this.cloudEndpointForProvider(this.cloudApiForm.controls.provider.value), 'api_key_configured')
            ? 'good'
            : 'warn',
      },
    ];
  }

  private buildAiModelCapabilities(): AiModelCapability[] {
    const rows: AiModelCapability[] = [
      {
        id: 'question-understanding',
        capabilityId: 'semantic_router',
        label: T('Question understanding'),
        detail: T('Understand what the user wants and route it to search, Q&A, cameras, or system management.'),
        kind: 'llm',
        optional: false,
        cloudCapability: 'semantic_router',
      },
      {
        id: 'vector-search',
        capabilityId: 'embedder',
        label: T('Vector search'),
        detail: T('Generate embeddings so text, image descriptions, and video descriptions can be searched.'),
        kind: 'embedder',
        optional: false,
        cloudCapability: null,
      },
      {
        id: 'answer',
        capabilityId: 'retrieval_answer',
        label: T('Conversation answer'),
        detail: T('Generate answers and summaries from context and retrieved evidence.'),
        kind: 'llm',
        optional: false,
        cloudCapability: 'retrieval_answer',
      },
      {
        id: 'vision',
        capabilityId: 'vlm',
        label: T('Image/video understanding'),
        detail: T('Understand images, screenshots, DVR video keyframes, and video evidence.'),
        kind: 'vlm',
        optional: false,
        cloudCapability: null,
      },
      {
        id: 'ocr',
        capabilityId: 'ocr',
        label: T('Text recognition'),
        detail: T('Recognize text in images, scanned documents, and screenshots.'),
        kind: 'ocr',
        optional: true,
        cloudCapability: null,
      },
      {
        id: 'asr',
        capabilityId: 'asr',
        label: T('Speech-to-text'),
        detail: T('Extract speech text from audio and video.'),
        kind: 'asr',
        optional: true,
        cloudCapability: null,
      },
    ];
    return rows.filter((row) => !row.optional || this.modelCapabilityHasVisibleChoices(row.capabilityId));
  }

  private modelCapabilityChoiceCard(
    capabilityId: string,
    model: ModelCapabilityInstallableModel,
    section: CustomerModelSection,
  ): CustomerModelCard {
    const catalogModel = this.catalogModels().find((item) => item.model_id === model.model_id) ?? null;
    const capability = this.workflowCapabilityForKind(capabilityId);
    const runtimeActive = this.capabilityRuntimeMatchesModel(capability, model.model_id, model.local_path ?? catalogModel?.local_path ?? null);
    const selected = capability?.selected_model_id === model.model_id;
    const isCurrent = runtimeActive;
    const action: CustomerModelAction = section === 'installed'
      ? (isCurrent ? 'current' : 'set-current')
      : this.isFailedStatus(model.status) ? 'retry' : 'download';
    return {
      key: `${capabilityId}:${section}:${model.model_id}`,
      modelId: model.model_id,
      capabilityId,
      displayName: model.display_name || model.model_id,
      providerKey: model.provider_key || catalogModel?.provider_key || 'huggingface',
      kind: model.model_kind || catalogModel?.model_kind || capability?.model_kind || capabilityId,
      source: model.source_kind || catalogModel?.source_kind || 'huggingface',
      capabilities: model.expected_capabilities ?? catalogModel?.expected_capabilities ?? [capabilityId],
      sizeHint: model.download_size_hint ?? catalogModel?.download_size_hint ?? '',
      hardware: catalogModel?.recommended_hardware ?? '',
      hardwareFit: model.hardware_fit ?? catalogModel?.hardware_fit ?? 'compatible',
      fitReason: model.fit_reason ?? catalogModel?.fit_reason ?? '',
      recommendationGroup: model.recommendation_group ?? catalogModel?.recommendation_group ?? (section === 'installed' ? 'installed' : 'current_recommended'),
      status: model.status || (section === 'installed' ? 'ready' : 'needs-config'),
      tone: section === 'installed' ? 'good' : this.statusTone(model.status),
      localPath: model.local_path ?? catalogModel?.local_path ?? null,
      downloadJob: null,
      endpoint: null,
      action,
      actionLabel: action === 'current'
        ? T('Selected')
        : action === 'set-current'
          ? (selected ? T('Restart') : T('Select'))
          : action === 'retry'
            ? T('Download again')
            : T('Download'),
      progressLabel: null,
      bytesLabel: null,
      speedLabel: null,
      errorMessage: null,
      runtimeGuidance: null,
      evidence: [],
      section,
      catalogModel,
    };
  }

  private modelDownloadJobChoiceCard(
    capabilityId: string,
    job: LocalModelDownloadJob,
  ): CustomerModelCard {
    const catalogModel = this.catalogModels().find((item) => item.model_id === job.model_id) ?? null;
    const failed = this.isFailedJob(job);
    const needsManualSource = failed && catalogModel?.manual_only === true && catalogModel?.installable !== true;
    return {
      key: `${capabilityId}:download:${job.job_id}`,
      modelId: job.model_id,
      capabilityId,
      displayName: job.display_name || catalogModel?.display_name || job.model_id,
      providerKey: job.provider_key || catalogModel?.provider_key || 'huggingface',
      kind: catalogModel?.model_kind || capabilityId,
      source: catalogModel?.source_kind ?? 'huggingface',
      capabilities: catalogModel?.expected_capabilities ?? [capabilityId],
      sizeHint: catalogModel?.download_size_hint ?? '',
      hardware: catalogModel?.recommended_hardware ?? '',
      hardwareFit: catalogModel?.hardware_fit ?? 'compatible',
      fitReason: catalogModel?.fit_reason ?? '',
      recommendationGroup: catalogModel?.recommendation_group ?? 'current_recommended',
      status: job.status,
      tone: failed ? 'danger' : 'warn',
      localPath: job.target_path ?? null,
      downloadJob: job,
      endpoint: null,
      action: needsManualSource ? 'manual-source' : failed ? 'retry' : 'downloading',
      actionLabel: needsManualSource ? T('Enter download URL') : failed ? T('Download again') : T('Downloading'),
      progressLabel: this.progressLabel(job),
      bytesLabel: this.downloadBytesLabel(job),
      speedLabel: this.downloadSpeedLabel(job),
      errorMessage: job.error_message ?? null,
      runtimeGuidance: null,
      evidence: [],
      section: failed ? 'available' : 'downloading',
      catalogModel,
    };
  }

  private cloudEndpointModelCard(capabilityId: string, endpoint: ModelEndpointRecord): CustomerModelCard {
    const configured = this.metadataBoolean(endpoint, 'api_key_configured');
    const provider = this.metadataString(endpoint, 'provider_label') || endpoint.provider_key || T('Cloud');
    const displayName = endpoint.model_name || this.metadataString(endpoint, 'model') || endpoint.model_endpoint_id;
    return {
      key: `${capabilityId}:cloud:${endpoint.model_endpoint_id}`,
      modelId: displayName,
      capabilityId,
      displayName,
      providerKey: endpoint.provider_key || 'openai_compatible',
      kind: endpoint.model_kind || 'llm',
      source: provider,
      capabilities: endpoint.capability_tags ?? ['chat', 'cloud_fallback'],
      sizeHint: T('Cloud backup'),
      hardware: provider,
      hardwareFit: configured && endpoint.status === 'active' ? 'compatible' : 'needs_config',
      fitReason: configured ? T('Can be used as a controlled cloud backup model.') : T('API key is not configured, so it cannot run yet.'),
      recommendationGroup: 'cloud_backup',
      status: endpoint.status,
      tone: configured && endpoint.status === 'active' ? 'good' : 'warn',
      localPath: null,
      downloadJob: null,
      endpoint,
      action: 'configure-cloud',
      actionLabel: configured && endpoint.status === 'active' ? T('Manage cloud backup') : T('Configure API key'),
      progressLabel: null,
      bytesLabel: null,
      speedLabel: null,
      errorMessage: configured ? null : T('FlashV4 is not missing; the current cloud endpoint has no API key configured.'),
      runtimeGuidance: null,
      evidence: [],
      section: 'available',
      catalogModel: null,
    };
  }

  private modelCapabilityHasVisibleChoices(kind: string): boolean {
    const capability = this.workflowCapabilityForKind(kind);
    if (capability) {
      return Boolean(
        capability.current_model
          || capability.installed_models?.length
          || capability.installable_models?.length
          || capability.download_jobs?.length
          || this.workflowModelChoices(capability.capability_id).length,
      );
    }
    return Boolean(this.workflowCurrentEndpoint(kind))
      || this.customerModelCards().some((card) => {
        return this.modelCardMatchesWorkflowKind(card, kind)
          && ['installed', 'available', 'downloading'].includes(card.section);
      });
  }

  private buildAiWorkflowSummary(): AiWorkflowSummary {
    if (
      this.endpointError('models')
      || this.endpointError('rag')
      || this.endpointError('knowledgeSettings')
      || this.endpointError('knowledgeIndexStatus')
    ) {
      return {
        label: T('Model service needs attention'),
        detail: T('Saved settings can still be viewed and edited, but some status data could not refresh.'),
        tone: 'danger',
      };
    }

    if (this.modelCapabilityTone('embedder') !== 'good') {
      return {
        label: T('Vector search model required'),
        detail: T('Search and event retrieval require a vector search model.'),
        tone: 'warn',
      };
    }

    const sourceSummary = this.ragValidationSourceSummary();
    const indexState = this.knowledgeIndexStatus();
    if (sourceSummary.enabled === 0 || this.statusTone(indexState?.status) !== 'good') {
      return {
        label: T('Data indexing required'),
        detail: T('Add NAS folders and start indexing before HarborOS can search this content.'),
        tone: 'warn',
      };
    }

    if (this.modelCapabilityTone('vlm') !== 'good') {
      return {
        label: T('Image/video model required'),
        detail: T('Image and camera-event understanding will be limited until a vision model is selected and healthy.'),
        tone: 'warn',
      };
    }

    return {
      label: T('All available'),
      detail: T('The data sources, models, and index required for search are available.'),
      tone: 'good',
    };
  }

  private modelCapabilityTone(kind: string): HarborAssistantStatusTone {
    const capability = this.workflowCapabilityForKind(kind);
    if (capability) {
      switch (capability.status) {
        case 'ready':
          return 'good';
        case 'downloading':
        case 'installed_not_running':
          return 'warn';
        case 'unsupported':
          return 'neutral';
        default:
          return 'danger';
      }
    }
    const current = this.currentModelCards().find((card) => card.kind === kind);
    const installedChoices = this.workflowModelChoices(kind);
    const configured = current && current.tone === 'good';
    return configured ? 'good' : installedChoices.length > 0 ? 'warn' : 'danger';
  }

  private modelCardMatchesWorkflowKind(card: CustomerModelCard, kind: string): boolean {
    if (kind === 'vlm') {
      return this.isVlmModelCard(card);
    }
    const targetKinds = this.targetEndpointKinds(card.kind);
    if (kind === 'embedder') {
      return targetKinds.includes('embedder')
        || card.capabilities.some((capability) => this.endpointKindAliases('embedder').some((alias) => capability.toLowerCase().includes(alias)));
    }
    return targetKinds.includes(kind);
  }

  private filterModelLibraryCards(cards: CustomerModelCard[]): CustomerModelCard[] {
    const kind = this.modelLibraryKind();
    if (!kind) {
      return cards;
    }
    return cards.filter((card) => this.modelCardMatchesWorkflowKind(card, kind));
  }

  private workflowCapabilityForKind(kind: string): ModelCapabilityStatus | null {
    const capabilities = this.modelCapabilitiesResponse()?.capabilities ?? [];
    const exactCapability = capabilities.find((capability) => capability.capability_id === kind);
    if (exactCapability) {
      return exactCapability;
    }
    const normalized = this.targetEndpointKinds(kind)[0] ?? kind;
    if (normalized === 'llm') {
      return capabilities.find((capability) => capability.capability_id === 'semantic_router')
        ?? capabilities.find((capability) => capability.capability_id === 'retrieval_answer')
        ?? null;
    }
    if (normalized === 'embedder') {
      return capabilities.find((capability) => capability.capability_id === 'embedder') ?? null;
    }
    return capabilities.find((capability) => capability.model_kind === normalized || capability.capability_id === normalized) ?? null;
  }

  private modelCapabilityUserStatus(capability: ModelCapabilityStatus): string {
    switch (capability.status) {
      case 'ready':
        return T('Available');
      case 'downloading':
        return T('Downloading model');
      case 'installed_not_running':
        return T('Model is installed and the local model service needs to start');
      case 'unsupported':
        return T('Not supported yet');
      case 'degraded':
        return capability.next_action || T('Model service needs attention');
      default:
        return capability.next_action || T('Model selection required');
    }
  }

  private modelCardIsInstallable(card: CustomerModelCard): boolean {
    if (!card.catalogModel) {
      return card.source === 'huggingface' || Boolean(card.capabilityId);
    }
    return card.catalogModel.installable === true && card.catalogModel.manual_only !== true;
  }

  private modelSelectionSuccessMessage(card: CustomerModelCard): string {
    return this.modelCardRuntimeIsActive(card)
      ? T('Model is selected and running.')
      : T('Model startup has been requested. Refreshing runtime status.');
  }

  private modelCardRuntimeIsActive(card: CustomerModelCard): boolean {
    const capability = card.capabilityId ? this.workflowCapabilityForKind(card.capabilityId) : null;
    return this.capabilityRuntimeMatchesModel(capability, card.modelId, card.localPath);
  }

  private capabilityRuntimeMatchesModel(
    capability: ModelCapabilityStatus | null | undefined,
    modelId: string,
    localPath: string | null | undefined,
  ): boolean {
    if (!capability) {
      return false;
    }
    const runtimeModel = capability.runtime_model_id?.trim()
      || (capability.runtime_ready ? capability.current_model?.model_name?.trim() : '');
    if (!runtimeModel) {
      return false;
    }
    return [modelId, localPath ?? '']
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .some((value) => value === runtimeModel);
  }

  private endpointCardsForValidation(): CurrentModelCard[] {
    const cards = this.currentModelCards();
    return ['llm', 'embedder', 'vlm']
      .map((kind) => cards.find((card) => card.kind === kind))
      .filter((card): card is CurrentModelCard => Boolean(card));
  }

  private buildRagValidationImageStats(): RagValidationStat[] {
    const indexState = this.knowledgeIndexStatus();
    const imageCount = indexState?.image_count ?? 0;
    const contentIndexed = indexState?.content_indexed_image_count ?? 0;
    const vlmIndexed = indexState?.vlm_indexed_image_count ?? 0;

    return [
      {
        id: 'image_count',
        label: T('image_count'),
        value: String(imageCount),
        tone: imageCount > 0 ? 'good' : 'warn',
      },
      {
        id: 'content_indexed_image_count',
        label: T('content_indexed_image_count'),
        value: String(contentIndexed),
        tone: this.countCoverageTone(contentIndexed, imageCount),
      },
      {
        id: 'vlm_indexed_image_count',
        label: T('vlm_indexed_image_count'),
        value: String(vlmIndexed),
        tone: this.countCoverageTone(vlmIndexed, imageCount),
      },
    ];
  }

  private buildRagValidationSourceSummary(): RagSourceRootSummary {
    const roots = this.knowledgeSourceRoots();
    const sourceStatuses = this.knowledgeIndexStatus()?.source_roots ?? [];
    const enabled = roots.filter((root) => root.enabled).length;
    const existing = sourceStatuses.filter((root) => root.enabled && root.exists).length;
    const hasBlockedStatus = sourceStatuses.some((root) => this.statusTone(root.status) === 'danger');
    const status = roots.length === 0
      ? T('No roots')
      : hasBlockedStatus
        ? T('Blocked')
        : enabled > 0
          ? T('Ready')
          : T('Disabled');

    return {
      total: roots.length,
      enabled,
      existing,
      status,
      tone: roots.length === 0 ? 'warn' : hasBlockedStatus ? 'danger' : enabled > 0 ? 'good' : 'warn',
    };
  }

  private countCoverageTone(indexedCount: number, totalCount: number): HarborAssistantStatusTone {
    if (totalCount <= 0) {
      return 'neutral';
    }
    return indexedCount >= totalCount ? 'good' : indexedCount > 0 ? 'warn' : 'danger';
  }

  private buildCurrentModelCards(): CurrentModelCard[] {
    return ['llm', 'vlm', 'embedder', 'ocr', 'asr'].map((kind) => {
      const endpoint = this.currentEndpointByKind(kind);
      const catalogModel = endpoint ? this.catalogModelForEndpoint(endpoint) : null;
      const endpointModelName = endpoint?.model_name ?? '';
      const localPath = endpoint
        ? this.metadataString(endpoint, 'local_path') || (endpointModelName.startsWith('/') ? endpointModelName : '')
        : '';
      return {
        kind,
        label: this.modelKindLabel(kind),
        modelName: catalogModel?.display_name || endpointModelName || T('Not configured'),
        providerKey: endpoint?.provider_key ?? T('n/a'),
        status: endpoint?.status ?? T('not-configured'),
        tone: endpoint ? this.statusTone(endpoint.status) : 'warn',
        baseUrl: endpoint ? this.metadataString(endpoint, 'base_url') : '',
        localPath,
        endpoint,
      };
    });
  }

  private catalogModelForEndpoint(endpoint: ModelEndpointRecord): LocalModelCatalogItem | null {
    const endpointModelName = endpoint.model_name ?? '';
    const endpointLocalPath = this.metadataString(endpoint, 'local_path');
    return this.catalogModels().find((model) => {
      return model.model_id === endpointModelName
        || Boolean(model.local_path && model.local_path === endpointModelName)
        || Boolean(endpointLocalPath && model.local_path === endpointLocalPath);
    }) ?? null;
  }

  private buildCustomerModelCards(): CustomerModelCard[] {
    const catalogById = new Map<string, LocalModelCatalogItem>();
    this.catalogModels().forEach((model) => catalogById.set(model.model_id, model));

    this.downloadJobs().forEach((job) => {
      if (!catalogById.has(job.model_id)) {
        catalogById.set(job.model_id, {
          model_id: job.model_id,
          display_name: job.display_name || job.model_id,
          provider_key: job.provider_key || 'local',
          model_kind: 'llm',
          recommended_hardware: T('Unknown'),
          status: job.status,
          local_path: job.target_path ?? null,
          download_size_hint: '',
          evidence: [],
        });
      }
    });

    return Array.from(catalogById.values())
      .map((model) => this.buildCustomerModelCard(model))
      .sort((left, right) => this.compareCustomerModelCards(left, right));
  }

  private findLocalVlmModelCard(): CustomerModelCard | null {
    const cards = this.customerModelCards().filter((card) => this.isVlmModelCard(card));
    return cards.find((card) => card.action === 'current')
      ?? cards.find((card) => card.section === 'installed')
      ?? cards.find((card) => card.section === 'downloading')
      ?? cards[0]
      ?? null;
  }

  private isVlmModelCard(card: CustomerModelCard): boolean {
    return this.modelKindIncludesVlm(card.kind)
      || card.capabilities.some((capability) => this.modelCapabilityIncludesVlm(capability));
  }

  private buildCustomerModelCard(model: LocalModelCatalogItem): CustomerModelCard {
    const jobs = this.downloadJobs()
      .filter((job) => job.model_id === model.model_id)
      .sort((left, right) => this.downloadJobTimestamp(right) - this.downloadJobTimestamp(left));
    const activeJob = jobs.find((job) => this.isCancelableJob(job)) ?? null;
    const latestTerminalJob = jobs.find((job) => !this.isCancelableJob(job)) ?? null;
    const failedJob = latestTerminalJob && this.isFailedJob(latestTerminalJob) ? latestTerminalJob : null;
    const latestJob = activeJob ?? latestTerminalJob ?? jobs[0] ?? null;
    const endpoint = this.endpointForModel(model);
    const installed = !failedJob && this.isInstalledModel(model);
    const current = installed && this.isCurrentModel(model);
    const action: CustomerModelAction = activeJob
      ? 'downloading'
      : failedJob
        ? 'retry'
        : current
          ? 'current'
          : installed
            ? 'set-current'
            : 'download';
    const status = activeJob?.status
      ?? (current
        ? T('current')
        : failedJob?.status
          ?? (installed
            ? model.status || T('installed')
            : model.status || T('available')));

    return {
      key: `${model.model_id}:${latestJob?.job_id ?? model.local_path ?? 'catalog'}`,
      modelId: model.model_id,
      displayName: model.display_name || model.model_id,
      providerKey: model.provider_key || latestJob?.provider_key || 'local',
      kind: model.model_kind || 'llm',
      source: model.repo_id || model.source_kind || model.provider_key || T('Catalog'),
      capabilities: this.modelCapabilities(model),
      sizeHint: model.download_size_hint || this.formatBytes(model.size_bytes),
      hardware: model.recommended_hardware || T('No hardware hint'),
      hardwareFit: model.hardware_fit ?? 'compatible',
      fitReason: model.fit_reason ?? '',
      recommendationGroup: model.recommendation_group ?? (installed ? 'installed' : 'current_recommended'),
      status,
      tone: current ? 'good' : this.statusTone(status),
      localPath: model.local_path ?? latestJob?.target_path ?? null,
      downloadJob: latestJob,
      endpoint,
      action,
      actionLabel: this.modelActionLabel(action),
      progressLabel: latestJob ? this.progressLabel(latestJob) : null,
      bytesLabel: latestJob ? this.downloadBytesLabel(latestJob) : null,
      speedLabel: latestJob ? this.downloadSpeedLabel(latestJob) : null,
      errorMessage: latestJob?.error_message ?? null,
      runtimeGuidance: null,
      evidence: model.evidence ?? [],
      section: activeJob ? 'downloading' : installed ? 'installed' : 'available',
      catalogModel: model,
    };
  }

  private compareCustomerModelCards(left: CustomerModelCard, right: CustomerModelCard): number {
    const sectionRank: Record<CustomerModelSection, number> = {
      downloading: 0,
      installed: 1,
      available: 2,
    };
    const sectionDiff = sectionRank[left.section] - sectionRank[right.section];
    if (sectionDiff !== 0) {
      return sectionDiff;
    }
    const hardwareDiff = this.hardwareCompatibilityRank(left) - this.hardwareCompatibilityRank(right);
    if (hardwareDiff !== 0) {
      return hardwareDiff;
    }
    return left.displayName.localeCompare(right.displayName);
  }

  private currentEndpointByKind(kind: string): ModelEndpointRecord | null {
    const endpoints = this.modelEndpoints().filter((endpoint) => this.endpointKindMatches(endpoint, kind));
    return endpoints.find((endpoint) => this.statusTone(endpoint.status) === 'good') ?? endpoints[0] ?? null;
  }

  private endpointForModel(model: LocalModelCatalogItem): ModelEndpointRecord | null {
    const localPath = model.local_path?.trim();
    const modelId = model.model_id.trim();
    const endpointKinds = this.targetEndpointKinds(model.model_kind);
    return this.modelEndpoints().find((endpoint) => {
      return endpointKinds.some((kind) => this.endpointKindMatches(endpoint, kind))
        && this.endpointMatchesModel(endpoint, localPath, modelId);
    }) ?? null;
  }

  private isCurrentModel(model: LocalModelCatalogItem): boolean {
    const localPath = model.local_path?.trim();
    const modelId = model.model_id.trim();
    return this.targetEndpointKinds(model.model_kind).every((kind) => {
      const endpoint = this.endpointForKind(kind);
      return Boolean(endpoint
        && this.statusTone(endpoint.status) === 'good'
        && this.endpointMatchesModel(endpoint, localPath, modelId));
    });
  }

  private isInstalledModel(model: LocalModelCatalogItem): boolean {
    const status = (model.status || '').toLowerCase().replace(/_/g, '-');
    const hasPositiveSize = typeof model.size_bytes !== 'number' || model.size_bytes > 0;
    const latestStatus = this.latestDownloadStatus(model.model_id);
    const latestDownloadFailed = latestStatus ? this.isFailedStatus(latestStatus) : false;
    return !latestDownloadFailed
      && hasPositiveSize
      && (Boolean(model.installed || model.local_path)
        || ['installed', 'cached', 'ready', 'completed'].includes(status));
  }

  private modelCapabilities(model: LocalModelCatalogItem): string[] {
    if (model.expected_capabilities?.length) {
      return model.expected_capabilities;
    }
    return (model.model_kind || 'llm')
      .split(/[,+/ ]+/)
      .map((capability) => capability.trim())
      .filter((capability) => capability.length > 0);
  }

  private modelActionLabel(action: CustomerModelAction): string {
    switch (action) {
      case 'downloading':
        return T('Downloading');
      case 'set-current':
        return T('Set as current model');
      case 'current':
        return T('Current model');
      case 'retry':
        return T('Download again');
      case 'manual-source':
        return T('Enter download URL');
      case 'configure-cloud':
        return T('Configure API key');
      case 'download':
      default:
        return T('Download');
    }
  }

  private downloadBytesLabel(job: LocalModelDownloadJob): string {
    return `${this.formatBytes(job.bytes_downloaded)} / ${this.formatBytes(job.total_bytes)}`;
  }

  private downloadSpeedLabel(job: LocalModelDownloadJob): string {
    const bytesPerSecond = this.metadataNumber(job.metadata, 'bytes_per_second')
      ?? this.metadataNumber(job.metadata, 'download_speed_bps')
      ?? this.metadataNumber(job.metadata, 'speed_bps');
    return bytesPerSecond ? `${this.formatBytes(bytesPerSecond)}/s` : T('Speed pending');
  }

  private hardwareCompatibilityRank(card: CustomerModelCard): number {
    if (card.section !== 'available') {
      return 0;
    }
    switch (card.recommendationGroup) {
      case 'current_recommended':
        return 0;
      case 'lightweight_local':
        return 1;
      case 'cloud_backup':
        return 2;
      case 'installed_not_recommended':
        return 3;
      case 'high_end_experimental':
        return 4;
      default:
        break;
    }
    if (card.hardwareFit === 'not_recommended') {
      return 4;
    }
    const hint = card.hardware.toLowerCase();
    if (!hint || hint.includes('unknown')) {
      return 1;
    }
    if (hint.includes('multi') || hint.includes('60gb') || hint.includes('80gb')) {
      return 2;
    }
    if (hint.includes('16') || hint.includes('24') || hint.includes('gpu') || hint.includes('cpu')) {
      return 0;
    }
    return 1;
  }

  private modelKindLabel(kind: string): string {
    switch (kind) {
      case 'llm':
        return T('Conversation answer');
      case 'vlm':
        return T('Image/video understanding');
      case 'embedder':
        return T('Vector search');
      case 'ocr':
        return T('Text recognition');
      case 'asr':
        return T('Speech-to-text');
      default:
        return kind;
    }
  }

  private targetEndpointKinds(kind: string): string[] {
    const normalized = (kind || 'llm').trim().toLowerCase();
    if (normalized === 'llm_vlm' || normalized === 'llm+vlm' || normalized === 'multimodal') {
      return ['llm', 'vlm'];
    }
    if (normalized === 'embedding') {
      return ['embedder'];
    }
    return [normalized || 'llm'];
  }

  private modelKindIncludesVlm(kind: string): boolean {
    const normalized = (kind || '').trim().toLowerCase();
    return this.targetEndpointKinds(kind).includes('vlm')
      || normalized.includes('vlm')
      || normalized.includes('vision')
      || normalized.includes('multimodal');
  }

  private modelCapabilityIncludesVlm(capability: string): boolean {
    const normalized = capability.trim().toLowerCase();
    return normalized.includes('vlm')
      || normalized.includes('vision')
      || normalized.includes('image')
      || normalized.includes('multimodal');
  }

  private endpointForKind(kind: string): ModelEndpointRecord | null {
    const endpoints = this.modelEndpoints().filter((endpoint) => this.endpointKindMatches(endpoint, kind));
    return endpoints.find((endpoint) => this.metadataString(endpoint, 'base_url').trim().length > 0)
      ?? endpoints[0]
      ?? null;
  }

  private uniqueEndpointsForKinds(kinds: string[]): ModelEndpointRecord[] {
    const selected = new Map<string, ModelEndpointRecord>();
    kinds.forEach((kind) => {
      const endpoint = this.endpointForKind(kind);
      if (endpoint) {
        selected.set(endpoint.model_endpoint_id, endpoint);
      }
    });
    return Array.from(selected.values());
  }

  private endpointKindMatches(endpoint: ModelEndpointRecord, targetKind: string): boolean {
    const endpointKind = (endpoint.model_kind || '').trim().toLowerCase();
    return this.endpointKindAliases(targetKind).includes(endpointKind);
  }

  private endpointKindAliases(kind: string): string[] {
    const normalized = (kind || 'llm').trim().toLowerCase();
    switch (normalized) {
      case 'llm':
        return ['llm', 'chat'];
      case 'embedder':
      case 'embedding':
      case 'embeddings':
        return ['embedder', 'embedding', 'embeddings'];
      case 'vlm':
        return ['vlm', 'vision'];
      case 'ocr':
        return ['ocr'];
      case 'asr':
        return ['asr'];
      default:
        return [normalized];
    }
  }

  private endpointMatchesModel(endpoint: ModelEndpointRecord, localPath: string | undefined, modelId: string): boolean {
    const endpointLocalPath = this.metadataString(endpoint, 'local_path');
    const catalogModelId = this.metadataString(endpoint, 'catalog_model_id');
    return (Boolean(localPath) && (endpoint.model_name === localPath || endpointLocalPath === localPath))
      || endpoint.model_name === modelId
      || catalogModelId === modelId;
  }

  private scrollEndpointEditorIntoView(): void {
    window.setTimeout(() => {
      const editor = document.querySelector('.endpoint-editor-card');
      editor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = editor?.querySelector('input, textarea, mat-select') as HTMLElement | null;
      firstInput?.focus();
    });
  }

  private scrollSelectorIntoView(selector: string): void {
    window.setTimeout(() => {
      const element = document.querySelector(selector);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = element?.querySelector('input, textarea, mat-select') as HTMLElement | null;
      firstInput?.focus();
    });
  }

  private editableEndpointMetadata(endpoint: ModelEndpointRecord): Record<string, unknown> {
    const metadata: Record<string, unknown> = { ...(endpoint.metadata ?? {}) };
    [
      'projection_mismatch',
      'projection_mismatch_reason',
      'projection_source',
      'runtime_ready',
      'runtime_backend_kind',
      'runtime_chat_model',
      'runtime_embedding_model',
      'runtime_note',
      'runtime_error',
    ].forEach((key) => delete metadata[key]);
    return metadata;
  }

  private downloadJobTimestamp(job: LocalModelDownloadJob): number {
    const raw = job.updated_at ?? job.completed_at ?? job.started_at ?? job.requested_at;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  }

  private latestDownloadJobs(jobs: LocalModelDownloadJob[]): LocalModelDownloadJob[] {
    const latestByModel = new Map<string, LocalModelDownloadJob>();
    jobs.forEach((job) => {
      const key = job.model_id?.trim() || job.job_id;
      const existing = latestByModel.get(key);
      if (!existing || this.downloadJobTimestamp(job) >= this.downloadJobTimestamp(existing)) {
        latestByModel.set(key, job);
      }
    });
    return Array.from(latestByModel.values())
      .sort((left, right) => this.downloadJobTimestamp(right) - this.downloadJobTimestamp(left));
  }

  private latestDownloadStatus(modelId: string): string | null {
    const latest = this.downloadJobs()
      .filter((job) => job.model_id === modelId)
      .sort((left, right) => this.downloadJobTimestamp(right) - this.downloadJobTimestamp(left))[0];
    return latest?.status ?? null;
  }

  private isFailedJob(job: LocalModelDownloadJob): boolean {
    return this.isFailedStatus(job.status);
  }

  private isFailedStatus(status: string | null | undefined): boolean {
    return ['failed', 'error', 'canceled', 'cancelled'].includes((status || '').toLowerCase());
  }

  private metadataNumber(metadata: Record<string, unknown> | undefined, key: string): number | null {
    const value = metadata?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private pollModelDownloadsIfNeeded(): void {
    if (this.downloadPollInProgress() || !this.hasActiveDownloadJobs(this.downloadJobs())) {
      return;
    }

    this.downloadPollInProgress.set(true);
    this.harborAssistantApi.getLocalModelDownloads().pipe(
      finalize(() => this.downloadPollInProgress.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (downloads) => {
        this.localDownloads.set(downloads);
        if (!this.hasActiveDownloadJobs(downloads.jobs)) {
          this.loadData();
        }
      },
      error: (error: unknown) => {
        this.endpointErrors.set({
          ...this.endpointErrors(),
          localDownloads: `local-downloads: ${this.getErrorMessage(error)}`,
        });
      },
    });
  }

  private hasActiveDownloadJobs(jobs: LocalModelDownloadJob[]): boolean {
    return jobs.some((job) => this.isCancelableJob(job));
  }

  private loadData(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.fetchPageData().pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (pageData) => {
        this.applyPageData(pageData);
        this.refreshDeferredStatus();
      },
      error: (error: unknown) => {
        this.loadError.set(this.getErrorMessage(error));
        this.clearData();
      },
    });
  }

  private fetchPageData(): Observable<HarborAssistantPageData> {
    return this.result('state', this.harborAssistantApi.getState()).pipe(
      switchMap((state) => forkJoin({
        state: of(state),
        gatewayStatus: this.result('gateway', this.harborAssistantApi.getGatewayStatus()),
        inferenceHealth: this.result('inference', this.harborAssistantApi.getInferenceHealth()),
        notificationTargets: this.result('notification-targets', this.harborAssistantApi.getNotificationTargets()),
        modelEndpoints: this.result('models', this.harborAssistantApi.getModelEndpoints()),
        modelCapabilities: this.result('model-capabilities', this.harborAssistantApi.getModelCapabilities()),
        modelPolicies: this.result('model-policies', this.harborAssistantApi.getModelPolicies()),
        localCatalog: of<EndpointResult<LocalModelCatalogResponse>>({ data: this.localCatalog(), error: null }),
        localDownloads: this.result('local-downloads', this.harborAssistantApi.getLocalModelDownloads()),
        hardware: of<EndpointResult<HardwareReadinessResponse>>({ data: this.hardware(), error: null }),
        rag: of<EndpointResult<RagReadinessResponse>>({ data: this.rag(), error: null }),
        knowledgeSettings: this.result('knowledge-settings', this.harborAssistantApi.getKnowledgeSettings()),
        knowledgeIndexStatus: this.result('knowledge-index-status', this.harborAssistantApi.getKnowledgeIndexStatus()),
        dvrSettings: this.result('dvr-settings', this.harborAssistantApi.getDvrRecordingSettings()),
        dvrStatus: this.result('dvr-status', this.harborAssistantApi.getDvrRecordingStatus()),
        dvrTimeline: this.result('dvr-timeline', this.harborAssistantApi.getDvrTimeline()),
        harborOs: this.result('harboros', this.harborAssistantApi.getHarborOsStatus()),
        capabilityMap: this.result('harboros-capabilities', this.harborAssistantApi.getHarborOsImCapabilityMap()),
        shareLinks: this.result('share-links', this.harborAssistantApi.getShareLinks()),
        automationReviews: this.result('automation-reviews', this.harborAssistantApi.getAutomationReviews()),
        evidenceEntries: this.getDeviceEvidenceEntries(state.data?.devices ?? []),
      }).pipe(
        map((payload) => {
          const evidenceByDevice: Record<string, DeviceEvidenceResponse> = {};
          const evidenceErrors: Record<string, string> = {};
          payload.evidenceEntries.forEach(([deviceId, evidence, error]) => {
            if (evidence) {
              evidenceByDevice[deviceId] = evidence;
            }
            if (error) {
              evidenceErrors[`device-evidence:${deviceId}`] = error;
            }
          });

          return {
            state: payload.state,
            gatewayStatus: payload.gatewayStatus,
            inferenceHealth: payload.inferenceHealth,
            notificationTargets: payload.notificationTargets,
            modelEndpoints: payload.modelEndpoints,
            modelCapabilities: payload.modelCapabilities,
            modelPolicies: payload.modelPolicies,
            localCatalog: payload.localCatalog,
            localDownloads: payload.localDownloads,
            hardware: payload.hardware,
            rag: payload.rag,
            knowledgeSettings: payload.knowledgeSettings,
            knowledgeIndexStatus: payload.knowledgeIndexStatus,
            dvrSettings: payload.dvrSettings,
            dvrStatus: payload.dvrStatus,
            dvrTimeline: payload.dvrTimeline,
            harborOs: payload.harborOs,
            capabilityMap: payload.capabilityMap,
            shareLinks: payload.shareLinks,
            automationReviews: payload.automationReviews,
            evidenceByDevice,
            evidenceErrors,
          };
        }),
      )),
    );
  }

  private getDeviceEvidenceEntries(devices: CameraDevice[]): Observable<DeviceEvidenceEntry[]> {
    if (devices.length === 0) {
      return of([]);
    }

    return forkJoin(
      devices.map((device) => this.harborAssistantApi.getDeviceEvidence(device.device_id).pipe(
        map((evidence): DeviceEvidenceEntry => [device.device_id, evidence, null]),
        catchError((error: unknown) => of<DeviceEvidenceEntry>([device.device_id, null, this.getErrorMessage(error)])),
      )),
    );
  }

  private refreshDeferredStatus(): void {
    forkJoin({
      localCatalog: this.result('local-catalog', this.harborAssistantApi.getLocalModelCatalog()),
      hardware: this.result('hardware', this.harborAssistantApi.getHardwareReadiness()),
      rag: this.result('rag', this.harborAssistantApi.getRagReadiness()),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((payload) => {
      this.localCatalog.set(payload.localCatalog.data ?? this.localCatalog());
      this.hardware.set(payload.hardware.data ?? this.hardware());
      this.rag.set(payload.rag.data ?? this.rag());
      this.mergeEndpointErrors({
        localCatalog: payload.localCatalog.error,
        hardware: payload.hardware.error,
        rag: payload.rag.error,
      });
    });
  }

  private refreshCameraState(): void {
    this.harborAssistantApi.getState().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (state) => {
        this.state.set(state);
        this.patchDefaultForms(state);
        this.ensureSelectedDevice(state.devices ?? [], state.defaults?.selected_camera_device_id ?? null);
      },
      error: (error: unknown) => {
        this.mergeEndpointErrors({
          state: `state: ${this.getErrorMessage(error)}`,
        });
      },
    });
  }

  private mergeEndpointErrors(errors: Record<string, string | null>): void {
    const next = { ...this.endpointErrors() };
    Object.entries(errors).forEach(([key, error]) => {
      if (error) {
        next[key] = error;
      } else {
        delete next[key];
      }
    });
    this.endpointErrors.set(next);
  }

  private result<T>(key: string, request: Observable<T>): Observable<EndpointResult<T>> {
    return request.pipe(
      map((data): EndpointResult<T> => ({ data, error: null })),
      catchError((error: unknown) => of({
        data: null,
        error: `${key}: ${this.getErrorMessage(error)}`,
      })),
    );
  }

  private applyPageData(pageData: HarborAssistantPageData): void {
    this.state.set(pageData.state.data);
    this.gatewayStatus.set(pageData.gatewayStatus.data);
    this.inferenceHealth.set(pageData.inferenceHealth.data);
    this.notificationTargetsResponse.set(pageData.notificationTargets.data);
    this.modelEndpointsResponse.set(pageData.modelEndpoints.data);
    this.modelCapabilitiesResponse.set(pageData.modelCapabilities.data);
    this.modelPoliciesResponse.set(pageData.modelPolicies.data);
    this.localCatalog.set(pageData.localCatalog.data);
    this.localDownloads.set(pageData.localDownloads.data);
    this.hardware.set(pageData.hardware.data);
    this.rag.set(pageData.rag.data);
    this.knowledgeSettings.set(pageData.knowledgeSettings.data);
    this.knowledgeIndexStatus.set(pageData.knowledgeIndexStatus.data);
    this.dvrSettings.set(pageData.dvrSettings.data);
    this.dvrStatus.set(pageData.dvrStatus.data);
    this.dvrTimeline.set(pageData.dvrTimeline.data);
    this.harborOs.set(pageData.harborOs.data);
    this.capabilityMap.set(pageData.capabilityMap.data);
    this.shareLinks.set(pageData.shareLinks.data ?? []);
    this.automationReviews.set(pageData.automationReviews.data?.reviews ?? []);
    this.evidenceByDevice.set(pageData.evidenceByDevice);

    const errors = Object.fromEntries(
      Object.entries({
        state: pageData.state.error,
        gateway: pageData.gatewayStatus.error,
        inference: pageData.inferenceHealth.error,
        notificationTargets: pageData.notificationTargets.error,
        models: pageData.modelEndpoints.error,
        modelCapabilities: pageData.modelCapabilities.error,
        modelPolicies: pageData.modelPolicies.error,
        localCatalog: pageData.localCatalog.error,
        localDownloads: pageData.localDownloads.error,
        hardware: pageData.hardware.error,
        rag: pageData.rag.error,
        knowledgeSettings: pageData.knowledgeSettings.error,
        knowledgeIndexStatus: pageData.knowledgeIndexStatus.error,
        dvrSettings: pageData.dvrSettings.error,
        dvrStatus: pageData.dvrStatus.error,
        dvrTimeline: pageData.dvrTimeline.error,
        harborOs: pageData.harborOs.error,
        capabilityMap: pageData.capabilityMap.error,
        shareLinks: pageData.shareLinks.error,
        automationReviews: pageData.automationReviews.error,
        ...pageData.evidenceErrors,
      }).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0),
    );
    this.endpointErrors.set(errors);
    this.loadError.set(pageData.state.error);

    if (pageData.state.data) {
      this.patchDefaultForms(pageData.state.data);
      this.ensureSelectedDevice(pageData.state.data.devices ?? [], pageData.state.data.defaults?.selected_camera_device_id ?? null);
    }
    this.patchKnowledgeForms(pageData.knowledgeSettings.data);
    this.patchDvrForm(pageData.dvrSettings.data);
    this.ensureSelectedPolicy();
    this.patchCloudApiForm();
  }

  private clearData(): void {
    this.state.set(null);
    this.gatewayStatus.set(null);
    this.inferenceHealth.set(null);
    this.notificationTargetsResponse.set(null);
    this.modelEndpointsResponse.set(null);
    this.modelCapabilitiesResponse.set(null);
    this.modelPoliciesResponse.set(null);
    this.localCatalog.set(null);
    this.localDownloads.set(null);
    this.hardware.set(null);
    this.rag.set(null);
    this.knowledgeSettings.set(null);
    this.knowledgeIndexStatus.set(null);
    this.dvrSettings.set(null);
    this.dvrStatus.set(null);
    this.dvrTimeline.set(null);
    this.filesBrowse.set(null);
    this.harborOs.set(null);
    this.capabilityMap.set(null);
    this.shareLinks.set([]);
    this.automationReviews.set([]);
    this.evidenceByDevice.set({});
    this.endpointErrors.set({});
  }

  private patchDefaultForms(state: AdminStateResponse): void {
    const defaults = state.defaults ?? {};

    if (!this.scanForm.dirty) {
      this.scanForm.patchValue({
        cidr: this.normalizedScanCidr(defaults.cidr ?? ''),
        protocol: defaults.discovery ?? 'rtsp',
        rtspPort: String(defaults.rtsp_port ?? 554),
        username: defaults.rtsp_username ?? '',
        password: '',
      });
    }

    if (!this.defaultsForm.dirty) {
      this.defaultsForm.patchValue({
        cidr: defaults.cidr ?? '',
        discovery: defaults.discovery ?? '',
        recording: defaults.recording ?? '',
        capture: defaults.capture ?? '',
        ai: defaults.ai ?? '',
        notificationChannel: defaults.notification_channel ?? '',
        rtspUsername: defaults.rtsp_username ?? '',
        rtspPassword: '',
        rtspPort: String(defaults.rtsp_port ?? 554),
        rtspPaths: (defaults.rtsp_paths ?? []).join('\n'),
        selectedCameraDeviceId: defaults.selected_camera_device_id ?? '',
        captureSubdirectory: defaults.capture_subdirectory ?? '',
        clipLengthSeconds: String(defaults.clip_length_seconds ?? 30),
        keyframeCount: String(defaults.keyframe_count ?? 3),
        keyframeIntervalSeconds: String(defaults.keyframe_interval_seconds ?? 5),
      });
    }

    if (!this.credentialsForm.dirty) {
      this.credentialsForm.patchValue({
        username: defaults.rtsp_username ?? '',
        password: '',
        rtspPort: String(defaults.rtsp_port ?? 554),
        rtspPaths: (defaults.rtsp_paths ?? []).join('\n'),
      });
    }
  }

  private patchKnowledgeForms(settings: KnowledgeSettings | null): void {
    if (!settings) {
      return;
    }

    if (!this.knowledgeIndexForm.dirty) {
      this.knowledgeIndexForm.patchValue({
        indexRoot: settings.index_root ?? '',
        privacyLevel: settings.privacy_level ?? 'strict_local',
        resourceProfile: settings.default_resource_profile ?? 'cpu_only',
      });
    }

    if (!this.knowledgeSourceForm.dirty) {
      this.clearKnowledgeSourceForm();
    }
  }

  private patchDvrForm(settings: DvrRecordingSettings | null): void {
    if (!settings || this.dvrForm.dirty) {
      return;
    }
    this.dvrForm.patchValue({
      recordingRoot: settings.recording_root ?? '',
      mediaLibraryRoot: settings.media_library_root ?? '',
      retentionDays: String(settings.retention_days ?? 7),
      segmentSeconds: String(settings.segment_seconds ?? 60),
      continuousRecordingEnabled: Boolean(settings.continuous_recording_enabled),
      lowBitrateStreamPreferred: Boolean(settings.low_bitrate_stream_preferred),
      continuousBitrateMbps: String(settings.continuous_bitrate_mbps ?? 2),
      diskBudgetGb: String(settings.disk_budget_gb ?? 64),
      continuousStreamPathHint: settings.continuous_stream_path_hint ?? '',
      highResStreamPathHint: settings.high_res_stream_path_hint ?? '',
      highResEventClipsEnabled: Boolean(settings.high_res_event_clips_enabled),
      highResEventClipSeconds: String(settings.high_res_event_clip_seconds ?? 20),
      keyframeCount: String(settings.keyframe_count ?? 3),
      keyframeIntervalSeconds: String(settings.keyframe_interval_seconds ?? 5),
      enabledDeviceIds: [...(settings.enabled_device_ids ?? [])],
    });
  }

  private patchCloudApiForm(): void {
    if (this.cloudApiForm.dirty) {
      return;
    }

    const endpoint = this.preferredCloudEndpoint();
    const providerValue = this.cloudProviderFromEndpoint(endpoint);
    const provider = this.cloudProviderOption(providerValue);
    const baseUrl = this.metadataString(endpoint, 'base_url') || provider.defaultBaseUrl;
    const modelName = endpoint?.model_name || this.metadataString(endpoint, 'model') || provider.defaultModelName;
    const cloudMode = this.cloudUsageModeFromPolicies();
    const enabledCapabilities = this.cloudEnabledCapabilitiesFromPolicies();

    this.cloudApiForm.patchValue({
      provider: provider.value,
      baseUrl,
      modelName,
      apiKey: '',
      usageMode: cloudMode,
      allowQuestionUnderstanding: enabledCapabilities.includes('semantic_router'),
      allowAnswer: enabledCapabilities.includes('retrieval_answer'),
    });
    this.cloudApiForm.markAsPristine();
  }

  private refreshDvrState(): void {
    forkJoin({
      status: this.result('dvr-status', this.harborAssistantApi.getDvrRecordingStatus()),
      timeline: this.result('dvr-timeline', this.harborAssistantApi.getDvrTimeline()),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ status, timeline }) => {
      this.dvrStatus.set(status.data);
      this.dvrTimeline.set(timeline.data);
      const errors = { ...this.endpointErrors() };
      for (const key of ['dvrStatus', 'dvrTimeline']) {
        delete errors[key];
      }
      if (status.error) {
        errors['dvrStatus'] = status.error;
      }
      if (timeline.error) {
        errors['dvrTimeline'] = timeline.error;
      }
      this.endpointErrors.set(errors);
    });
  }

  private ensureSelectedDevice(devices: CameraDevice[], defaultCameraId: string | null): void {
    const selectedDeviceId = this.selectedDeviceId();
    const selectedStillExists = devices.some((device) => device.device_id === selectedDeviceId);
    if (selectedStillExists) {
      return;
    }

    const nextDeviceId = defaultCameraId ?? devices[0]?.device_id ?? '';
    this.selectedDeviceId.set(nextDeviceId);
    this.patchCredentialsForm(nextDeviceId);
    this.patchMetadataForm(nextDeviceId);
  }

  private patchCredentialsForm(deviceId: string): void {
    const status = this.credentialStatusByDeviceId(deviceId);
    const defaults = this.defaults();
    this.credentialsForm.patchValue({
      username: status?.username ?? defaults.rtsp_username ?? '',
      password: '',
      rtspPort: String(status?.rtsp_port ?? defaults.rtsp_port ?? 554),
      rtspPaths: (defaults.rtsp_paths ?? []).join('\n'),
    });
  }

  private patchMetadataForm(deviceId: string): void {
    const device = this.devices().find((candidate) => candidate.device_id === deviceId);
    if (!device) {
      return;
    }

    this.metadataForm.patchValue({
      name: device.name ?? '',
      room: device.room ?? '',
      vendor: device.vendor ?? '',
      model: device.model ?? '',
      ipAddress: device.ip_address ?? '',
      snapshotUrl: device.snapshot_url ?? device.profile?.snapshot_url ?? '',
      primaryStreamUrl: device.primary_stream?.url ?? device.profile?.rtsp_url ?? '',
      rtspPath: (device.profile?.path_candidates ?? [])[0] ?? '',
      rtspPort: String(this.defaults().rtsp_port ?? 554),
      requiresAuth: typeof device.primary_stream?.requires_auth === 'boolean' ? String(device.primary_stream.requires_auth) : '',
    });
  }

  private ensureSelectedPolicy(): void {
    const selectedId = this.policyForm.controls.routePolicyId.value;
    const selectedStillExists = this.modelPolicies().some((policy) => policy.route_policy_id === selectedId);
    if (selectedStillExists) {
      return;
    }

    const firstPolicy = this.modelPolicies()[0];
    if (firstPolicy) {
      this.selectModelPolicy(firstPolicy);
    }
  }

  private preferredCloudEndpoint(): ModelEndpointRecord | null {
    return this.cloudEndpointForProvider('siliconflow')
      ?? this.modelEndpoints().find((endpoint) => endpoint.endpoint_kind === 'cloud')
      ?? null;
  }

  private cloudEndpointForProvider(providerValue: string): ModelEndpointRecord | null {
    const provider = this.cloudProviderOption(providerValue);
    return this.modelEndpoints().find((endpoint) => endpoint.model_endpoint_id === provider.endpointId)
      ?? this.modelEndpoints().find((endpoint) => {
        return endpoint.endpoint_kind === 'cloud'
          && (this.metadataString(endpoint, 'provider') === provider.value
            || this.metadataString(endpoint, 'provider_label').toLowerCase() === provider.label.toLowerCase());
      })
      ?? null;
  }

  private cloudProviderFromEndpoint(endpoint: ModelEndpointRecord | null): string {
    if (!endpoint) {
      return 'siliconflow';
    }
    const provider = this.metadataString(endpoint, 'provider').toLowerCase();
    const endpointId = endpoint.model_endpoint_id.toLowerCase();
    const label = this.metadataString(endpoint, 'provider_label').toLowerCase();
    if (provider === 'openrouter' || endpointId.includes('openrouter') || label.includes('openrouter')) {
      return 'openrouter';
    }
    if (provider === 'siliconflow' || endpointId.includes('siliconflow') || label.includes('siliconflow')) {
      return 'siliconflow';
    }
    return 'custom_openai_compatible';
  }

  private cloudProviderOption(value: string): CloudProviderOption {
    return this.cloudProviderOptions.find((option) => option.value === value)
      ?? this.cloudProviderOptions[0];
  }

  private cloudUsageModeFromPolicies(): CloudUsageMode {
    const semanticCloud = this.policyAllowsCloud('semantic.router');
    const answerCloud = this.policyAllowsCloud('retrieval.answer');
    if (!semanticCloud && !answerCloud) {
      return 'local_only';
    }
    if (semanticCloud && answerCloud) {
      return 'local_first_cloud';
    }
    return 'selected_capabilities';
  }

  private cloudEnabledCapabilitiesFromPolicies(): CloudCapabilityId[] {
    const capabilities: CloudCapabilityId[] = [];
    if (this.policyAllowsCloud('semantic.router')) {
      capabilities.push('semantic_router');
    }
    if (this.policyAllowsCloud('retrieval.answer')) {
      capabilities.push('retrieval_answer');
    }
    return capabilities;
  }

  private policyAllowsCloud(policyId: string): boolean {
    const policy = this.modelPolicies().find((candidate) => candidate.route_policy_id === policyId);
    if (!policy) {
      return false;
    }
    return policy.privacy_level !== 'strict_local'
      && policy.fallback_order.some((item) => item === 'cloud' || item.includes('cloud'));
  }

  private credentialStatusByDeviceId(deviceId: string): DeviceCredentialStatus | null {
    return this.state()?.device_credential_statuses?.find((status) => status.device_id === deviceId) ?? null;
  }

  private applyLocalDefaultNotificationTarget(targetId: string): void {
    const current = this.notificationTargetsResponse();
    if (!current) {
      return;
    }
    this.notificationTargetsResponse.set({
      targets: current.targets.map((target) => ({
        ...target,
        is_default: target.target_id === targetId,
      })),
    });
  }

  private runAction(actionId: string, request: Observable<unknown>, successMessage: string, afterSuccess?: () => void): void {
    this.actionInProgress.set(actionId);
    this.actionError.set(null);
    this.actionMessage.set(null);

    request.pipe(
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        afterSuccess?.();
        this.actionMessage.set(successMessage);
        this.loadData();
      },
      error: (error: unknown) => this.actionError.set(this.getErrorMessage(error)),
    });
  }

  private runRuleReviewAction(
    actionId: string,
    request: Observable<AutomationReviewsResponse>,
    successMessage: string,
  ): void {
    this.actionInProgress.set(actionId);
    this.actionError.set(null);
    this.actionMessage.set(null);

    request.pipe(
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.automationReviews.set(response.reviews ?? []);
        this.actionMessage.set(successMessage);
      },
      error: (error: unknown) => this.actionError.set(this.getErrorMessage(error)),
    });
  }

  private handleScanResponse(response: DiscoveryScanResponse): void {
    const results = response.results ?? [];
    this.scanResults.set(results);
    this.scanCredentialCandidateId.set(null);
    this.scanCredentialError.set(null);
    this.scanCredentialPasswordVisible.set(false);
    this.scanCredentialForm.controls.password.setValue('');
    this.scanForm.controls.password.setValue('');
    this.actionMessage.set(this.scanResponseMessage(response));
    if (results.some((result) => result.registered)) {
      this.refreshCameraState();
    }
  }

  private scanResultRoom(result: DiscoveryScanResultItem): string | null {
    if (result.room === T('Pending confirmation') || result.room === T('Pending identification')) {
      return null;
    }
    return this.emptyToNull(result.room);
  }

  private scanResponseMessage(response: DiscoveryScanResponse): string {
    const results = response.results ?? [];
    const needsPassword = results.filter((result) => result.requires_auth && !result.registered);
    if (needsPassword.length > 0) {
      return T('Cameras that require a password were found. Enter the username and password and scan again, or connect one with Manual add.');
    }
    const registered = results.filter((result) => result.registered).length;
    if (registered > 0) {
      return T('Scan completed. Verifiable cameras were connected.');
    }
    const scannedHosts = response.scanned_hosts ?? 0;
    return scannedHosts > 0
      ? T('Scan completed. No cameras were found that can be connected directly.')
      : T('Scan request completed.');
  }

  private runKnowledgeSettingsSave(
    actionId: string,
    payload: KnowledgeSettings,
    successMessage: string,
    clearSourceForm: boolean,
    startMessage: string | null = null,
  ): void {
    this.actionInProgress.set(actionId);
    this.actionError.set(null);
    this.actionMessage.set(startMessage);

    this.harborAssistantApi.saveKnowledgeSettings(payload).pipe(
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (settings) => {
        this.knowledgeSettings.set(settings);
        if (clearSourceForm) {
          this.clearKnowledgeSourceForm();
          this.sourcePickerEditingRoot.set(null);
        }
        this.actionMessage.set(successMessage);
      },
      error: (error: unknown) => this.actionError.set(this.getErrorMessage(error)),
    });
  }

  private fetchKnowledgeState(): Observable<unknown> {
    return forkJoin({
      settings: this.result('knowledge-settings-refresh', this.harborAssistantApi.getKnowledgeSettings()),
      indexStatus: this.result('knowledge-index-status-refresh', this.harborAssistantApi.getKnowledgeIndexStatus()),
      rag: this.result('rag-refresh', this.harborAssistantApi.getRagReadiness()),
    }).pipe(
      map(({ settings, indexStatus, rag }): null => {
        const errors = { ...this.endpointErrors() };
        for (const key of ['knowledgeSettings', 'knowledgeIndexStatus', 'rag']) {
          delete errors[key];
        }
        if (settings.data) {
          this.knowledgeSettings.set(settings.data);
        }
        if (indexStatus.data) {
          this.knowledgeIndexStatus.set(indexStatus.data);
        }
        if (rag.data) {
          this.rag.set(rag.data);
        }
        if (settings.error) {
          errors['knowledgeSettings'] = settings.error;
        }
        if (indexStatus.error) {
          errors['knowledgeIndexStatus'] = indexStatus.error;
        }
        if (rag.error) {
          errors['rag'] = rag.error;
        }
        this.endpointErrors.set(errors);
        return null;
      }),
    );
  }

  private fetchKnowledgeIndexState(): Observable<unknown> {
    return forkJoin({
      indexStatus: this.result('knowledge-index-status-refresh', this.harborAssistantApi.getKnowledgeIndexStatus()),
      rag: this.result('rag-refresh', this.harborAssistantApi.getRagReadiness()),
    }).pipe(
      map(({ indexStatus, rag }): null => {
        const errors = { ...this.endpointErrors() };
        for (const key of ['knowledgeIndexStatus', 'rag']) {
          delete errors[key];
        }
        if (indexStatus.data) {
          this.knowledgeIndexStatus.set(indexStatus.data);
        }
        if (rag.data) {
          this.rag.set(rag.data);
        }
        if (indexStatus.error) {
          errors['knowledgeIndexStatus'] = indexStatus.error;
        }
        if (rag.error) {
          errors['rag'] = rag.error;
        }
        this.endpointErrors.set(errors);
        return null;
      }),
    );
  }

  private credentialsPayload(): DeviceCredentialsPayload {
    const value = this.credentialsForm.getRawValue();
    return {
      username: this.emptyToNull(value.username),
      password: this.emptyToNull(value.password),
      rtsp_port: this.parseOptionalNumber(value.rtspPort),
      rtsp_paths: this.parseLines(value.rtspPaths),
    };
  }

  private normalizedScanCidr(value: string): string {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}\/(\d+)$/);
    if (!match) {
      return trimmed;
    }
    const prefix = Number(match[4]);
    if (prefix <= 32) {
      return trimmed;
    }
    return `${match[1]}.${match[2]}.${match[3]}.0/24`;
  }

  private defaultsPayload(): AdminDefaultsPayload {
    const value = this.defaultsForm.getRawValue();
    const current = this.defaults();
    return {
      cidr: value.cidr.trim() || current.cidr || '',
      discovery: value.discovery.trim() || current.discovery || '',
      recording: value.recording.trim() || current.recording || '',
      capture: value.capture.trim() || current.capture || '',
      ai: value.ai.trim() || current.ai || '',
      notification_channel: value.notificationChannel.trim() || current.notification_channel || '',
      rtsp_username: value.rtspUsername.trim() || current.rtsp_username || '',
      rtsp_password: value.rtspPassword.trim(),
      rtsp_port: this.parseOptionalNumber(value.rtspPort) ?? current.rtsp_port ?? 554,
      rtsp_paths: this.parseLines(value.rtspPaths).length > 0 ? this.parseLines(value.rtspPaths) : current.rtsp_paths ?? [],
      selected_camera_device_id: this.emptyToNull(value.selectedCameraDeviceId),
      capture_subdirectory: this.emptyToNull(value.captureSubdirectory) ?? current.capture_subdirectory ?? null,
      clip_length_seconds: this.parseOptionalNumber(value.clipLengthSeconds) ?? current.clip_length_seconds ?? null,
      keyframe_count: this.parseOptionalNumber(value.keyframeCount) ?? current.keyframe_count ?? null,
      keyframe_interval_seconds: this.parseOptionalNumber(value.keyframeIntervalSeconds) ?? current.keyframe_interval_seconds ?? null,
    };
  }

  private dvrSettingsPayload(): DvrRecordingSettings {
    const value = this.dvrForm.getRawValue();
    const current = this.dvrSettings();
    return {
      recording_root: value.recordingRoot.trim() || current?.recording_root || '',
      media_library_root: value.mediaLibraryRoot.trim() || current?.media_library_root || '',
      retention_days: this.parseOptionalNumber(value.retentionDays) ?? current?.retention_days ?? 7,
      segment_seconds: this.parseOptionalNumber(value.segmentSeconds) ?? current?.segment_seconds ?? 60,
      continuous_recording_enabled: value.continuousRecordingEnabled,
      low_bitrate_stream_preferred: value.lowBitrateStreamPreferred,
      continuous_bitrate_mbps: this.parseOptionalNumber(value.continuousBitrateMbps)
        ?? current?.continuous_bitrate_mbps
        ?? 2,
      high_res_event_clips_enabled: value.highResEventClipsEnabled,
      high_res_event_clip_seconds: this.parseOptionalNumber(value.highResEventClipSeconds)
        ?? current?.high_res_event_clip_seconds
        ?? 20,
      continuous_stream_path_hint: this.emptyToNull(value.continuousStreamPathHint),
      high_res_stream_path_hint: this.emptyToNull(value.highResStreamPathHint),
      disk_budget_gb: this.parseOptionalNumber(value.diskBudgetGb) ?? current?.disk_budget_gb ?? 64,
      keyframe_count: this.parseOptionalNumber(value.keyframeCount) ?? current?.keyframe_count ?? 3,
      keyframe_interval_seconds: this.parseOptionalNumber(value.keyframeIntervalSeconds)
        ?? current?.keyframe_interval_seconds
        ?? 5,
      enabled_device_ids: value.enabledDeviceIds,
    };
  }

  private modelEndpointPayload(): ModelEndpointPayload {
    const value = this.modelEndpointForm.getRawValue();
    const editing = this.modelEndpoints().find((endpoint) => endpoint.model_endpoint_id === this.modelEndpointEditingId());
    const metadata: Record<string, unknown> = {
      ...(editing ? this.editableEndpointMetadata(editing) : {}),
    };
    this.setOptionalMetadata(metadata, 'base_url', value.baseUrl);
    this.setOptionalMetadata(metadata, 'healthz_url', value.healthzUrl);
    if (value.apiKey.trim()) {
      metadata['api_key'] = value.apiKey.trim();
      metadata['api_key_configured'] = true;
    }

    return {
      model_endpoint_id: value.modelEndpointId.trim(),
      workspace_id: editing?.workspace_id ?? null,
      provider_account_id: editing?.provider_account_id ?? null,
      model_kind: value.modelKind.trim() || 'llm',
      endpoint_kind: value.endpointKind.trim() || 'local',
      provider_key: value.providerKey.trim() || 'local',
      model_name: value.modelName.trim(),
      capability_tags: this.parseLines(value.capabilityTags),
      cost_policy: editing?.cost_policy ?? {},
      status: value.status.trim() || 'active',
      metadata,
    };
  }

  private cloudEndpointPayload(
    provider: CloudProviderOption,
    existing: ModelEndpointRecord | null,
    hasApiKey: boolean,
  ): ModelEndpointPayload {
    const value = this.cloudApiForm.getRawValue();
    const metadata: Record<string, unknown> = {
      ...(existing ? this.editableEndpointMetadata(existing) : {}),
      provider: provider.value,
      provider_label: provider.label,
      base_url: value.baseUrl.trim(),
      healthz_url: this.cloudProviderModelsUrl(value.baseUrl),
      model: value.modelName.trim(),
      api_key_configured: hasApiKey,
      secret_redaction: 'endpoint_metadata',
    };
    if (value.apiKey.trim()) {
      metadata['api_key'] = value.apiKey.trim();
    }

    return {
      model_endpoint_id: existing?.model_endpoint_id ?? provider.endpointId,
      workspace_id: existing?.workspace_id ?? 'home-1',
      provider_account_id: existing?.provider_account_id ?? null,
      model_kind: 'llm',
      endpoint_kind: 'cloud',
      provider_key: 'openai_compatible',
      model_name: value.modelName.trim(),
      capability_tags: ['chat', 'cloud_fallback', 'openai_compatible'],
      cost_policy: existing?.cost_policy ?? { cost_hint: 'cloud_metered', provider: provider.value },
      status: hasApiKey ? 'active' : 'disabled',
      metadata,
    };
  }

  private cloudPolicyPayload(): ModelRoutePolicyRecord[] {
    const value = this.cloudApiForm.getRawValue();
    const mode = value.usageMode as CloudUsageMode;
    const selectedCapabilities: CloudCapabilityId[] = mode === 'local_first_cloud'
      ? ['semantic_router', 'retrieval_answer']
      : mode === 'selected_capabilities'
        ? [
            value.allowQuestionUnderstanding ? 'semantic_router' as const : null,
            value.allowAnswer ? 'retrieval_answer' as const : null,
          ].filter((item): item is CloudCapabilityId => item !== null)
        : [];

    const cloudPolicyIds = new Map<CloudCapabilityId, string>([
      ['semantic_router', 'semantic.router'],
      ['retrieval_answer', 'retrieval.answer'],
    ]);
    const existing = new Map(this.modelPolicies().map((policy) => [policy.route_policy_id, policy]));
    const nextPolicies = [...this.modelPolicies()];

    cloudPolicyIds.forEach((policyId, capability) => {
      const existingPolicy = existing.get(policyId) ?? this.defaultCloudPolicy(policyId, capability);
      const cloudAllowed = selectedCapabilities.includes(capability);
      const nextPolicy: ModelRoutePolicyRecord = {
        ...existingPolicy,
        privacy_level: cloudAllowed ? 'allow_redacted_cloud' : 'strict_local',
        local_preferred: true,
        fallback_order: cloudAllowed ? ['local', 'sidecar', 'cloud'] : ['local', 'sidecar'],
        status: 'active',
        metadata: {
          ...(existingPolicy.metadata ?? {}),
          cloud_enabled_from_ui: cloudAllowed,
        },
      };
      const existingIndex = nextPolicies.findIndex((policy) => policy.route_policy_id === policyId);
      if (existingIndex >= 0) {
        nextPolicies[existingIndex] = nextPolicy;
      } else {
        nextPolicies.push(nextPolicy);
      }
    });

    return nextPolicies;
  }

  private defaultCloudPolicy(policyId: string, capability: CloudCapabilityId): ModelRoutePolicyRecord {
    return {
      route_policy_id: policyId,
      workspace_id: 'home-1',
      domain_scope: capability === 'semantic_router' ? 'semantic' : 'retrieval',
      modality: 'text',
      privacy_level: 'strict_local',
      local_preferred: true,
      max_cost_per_run: null,
      fallback_order: ['local', 'sidecar'],
      status: 'active',
      metadata: {
        capability: capability === 'semantic_router' ? 'router' : 'answer',
      },
    };
  }

  private cloudProviderModelsUrl(baseUrl: string): string {
    const trimmed = baseUrl.trim().replace(/\/+$/, '');
    return trimmed ? `${trimmed}/models` : '';
  }

  private knowledgeSettingsPayload(includeSourceForm: boolean): KnowledgeSettings {
    const current = this.knowledgeSettings() ?? { source_roots: [], index_root: '' };
    const roots = [...(current.source_roots ?? [])];
    const indexRoot = this.knowledgeIndexForm.controls.indexRoot.value.trim() || current.index_root;
    const privacyLevel = this.knowledgeIndexForm.controls.privacyLevel.value || current.privacy_level || 'strict_local';
    const resourceProfile = this.knowledgeIndexForm.controls.resourceProfile.value || current.default_resource_profile || 'cpu_only';

    if (includeSourceForm) {
      const value = this.knowledgeSourceForm.getRawValue();
      const path = value.path.trim();
      if (path) {
        const existingIndex = roots.findIndex((root) => {
          return root.root_id === value.rootId.trim() || root.path === path;
        });
        const existing = existingIndex >= 0 ? roots[existingIndex] : null;
        const nextRoot: KnowledgeSourceRoot = {
          root_id: value.rootId.trim() || existing?.root_id || `knowledge-root-${roots.length + 1}`,
          label: value.label.trim() || existing?.label || this.pathLabel(path),
          path,
          enabled: value.enabled,
          include: this.parseLines(value.include),
          exclude: this.parseLines(value.exclude),
          last_indexed_at: existing?.last_indexed_at ?? null,
        };
        if (existingIndex >= 0) {
          roots[existingIndex] = nextRoot;
        } else {
          roots.push(nextRoot);
        }
      }
    }

    return {
      source_roots: roots.filter((root) => root.path.trim().length > 0),
      index_root: indexRoot,
      privacy_level: privacyLevel,
      default_resource_profile: resourceProfile,
    };
  }

  private setOptionalMetadata(metadata: Record<string, unknown>, key: string, value: string): void {
    const trimmed = value.trim();
    if (trimmed) {
      metadata[key] = trimmed;
    }
  }

  protected pathLabel(path: string): string {
    const normalized = path.trim().replace(/[\\/]+$/, '');
    const parts = normalized.split(/[\\/]+/).filter((part) => part.length > 0);
    return parts.at(-1) ?? normalized;
  }

  private sameOriginAdminUrl(url: string | null | undefined): string | null {
    if (!url?.trim()) {
      return null;
    }
    try {
      const parsed = new URL(url, 'http://harbor.local');
      const path = `${parsed.pathname}${parsed.search}`;
      if (path.startsWith('/api/harbor-beacon/')) {
        return path;
      }
      if (path.startsWith('/api/')) {
        return `/api/harbor-beacon${path.slice(4)}`;
      }
      return path.startsWith('/') ? path : null;
    } catch {
      return url.startsWith('/') ? url : null;
    }
  }

  private buildMetrics(): HarborAssistantMetric[] {
    const state = this.state();
    const devices = state?.devices ?? [];
    const credentialStatuses = state?.device_credential_statuses ?? [];
    const defaultCamera = this.defaultCamera();
    const credentialConfigured = credentialStatuses.filter((status) => status.configured).length;
    const rtspReady = devices.filter((device) => this.statusTone(this.evidenceResult(device, 'rtsp_check')?.status) === 'good').length;
    const snapshotReady = devices.filter((device) => this.statusTone(this.evidenceResult(device, 'snapshot')?.status) === 'good').length;
    const activeEndpoints = this.modelEndpoints().filter((endpoint) => this.statusTone(endpoint.status) === 'good').length;
    const inference = this.inferenceHealth();
    const gateway = this.gatewayStatus();

    return [
      {
        label: T('Admin API'),
        value: state ? T('Connected') : T('Offline'),
        detail: T('Harbor Assistant reads HarborBeacon through the /api/harbor-beacon/* service entry.'),
        tone: state ? 'good' : 'danger',
      },
      {
        label: T('Gateway Runtime'),
        value: gateway ? T('Connected') : T('Offline'),
        detail: T('HarborGate owns IM setup and management through the /api/harbor-gate/* service entry.'),
        tone: gateway ? 'good' : 'danger',
      },
      {
        label: T('Inference API'),
        value: inference ? this.inferenceHealthLabel(inference) : T('Offline'),
        detail: T('HarborBeacon exposes local inference through the unified API.'),
        tone: inference ? this.inferenceHealthTone(inference) : 'danger',
      },
      {
        label: T('Models & Search'),
        value: `${activeEndpoints}/${this.modelEndpoints().length}`,
        detail: T('Model selection, downloads, and search checks are managed from Settings.'),
        tone: activeEndpoints > 0 ? 'good' : 'warn',
      },
      {
        label: T('Hardware profile'),
        value: this.hardware()?.recommended_model_profile ?? T('Unknown'),
        detail: T('CPU, GPU, and NPU readiness drive model recommendations.'),
        tone: this.statusTone(this.hardware()?.status),
      },
      {
        label: T('Default camera'),
        value: defaultCamera?.name ?? T('Not selected'),
        detail: T('Default camera is saved through HarborBeacon AIoT admin API.'),
        tone: defaultCamera ? 'good' : 'warn',
      },
      {
        label: T('RTSP / snapshots'),
        value: `${rtspReady}/${devices.length} | ${snapshotReady}/${devices.length}`,
        detail: T('Recent validation evidence for camera streams and snapshots.'),
        tone: rtspReady > 0 || snapshotReady > 0 ? 'good' : devices.length > 0 ? 'warn' : 'neutral',
      },
      {
        label: T('Credentials'),
        value: `${credentialConfigured}/${devices.length}`,
        detail: T('Credential responses must stay configured/redacted only.'),
        tone: credentialConfigured > 0 ? 'good' : 'neutral',
      },
      {
        label: T('System Integration'),
        value: this.harborOs()?.status ?? T('Unknown'),
        detail: T('System Integration reports HarborOS System Domain status and capabilities.'),
        tone: this.statusTone(this.harborOs()?.status),
      },
    ];
  }

  private buildConnectorCards(): ConnectorCard[] {
    const gateway = this.gatewayStatus();
    const channels = gateway?.channels ?? gateway?.platforms ?? [];
    const fallbackGateway = this.state()?.account_management?.gateway;
    const fallbackProvider = gateway?.bridge_provider ?? fallbackGateway?.bridge_provider ?? this.state()?.bridge_provider;

    return [
      this.connectorCard(
        'weixin',
        T('WeChat'),
        gateway?.weixin ?? channels.find((channel) => channel.platform === 'weixin'),
        gateway,
        fallbackProvider?.platform === 'weixin' ? fallbackProvider : null,
      ),
      this.connectorCard(
        'feishu',
        T('Feishu'),
        gateway?.feishu ?? channels.find((channel) => channel.platform === 'feishu'),
        gateway,
        fallbackProvider?.platform === 'feishu' ? fallbackProvider : null,
      ),
    ];
  }

  private connectorCard(
    id: string,
    label: string,
    platform: GatewayPlatformStatus | null | undefined,
    gateway: GatewayStatusResponse | null,
    fallback: GatewayStatusResponse['bridge_provider'] | null | undefined,
  ): ConnectorCard {
    const configured = Boolean(platform?.configured ?? platform?.enabled ?? fallback?.configured ?? (gateway?.platform === id && gateway.configured));
    const connected = Boolean(platform?.connected ?? fallback?.connected ?? (gateway?.platform === id && gateway.connected));
    const status = connected ? T('Connected') : configured ? T('Configured') : T('Not configured');
    const setupUrl = connected ? null : harborGateConnectorSetupUrl(id, platform, gateway);
    const manageUrl = harborGateConnectorManageUrl(id, platform, gateway);
    const detail = connected
      ? T('HarborGate reports this connector as connected.')
      : configured
        ? T('HarborGate reports credentials are configured; connection is not confirmed.')
        : T('Use HarborGate setup to configure this connector. Harbor Assistant does not store IM secrets.');

    return {
      id,
      label,
      status,
      detail,
      configured,
      connected,
      setupUrl,
      manageUrl,
      lastCheckedAt: platform?.last_checked_at ?? fallback?.last_checked_at ?? gateway?.last_checked_at ?? null,
      tone: connected ? 'good' : configured ? 'warn' : 'neutral',
    };
  }

  private inferenceHealthLabel(health: InferenceHealthResponse): string {
    const status = typeof health.status === 'string' && health.status.trim()
      ? health.status
      : health.ready === true
        ? T('ready')
        : T('unknown');
    const backend = this.inferenceBackendLabel(health);
    return backend ? `${status} (${backend})` : status;
  }

  private inferenceHealthTone(health: InferenceHealthResponse): HarborAssistantStatusTone {
    if (health.ready === true) {
      return 'good';
    }
    if (health.ready === false) {
      return 'warn';
    }
    return this.statusTone(health.status);
  }

  private inferenceBackendLabel(health: InferenceHealthResponse): string {
    if (typeof health.backend_kind === 'string' && health.backend_kind.trim()) {
      return health.backend_kind.trim();
    }

    const backend = health.backend;
    if (!backend) {
      return '';
    }

    const kind = backend['kind'];
    const status = backend['status'];
    if (typeof kind === 'string' && kind.trim()) {
      return kind.trim();
    }
    if (typeof status === 'string' && status.trim()) {
      return status.trim();
    }
    return '';
  }

  private buildHardwareBlocks(): StatusBlock[] {
    const hardware = this.hardware();
    if (!hardware) {
      return [];
    }

    return [
      this.statusBlock('cpu', T('CPU'), hardware.cpu),
      this.statusBlock('memory', T('Memory'), hardware.memory),
      this.statusBlock('gpu', T('GPU'), hardware.gpu),
      this.statusBlock('npu', T('NPU'), hardware.npu),
    ];
  }

  private buildRagBlocks(): StatusBlock[] {
    const rag = this.rag();
    if (!rag) {
      return [];
    }

    const capabilityBlocks = (rag.capability_profiles ?? []).map((profile) => ({
      id: `capability-${profile.capability_id}`,
      label: profile.label,
      status: profile.status,
      summary: profile.summary,
      detail: [...(profile.blockers ?? []), ...(profile.warnings ?? [])].join(' ') || profile.summary,
      evidence: profile.evidence ?? [],
      tone: this.statusTone(profile.status),
    }));
    const blocks = [
      ...capabilityBlocks,
      rag.source_roots ? this.statusBlock('source-roots', T('Knowledge source roots'), rag.source_roots) : null,
      this.statusBlock('index', T('Index directory'), rag.index_directory),
      this.statusBlock('embedding', T('Embedding model'), rag.embedding_model),
      this.statusBlock('media-parser', T('Media parser'), rag.media_parser),
      this.statusBlock('storage', T('Storage writable'), rag.storage_writable),
    ];

    return blocks.filter((block): block is StatusBlock => block !== null);
  }

  private buildHarborOsBlocks(): StatusBlock[] {
    const harborOs = this.harborOs();
    if (!harborOs) {
      return [];
    }

    const serviceBlocks = harborOs.services.map((service) => this.serviceStatusBlock(service));
    return [
      ...serviceBlocks,
      this.serviceStatusBlock(harborOs.jobs_alerts),
      this.serviceStatusBlock(harborOs.storage_files_entry),
    ];
  }

  private statusBlock(id: string, label: string, component: HardwareReadinessComponent | RagReadinessComponent): StatusBlock {
    return {
      id,
      label,
      status: component.status,
      summary: component.summary,
      detail: component.detail,
      evidence: component.evidence ?? [],
      tone: this.statusTone(component.status),
    };
  }

  private serviceStatusBlock(service: HarborOsServiceStatus): StatusBlock {
    return {
      id: service.service_id,
      label: service.label,
      status: service.status,
      summary: service.detail,
      detail: service.detail,
      evidence: [],
      tone: this.statusTone(service.status),
    };
  }

  private normalizeTab(tab: string | null): HarborAssistantTabId | null {
    const normalized = (tab ?? '').trim().toLowerCase();
    return this.tabs.some((candidate) => candidate.id === normalized) ? normalized as HarborAssistantTabId : null;
  }

  private normalizeSettingsSection(section: string | null): AssistantSettingsSectionId | null {
    switch ((section ?? '').trim().toLowerCase()) {
      case 'ai':
      case 'models':
      case 'rag':
      case 'data':
      case 'sources':
        return 'ai';
      case 'camera':
      case 'cameras':
      case 'devices':
      case 'aiot':
      case 'dvr':
        return 'camera';
      case 'diagnostics':
      case 'system':
      case 'harboros':
        return 'ai';
      default:
        return null;
    }
  }

  private shouldApplyAiFocus(tab: string | null, section: string | null): boolean {
    const normalizedTab = (tab ?? '').trim().toLowerCase();
    const normalizedSection = (section ?? '').trim().toLowerCase();
    if (normalizedTab === 'settings') {
      return true;
    }
    return normalizedSection === 'ai';
  }

  private normalizeAiSettingsTab(value: string | null): AiSettingsTabId | null {
    switch ((value ?? '').trim().toLowerCase()) {
      case 'sources':
      case 'data':
      case 'data-sources':
        return 'sources';
      case 'models':
      case 'model':
      case 'semantic':
      case 'semantic-index':
      case 'embedding':
      case 'embedder':
      case 'vector':
      case 'vision':
      case 'video':
      case 'vlm':
      case 'chat':
      case 'llm':
      case 'apps':
        return 'models';
      case 'cloud':
      case 'cloud-api':
      case 'api':
      case 'api-key':
        return 'cloud-api';
      default:
        return null;
    }
  }

  private emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseOptionalNumber(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseOptionalBoolean(value: string): boolean | null {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
    return null;
  }

  private parseLines(value: string): string[] {
    return value
      .split(/\r?\n|,/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const payload = (error as { error?: { error?: unknown; message?: unknown } | string }).error;
      if (typeof payload === 'string' && payload.trim()) {
        return payload;
      }
      if (payload && typeof payload === 'object' && typeof payload.error === 'string' && payload.error.trim()) {
        return payload.error;
      }
      if (payload && typeof payload === 'object' && typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return T('The request failed before Harbor Assistant could update this setting.');
  }
}
