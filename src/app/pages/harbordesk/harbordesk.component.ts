import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDivider } from '@angular/material/divider';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, forkJoin, of, timer } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  AdminDefaultsPayload,
  AdminStateResponse,
  CameraDevice,
  DeviceCredentialStatus,
  DeviceCredentialsPayload,
  DeviceEvidenceResponse,
  DeviceEvidenceResult,
  EndpointResult,
  FilesBrowseResponse,
  GatewayPlatformStatus,
  GatewayStatusResponse,
  HarborDeskMetric,
  HarborDeskStatusTone,
  HarborDeskTab,
  HarborDeskTabId,
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
} from 'app/pages/harbordesk/interfaces/harbordesk-status.interface';
import { HarborDeskApiService } from 'app/pages/harbordesk/services/harbordesk-api.service';
import { harborGateConnectorManageUrl, harborGateConnectorSetupUrl } from 'app/pages/harbordesk/utils/harborgate-urls';

interface HarborDeskPageData {
  state: EndpointResult<AdminStateResponse>;
  gatewayStatus: EndpointResult<GatewayStatusResponse>;
  inferenceHealth: EndpointResult<InferenceHealthResponse>;
  notificationTargets: EndpointResult<NotificationTargetsResponse>;
  modelEndpoints: EndpointResult<ModelEndpointsResponse>;
  modelPolicies: EndpointResult<ModelPoliciesResponse>;
  localCatalog: EndpointResult<LocalModelCatalogResponse>;
  localDownloads: EndpointResult<LocalModelDownloadsResponse>;
  hardware: EndpointResult<HardwareReadinessResponse>;
  rag: EndpointResult<RagReadinessResponse>;
  knowledgeSettings: EndpointResult<KnowledgeSettings>;
  knowledgeIndexStatus: EndpointResult<KnowledgeIndexStatusResponse>;
  harborOs: EndpointResult<HarborOsStatusResponse>;
  capabilityMap: EndpointResult<HarborOsImCapabilityMapResponse>;
  shareLinks: EndpointResult<ShareLinkSummary[]>;
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
  tone: HarborDeskStatusTone;
}

interface StatusBlock {
  id: string;
  label: string;
  status: string;
  summary: string;
  detail: string;
  evidence: string[];
  tone: HarborDeskStatusTone;
}

type CustomerModelSection = 'downloading' | 'installed' | 'available';
type CustomerModelAction = 'download' | 'downloading' | 'set-current' | 'current' | 'retry';

interface CurrentModelCard {
  kind: string;
  label: string;
  modelName: string;
  providerKey: string;
  status: string;
  tone: HarborDeskStatusTone;
  baseUrl: string;
  localPath: string;
  endpoint: ModelEndpointRecord | null;
}

interface CustomerModelCard {
  key: string;
  modelId: string;
  displayName: string;
  providerKey: string;
  kind: string;
  source: string;
  capabilities: string[];
  sizeHint: string;
  hardware: string;
  status: string;
  tone: HarborDeskStatusTone;
  localPath: string | null;
  downloadJob: LocalModelDownloadJob | null;
  endpoint: ModelEndpointRecord | null;
  action: CustomerModelAction;
  actionLabel: string;
  progressLabel: string | null;
  bytesLabel: string | null;
  speedLabel: string | null;
  errorMessage: string | null;
  evidence: string[];
  section: CustomerModelSection;
  catalogModel: LocalModelCatalogItem | null;
}

interface RagValidationStat {
  id: string;
  label: string;
  value: string;
  tone: HarborDeskStatusTone;
}

interface RagSourceRootSummary {
  total: number;
  enabled: number;
  existing: number;
  status: string;
  tone: HarborDeskStatusTone;
}

@Component({
  selector: 'ix-harbordesk',
  templateUrl: './harbordesk.component.html',
  styleUrls: ['./harbordesk.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatAnchor,
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatCheckbox,
    MatDivider,
    MatFormField,
    MatInput,
    MatOption,
    MatProgressBar,
    MatSelect,
    NgClass,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
  ],
})
export class HarborDeskComponent implements OnInit {
  private harborDeskApi = inject(HarborDeskApiService);
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly tabs: HarborDeskTab[] = [
    { id: 'overview', label: T('Overview'), detail: T('Settings status digest') },
    { id: 'im', label: T('IM Connectors'), detail: T('Weixin and Feishu setup status') },
    { id: 'models', label: T('Models & RAG'), detail: T('Endpoints, downloads, routing policy, and multimodal RAG') },
    { id: 'devices', label: T('Connected Devices'), detail: T('Home device management') },
    { id: 'system', label: T('System Integration'), detail: T('HarborOS System Domain status and IM capability map') },
  ];

  protected readonly activeTab = signal<HarborDeskTabId>('overview');
  protected readonly activeTabDetail = computed(() => {
    return this.tabs.find((tab) => tab.id === this.activeTab())?.detail ?? T('HarborDesk settings');
  });
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly endpointErrors = signal<Record<string, string>>({});
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionInProgress = signal<string | null>(null);
  protected readonly state = signal<AdminStateResponse | null>(null);
  protected readonly gatewayStatus = signal<GatewayStatusResponse | null>(null);
  protected readonly inferenceHealth = signal<InferenceHealthResponse | null>(null);
  protected readonly notificationTargetsResponse = signal<NotificationTargetsResponse | null>(null);
  protected readonly modelEndpointsResponse = signal<ModelEndpointsResponse | null>(null);
  protected readonly modelPoliciesResponse = signal<ModelPoliciesResponse | null>(null);
  protected readonly localCatalog = signal<LocalModelCatalogResponse | null>(null);
  protected readonly localDownloads = signal<LocalModelDownloadsResponse | null>(null);
  protected readonly hardware = signal<HardwareReadinessResponse | null>(null);
  protected readonly rag = signal<RagReadinessResponse | null>(null);
  protected readonly knowledgeSettings = signal<KnowledgeSettings | null>(null);
  protected readonly knowledgeIndexStatus = signal<KnowledgeIndexStatusResponse | null>(null);
  protected readonly filesBrowse = signal<FilesBrowseResponse | null>(null);
  protected readonly harborOs = signal<HarborOsStatusResponse | null>(null);
  protected readonly capabilityMap = signal<HarborOsImCapabilityMapResponse | null>(null);
  protected readonly shareLinks = signal<ShareLinkSummary[]>([]);
  protected readonly evidenceByDevice = signal<Record<string, DeviceEvidenceResponse>>({});
  protected readonly selectedDeviceId = signal<string>('');
  protected readonly modelEndpointEditingId = signal<string | null>(null);
  protected readonly modelsAdvancedOpen = signal(false);
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

  protected readonly scanForm = this.fb.group({
    cidr: [''],
    protocol: ['rtsp'],
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
  protected readonly modelEndpoints = computed(() => this.modelEndpointsResponse()?.endpoints ?? []);
  protected readonly modelPolicies = computed(() => this.modelPoliciesResponse()?.route_policies ?? []);
  protected readonly catalogModels = computed(() => this.localCatalog()?.models ?? []);
  protected readonly downloadJobs = computed(() => this.localDownloads()?.jobs ?? this.localCatalog()?.download_jobs ?? []);
  protected readonly currentModelCards = computed<CurrentModelCard[]>(() => this.buildCurrentModelCards());
  protected readonly customerModelCards = computed<CustomerModelCard[]>(() => this.buildCustomerModelCards());
  protected readonly downloadingModelCards = computed(() => this.customerModelCards().filter((card) => card.section === 'downloading'));
  protected readonly installedModelCards = computed(() => this.customerModelCards().filter((card) => card.section === 'installed'));
  protected readonly availableModelCards = computed(() => this.customerModelCards().filter((card) => card.section === 'available'));
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
  protected readonly isBusy = computed(() => this.loading() || this.actionInProgress() !== null);
  protected readonly metrics = computed<HarborDeskMetric[]>(() => this.buildMetrics());
  protected readonly connectorCards = computed<ConnectorCard[]>(() => this.buildConnectorCards());
  protected readonly weixinConnector = computed(() => this.connectorCards().find((card) => card.id === 'weixin') ?? null);
  protected readonly weixinSetupUrl = computed(() => this.weixinConnector()?.setupUrl ?? '/setup/weixin');
  protected readonly weixinManageUrl = computed(() => this.weixinConnector()?.manageUrl ?? '/admin/im/weixin');
  protected readonly configuredConnectorCount = computed(() => this.connectorCards().filter((card) => card.configured).length);
  protected readonly notificationTargets = computed(() => {
    return this.notificationTargetsResponse()?.targets
      ?? this.state()?.account_management?.notification_targets
      ?? [];
  });
  protected readonly defaultNotificationTarget = computed(() => {
    return this.notificationTargets().find((target) => target.is_default)
      ?? this.notificationTargets()[0]
      ?? null;
  });
  protected readonly hardwareBlocks = computed<StatusBlock[]>(() => this.buildHardwareBlocks());
  protected readonly ragBlocks = computed<StatusBlock[]>(() => this.buildRagBlocks());
  protected readonly harborOsBlocks = computed<StatusBlock[]>(() => this.buildHarborOsBlocks());

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const tab = this.normalizeTab(params.get('tab'));
        if (tab) {
          this.activeTab.set(tab);
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

  protected selectTab(tabId: HarborDeskTabId): void {
    this.activeTab.set(tabId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected isTab(tabId: HarborDeskTabId): boolean {
    return this.activeTab() === tabId;
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
    this.runAction(
      `notification-target-default:${target.target_id}`,
      this.harborDeskApi.setDefaultNotificationTarget(target.target_id),
      T('Default outbound IM target was updated.'),
    );
  }

  protected removeNotificationTarget(target: NotificationTargetRecord): void {
    this.runAction(
      `notification-target-remove:${target.target_id}`,
      this.harborDeskApi.deleteNotificationTarget(target.target_id),
      T('Notification target was removed. HarborGate can register it again after the next private IM turn.'),
    );
  }

  protected selectDevice(deviceId: string): void {
    this.selectedDeviceId.set(deviceId);
    this.patchCredentialsForm(deviceId);
    this.patchMetadataForm(deviceId);
  }

  protected scanDevices(): void {
    const value = this.scanForm.getRawValue();
    this.runAction(
      'scan',
      this.harborDeskApi.scanDevices({
        cidr: this.emptyToNull(value.cidr),
        protocol: this.emptyToNull(value.protocol),
      }),
      T('Discovery scan requested. Refreshing device state.'),
    );
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
      this.harborDeskApi.addManualDevice({
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
      this.harborDeskApi.saveDefaults(this.defaultsPayload()),
      T('Default AIoT settings were saved.'),
      () => this.defaultsForm.controls.rtspPassword.setValue(''),
    );
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
      this.harborDeskApi.updateDeviceMetadata(device.device_id, {
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
      this.harborDeskApi.saveDeviceCredentials(device.device_id, this.credentialsPayload()),
      T('Credential status was updated. Secret values remain redacted in admin responses.'),
      () => this.credentialsForm.controls.password.setValue(''),
    );
  }

  protected checkRtsp(device: CameraDevice): void {
    this.runAction(
      `rtsp:${device.device_id}`,
      this.harborDeskApi.checkDeviceRtsp(device.device_id, this.credentialsPayload()),
      T('RTSP check completed.'),
    );
  }

  protected validateDevice(device: CameraDevice): void {
    this.runAction(
      `validate:${device.device_id}`,
      this.harborDeskApi.runDeviceValidation(device.device_id, {
        scope: 'all',
        reason: 'harbordesk-settings-validation',
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
      this.harborDeskApi.setDefaultCamera(device.device_id),
      T('Default camera updated.'),
    );
  }

  protected createSnapshot(device: CameraDevice): void {
    this.runAction(
      `snapshot:${device.device_id}`,
      this.harborDeskApi.createCameraSnapshotTask(device.device_id),
      T('Snapshot check requested.'),
    );
  }

  protected createShareLink(device: CameraDevice): void {
    this.runAction(
      `share:${device.device_id}`,
      this.harborDeskApi.createCameraShareLink(device.device_id),
      T('Share link created or queued.'),
    );
  }

  protected revokeShareLink(link: ShareLinkSummary): void {
    this.runAction(
      `revoke:${link.share_link_id}`,
      this.harborDeskApi.revokeShareLink(link.share_link_id),
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
      ? this.harborDeskApi.updateModelEndpoint(editingId, payload)
      : this.harborDeskApi.createModelEndpoint(payload);
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
      this.harborDeskApi.testModelEndpoint(endpoint.model_endpoint_id),
      T('Model endpoint health test completed.'),
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
      case 'downloading':
      case 'current':
      default:
        return;
    }
  }

  protected modelCardActionDisabled(card: CustomerModelCard): boolean {
    return this.isBusy() || card.action === 'downloading' || card.action === 'current';
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

  protected validationVlmDownloadTone(card: CustomerModelCard | null): HarborDeskStatusTone {
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
      this.harborDeskApi.createLocalModelDownload({
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
    this.runAction(
      `model-download:${card.modelId}`,
      this.harborDeskApi.createLocalModelDownload({
        model_id: card.modelId,
        display_name: card.displayName,
        provider_key: card.providerKey || null,
        target_path: null,
        metadata: {
          catalog_action: 'customer_download',
          source: card.source,
        },
      }),
      T('Local model download job was started by explicit action.'),
    );
  }

  protected useInstalledModel(card: CustomerModelCard): void {
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
      return this.harborDeskApi.updateModelEndpoint(endpoint.model_endpoint_id, {
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
      this.harborDeskApi.cancelLocalModelDownload(job.job_id),
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
      this.harborDeskApi.saveModelPolicies({ route_policies: routePolicies }),
      T('Model routing policy was saved.'),
    );
  }

  protected editKnowledgeSource(root: KnowledgeSourceRoot): void {
    this.knowledgeSourceForm.patchValue({
      rootId: root.root_id,
      label: root.label,
      path: root.path,
      enabled: root.enabled,
      include: (root.include ?? []).join('\n'),
      exclude: (root.exclude ?? []).join('\n'),
    });
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
    this.runAction(
      'knowledge-settings',
      this.harborDeskApi.saveKnowledgeSettings(this.knowledgeSettingsPayload(true)),
      T('Knowledge settings were saved.'),
      () => this.clearKnowledgeSourceForm(),
    );
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
      this.harborDeskApi.saveKnowledgeSettings(payload),
      T('Knowledge source root was removed.'),
    );
  }

  protected runKnowledgeIndex(): void {
    this.runAction(
      'knowledge-index',
      this.harborDeskApi.runKnowledgeIndex(),
      T('Knowledge index run completed.'),
    );
  }

  protected startKnowledgeSourceRoot(): void {
    this.clearKnowledgeSourceForm();
    this.scrollSelectorIntoView('.knowledge-source-form');
  }

  protected inspectImageContentCounts(): void {
    this.scrollSelectorIntoView('.knowledge-card');
  }

  protected browseKnowledgeFiles(path?: string | null): void {
    this.actionInProgress.set('files-browse');
    this.actionError.set(null);
    this.actionMessage.set(null);

    this.harborDeskApi.browseFiles(path).pipe(
      finalize(() => this.actionInProgress.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => this.filesBrowse.set(response),
      error: (error: unknown) => this.actionError.set(this.getErrorMessage(error)),
    });
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

  protected useBrowsePathAsIndex(path: string): void {
    this.knowledgeIndexForm.patchValue({ indexRoot: path });
    this.knowledgeIndexForm.markAsDirty();
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

  protected statusTone(status: string | null | undefined): HarborDeskStatusTone {
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

  protected endpointError(key: string): string | null {
    return this.endpointErrors()[key] ?? null;
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

  protected metadataString(endpoint: ModelEndpointRecord, key: string): string {
    const value = endpoint.metadata?.[key];
    return typeof value === 'string' ? value : '';
  }

  protected metadataBoolean(endpoint: ModelEndpointRecord, key: string): boolean {
    return endpoint.metadata?.[key] === true;
  }

  protected progressLabel(job: LocalModelDownloadJob): string {
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

  private countCoverageTone(indexedCount: number, totalCount: number): HarborDeskStatusTone {
    if (totalCount <= 0) {
      return 'neutral';
    }
    return indexedCount >= totalCount ? 'good' : indexedCount > 0 ? 'warn' : 'danger';
  }

  private buildCurrentModelCards(): CurrentModelCard[] {
    return ['llm', 'vlm', 'embedder'].map((kind) => {
      const endpoint = this.currentEndpointByKind(kind);
      return {
        kind,
        label: this.modelKindLabel(kind),
        modelName: endpoint?.model_name ?? T('Not configured'),
        providerKey: endpoint?.provider_key ?? T('n/a'),
        status: endpoint?.status ?? T('not-configured'),
        tone: endpoint ? this.statusTone(endpoint.status) : 'warn',
        baseUrl: endpoint ? this.metadataString(endpoint, 'base_url') : '',
        localPath: endpoint ? this.metadataString(endpoint, 'local_path') : '',
        endpoint,
      };
    });
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
        return T('Retry');
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
        return T('LLM');
      case 'vlm':
        return T('VLM');
      case 'embedder':
        return T('Embedder');
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
    this.harborDeskApi.getLocalModelDownloads().pipe(
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
      next: (pageData) => this.applyPageData(pageData),
      error: (error: unknown) => {
        this.loadError.set(this.getErrorMessage(error));
        this.clearData();
      },
    });
  }

  private fetchPageData(): Observable<HarborDeskPageData> {
    return this.result('state', this.harborDeskApi.getState()).pipe(
      switchMap((state) => forkJoin({
        state: of(state),
        gatewayStatus: this.result('gateway', this.harborDeskApi.getGatewayStatus()),
        inferenceHealth: this.result('inference', this.harborDeskApi.getInferenceHealth()),
        notificationTargets: this.result('notification-targets', this.harborDeskApi.getNotificationTargets()),
        modelEndpoints: this.result('models', this.harborDeskApi.getModelEndpoints()),
        modelPolicies: this.result('model-policies', this.harborDeskApi.getModelPolicies()),
        localCatalog: this.result('local-catalog', this.harborDeskApi.getLocalModelCatalog()),
        localDownloads: this.result('local-downloads', this.harborDeskApi.getLocalModelDownloads()),
        hardware: this.result('hardware', this.harborDeskApi.getHardwareReadiness()),
        rag: this.result('rag', this.harborDeskApi.getRagReadiness()),
        knowledgeSettings: this.result('knowledge-settings', this.harborDeskApi.getKnowledgeSettings()),
        knowledgeIndexStatus: this.result('knowledge-index-status', this.harborDeskApi.getKnowledgeIndexStatus()),
        harborOs: this.result('harboros', this.harborDeskApi.getHarborOsStatus()),
        capabilityMap: this.result('harboros-capabilities', this.harborDeskApi.getHarborOsImCapabilityMap()),
        shareLinks: this.result('share-links', this.harborDeskApi.getShareLinks()),
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
            modelPolicies: payload.modelPolicies,
            localCatalog: payload.localCatalog,
            localDownloads: payload.localDownloads,
            hardware: payload.hardware,
            rag: payload.rag,
            knowledgeSettings: payload.knowledgeSettings,
            knowledgeIndexStatus: payload.knowledgeIndexStatus,
            harborOs: payload.harborOs,
            capabilityMap: payload.capabilityMap,
            shareLinks: payload.shareLinks,
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
      devices.map((device) => this.harborDeskApi.getDeviceEvidence(device.device_id).pipe(
        map((evidence): DeviceEvidenceEntry => [device.device_id, evidence, null]),
        catchError((error: unknown) => of<DeviceEvidenceEntry>([device.device_id, null, this.getErrorMessage(error)])),
      )),
    );
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

  private applyPageData(pageData: HarborDeskPageData): void {
    this.state.set(pageData.state.data);
    this.gatewayStatus.set(pageData.gatewayStatus.data);
    this.inferenceHealth.set(pageData.inferenceHealth.data);
    this.notificationTargetsResponse.set(pageData.notificationTargets.data);
    this.modelEndpointsResponse.set(pageData.modelEndpoints.data);
    this.modelPoliciesResponse.set(pageData.modelPolicies.data);
    this.localCatalog.set(pageData.localCatalog.data);
    this.localDownloads.set(pageData.localDownloads.data);
    this.hardware.set(pageData.hardware.data);
    this.rag.set(pageData.rag.data);
    this.knowledgeSettings.set(pageData.knowledgeSettings.data);
    this.knowledgeIndexStatus.set(pageData.knowledgeIndexStatus.data);
    this.harborOs.set(pageData.harborOs.data);
    this.capabilityMap.set(pageData.capabilityMap.data);
    this.shareLinks.set(pageData.shareLinks.data ?? []);
    this.evidenceByDevice.set(pageData.evidenceByDevice);

    const errors = Object.fromEntries(
      Object.entries({
        state: pageData.state.error,
        gateway: pageData.gatewayStatus.error,
        inference: pageData.inferenceHealth.error,
        notificationTargets: pageData.notificationTargets.error,
        models: pageData.modelEndpoints.error,
        modelPolicies: pageData.modelPolicies.error,
        localCatalog: pageData.localCatalog.error,
        localDownloads: pageData.localDownloads.error,
        hardware: pageData.hardware.error,
        rag: pageData.rag.error,
        knowledgeSettings: pageData.knowledgeSettings.error,
        knowledgeIndexStatus: pageData.knowledgeIndexStatus.error,
        harborOs: pageData.harborOs.error,
        capabilityMap: pageData.capabilityMap.error,
        shareLinks: pageData.shareLinks.error,
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
    this.ensureSelectedPolicy();
  }

  private clearData(): void {
    this.state.set(null);
    this.gatewayStatus.set(null);
    this.inferenceHealth.set(null);
    this.notificationTargetsResponse.set(null);
    this.modelEndpointsResponse.set(null);
    this.modelPoliciesResponse.set(null);
    this.localCatalog.set(null);
    this.localDownloads.set(null);
    this.hardware.set(null);
    this.rag.set(null);
    this.knowledgeSettings.set(null);
    this.knowledgeIndexStatus.set(null);
    this.filesBrowse.set(null);
    this.harborOs.set(null);
    this.capabilityMap.set(null);
    this.shareLinks.set([]);
    this.evidenceByDevice.set({});
    this.endpointErrors.set({});
  }

  private patchDefaultForms(state: AdminStateResponse): void {
    const defaults = state.defaults ?? {};

    if (!this.scanForm.dirty) {
      this.scanForm.patchValue({
        cidr: defaults.cidr ?? '',
        protocol: defaults.discovery ?? 'rtsp',
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
      const root = settings.source_roots?.[0];
      if (root) {
        this.editKnowledgeSource(root);
      } else {
        this.clearKnowledgeSourceForm();
      }
    }
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

  private credentialStatusByDeviceId(deviceId: string): DeviceCredentialStatus | null {
    return this.state()?.device_credential_statuses?.find((status) => status.device_id === deviceId) ?? null;
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

  private credentialsPayload(): DeviceCredentialsPayload {
    const value = this.credentialsForm.getRawValue();
    return {
      username: this.emptyToNull(value.username),
      password: this.emptyToNull(value.password),
      rtsp_port: this.parseOptionalNumber(value.rtspPort),
      rtsp_paths: this.parseLines(value.rtspPaths),
    };
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

  private pathLabel(path: string): string {
    const normalized = path.trim().replace(/[\\/]+$/, '');
    const parts = normalized.split(/[\\/]+/).filter((part) => part.length > 0);
    return parts.at(-1) ?? normalized;
  }

  private buildMetrics(): HarborDeskMetric[] {
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
        detail: T('HarborDesk reads HarborBeacon through /api/harbordesk/* same-origin proxy.'),
        tone: state ? 'good' : 'danger',
      },
      {
        label: T('Gateway Runtime'),
        value: gateway ? T('Connected') : T('Offline'),
        detail: T('HarborGate adapters run inside harborgate.service and surface through /api/harbordesk/gateway/status.'),
        tone: gateway ? 'good' : 'danger',
      },
      {
        label: T('Inference API'),
        value: inference ? this.inferenceHealthLabel(inference) : T('Offline'),
        detail: T('HarborBeacon exposes local inference through the unified API.'),
        tone: inference ? this.inferenceHealthTone(inference) : 'danger',
      },
      {
        label: T('Models & RAG'),
        value: `${activeEndpoints}/${this.modelEndpoints().length}`,
        detail: T('Active model endpoints, local downloads, and RAG readiness are managed by explicit admin actions.'),
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
        T('Weixin'),
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
    const status = platform?.status ?? fallback?.status ?? (connected ? T('Connected') : configured ? T('Configured') : T('Not configured'));
    const setupUrl = harborGateConnectorSetupUrl(id, platform, gateway);
    const manageUrl = harborGateConnectorManageUrl(id, platform, gateway);
    const detail = connected
      ? T('HarborGate reports this connector as connected.')
      : configured
        ? T('HarborGate reports credentials are configured; connection is not confirmed.')
        : T('Use HarborGate setup to configure this connector. HarborDesk does not store IM secrets.');

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

  private inferenceHealthTone(health: InferenceHealthResponse): HarborDeskStatusTone {
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

  private normalizeTab(tab: string | null): HarborDeskTabId | null {
    if (tab === 'hardware-rag') {
      return 'models';
    }
    if (tab === 'devices-aiot') {
      return 'devices';
    }
    if (tab === 'harboros') {
      return 'system';
    }
    return this.tabs.some((candidate) => candidate.id === tab) ? tab as HarborDeskTabId : null;
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
      const payload = (error as { error?: { message?: unknown } | string }).error;
      if (typeof payload === 'string' && payload.trim()) {
        return payload;
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

    return T('The request failed before HarborDesk could update this setting.');
  }
}
