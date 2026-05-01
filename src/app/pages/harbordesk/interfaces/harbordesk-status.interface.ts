export interface HarborDeskBackendStatus {
  connected: boolean;
  summary: string;
  generatedAt: string | null;
  error: string | null;
}

export type HarborDeskStatusTone = 'good' | 'warn' | 'danger' | 'neutral';

export interface HarborDeskMetric {
  label: string;
  value: string;
  detail: string;
  tone: HarborDeskStatusTone;
}

export type HarborDeskTabId = 'overview' | 'im' | 'models' | 'devices' | 'system';

export interface HarborDeskTab {
  id: HarborDeskTabId;
  label: string;
  detail: string;
}

export interface EndpointResult<T> {
  data: T | null;
  error: string | null;
}

export interface CameraCapabilities {
  snapshot?: boolean;
  stream?: boolean;
  ptz?: boolean;
  audio?: boolean;
}

export interface CameraProfile {
  transport?: string;
  rtsp_url?: string;
  snapshot_url?: string | null;
  path_candidates?: string[];
}

export interface CameraStreamRef {
  transport?: string;
  url?: string;
  requires_auth?: boolean;
}

export interface CameraDevice {
  device_id: string;
  name: string;
  room?: string | null;
  status?: string;
  kind?: string;
  vendor?: string | null;
  model?: string | null;
  ip_address?: string | null;
  discovery_source?: string;
  primary_stream?: CameraStreamRef;
  snapshot_url?: string | null;
  capabilities?: CameraCapabilities;
  provider?: string;
  profile?: CameraProfile;
  metadata?: Record<string, unknown>;
}

export interface DeviceCredentialStatus {
  device_id: string;
  configured: boolean;
  redacted: boolean;
  username?: string | null;
  rtsp_port?: number | null;
  path_count?: number;
  source?: string;
  updated_at?: string | null;
  last_verified_at?: string | null;
}

export interface BridgeProviderCapabilities {
  reply?: boolean;
  update?: boolean;
  attachments?: boolean;
}

export interface GatewayPlatformStatus {
  platform: string;
  enabled?: boolean;
  connected?: boolean;
  configured?: boolean;
  display_name?: string;
  status?: string;
  manage_url?: string;
  setup_url?: string;
  qr_page_url?: string;
  qr_svg_url?: string;
  last_checked_at?: string | null;
  capabilities?: BridgeProviderCapabilities;
}

export interface BridgeProviderConfig {
  configured?: boolean;
  connected?: boolean;
  platform?: string;
  gateway_base_url?: string;
  app_name?: string;
  status?: string;
  last_checked_at?: string | null;
  capabilities?: BridgeProviderCapabilities;
}

export interface NotificationTargetRecord {
  target_id: string;
  label: string;
  route_key: string;
  platform_hint?: string | null;
  is_default?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  last_seen_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationTargetsResponse {
  targets: NotificationTargetRecord[];
}

export interface GatewayStatusResponse {
  ok?: boolean;
  configured?: boolean;
  connected?: boolean;
  platform?: string;
  status?: string;
  public_origin?: string;
  gateway_base_url?: string;
  manage_url?: string;
  setup_url?: string;
  static_setup_url?: string;
  qr_page_url?: string;
  qr_svg_url?: string;
  last_checked_at?: string | null;
  channels?: GatewayPlatformStatus[];
  platforms?: GatewayPlatformStatus[];
  bridge_provider?: BridgeProviderConfig;
  feishu?: GatewayPlatformStatus & { rehearsal_ready?: boolean };
  weixin?: GatewayPlatformStatus & {
    rehearsal_ready?: boolean;
    blocker_category?: string;
    ingress_blocker_category?: string;
  };
  weixin_blocker_category?: string;
  ingress_observability?: Record<string, unknown>;
  delivery_observability?: Record<string, unknown>;
}

export interface InferenceHealthResponse {
  status?: string;
  ready?: boolean;
  service?: string;
  backend_kind?: string;
  backend?: Record<string, unknown> | null;
  error?: string | null;
}

export interface AdminDefaults {
  cidr?: string;
  discovery?: string;
  recording?: string;
  capture?: string;
  ai?: string;
  notification_channel?: string;
  rtsp_username?: string;
  rtsp_password?: string;
  rtsp_port?: number | null;
  rtsp_paths?: string[];
  selected_camera_device_id?: string | null;
  capture_subdirectory?: string | null;
  clip_length_seconds?: number | null;
  keyframe_count?: number | null;
  keyframe_interval_seconds?: number | null;
}

export interface AdminBindingState {
  channel?: string;
  status?: string;
  session_code?: string;
  setup_url?: string;
  static_setup_url?: string;
  metric?: string;
  bound_user?: string | null;
}

export interface AdminStateResponse {
  binding?: AdminBindingState;
  defaults?: AdminDefaults;
  bridge_provider?: BridgeProviderConfig;
  writable_root?: string;
  current_principal_user_id?: string;
  current_principal_display_name?: string;
  devices?: CameraDevice[];
  device_credential_statuses?: DeviceCredentialStatus[];
  account_management?: {
    gateway?: {
      binding_channel?: string;
      binding_status?: string;
      binding_metric?: string;
      binding_bound_user?: string | null;
      manage_url?: string;
      setup_url?: string;
      static_setup_url?: string;
      bridge_provider?: BridgeProviderConfig;
    };
    notification_targets?: NotificationTargetRecord[];
    delivery_policy?: {
      interactive_reply?: string;
      proactive_delivery?: string;
    };
  };
}

export interface DiscoveryScanPayload {
  cidr?: string | null;
  protocol?: string | null;
}

export interface ManualDevicePayload {
  name: string;
  room?: string | null;
  ip: string;
  path?: string | null;
  snapshot_url?: string | null;
  username?: string | null;
  password?: string | null;
  port?: number | null;
}

export interface DeviceCredentialsPayload {
  username?: string | null;
  password?: string | null;
  rtsp_port?: number | null;
  rtsp_paths?: string[];
}

export interface AdminDefaultsPayload {
  cidr: string;
  discovery: string;
  recording: string;
  capture: string;
  ai: string;
  notification_channel: string;
  rtsp_username: string;
  rtsp_password: string;
  rtsp_port: number | null;
  rtsp_paths: string[];
  selected_camera_device_id?: string | null;
  capture_subdirectory?: string | null;
  clip_length_seconds?: number | null;
  keyframe_count?: number | null;
  keyframe_interval_seconds?: number | null;
}

export interface DeviceMetadataPatchPayload {
  name?: string | null;
  room?: string | null;
  vendor?: string | null;
  model?: string | null;
  ip_address?: string | null;
  snapshot_url?: string | null;
  primary_stream_url?: string | null;
  rtsp_path?: string | null;
  rtsp_port?: number | null;
  requires_auth?: boolean | null;
}

export interface RtspCheckPayload extends DeviceCredentialsPayload {}

export interface RtspCheckResult {
  device_id: string;
  reachable: boolean;
  stream_url?: string | null;
  transport?: string;
  requires_auth?: boolean;
  capabilities?: CameraCapabilities;
  error_message?: string | null;
  checked_at?: string;
}

export interface DeviceEvidenceResult {
  id?: string;
  kind: 'rtsp_check' | 'snapshot' | 'share_link' | 'credential_status' | string;
  status?: string;
  summary?: string;
  detail?: string;
  checked_at?: string | null;
  generated_at?: string | null;
  action_path?: string;
  endpoint?: string;
  artifact_path?: string | null;
  share_link_id?: string | null;
  redacted?: boolean;
  expires_at?: string | null;
  error_message?: string | null;
}

export interface DeviceEvidenceResponse {
  device_id: string;
  status?: string;
  summary?: string;
  generated_at?: string | null;
  checked_at?: string | null;
  next_action?: string;
  action_path?: string;
  results?: DeviceEvidenceResult[];
  rtsp_check?: DeviceEvidenceResult;
  snapshot?: DeviceEvidenceResult;
  share_link?: DeviceEvidenceResult;
  credential_status?: DeviceEvidenceResult;
  blockers?: string[];
  warnings?: string[];
}

export interface DeviceValidationRunRequest {
  scope?: 'all' | 'rtsp' | 'snapshot' | 'share-link' | 'credentials';
  reason?: string;
}

export interface DeviceValidationRunResponse {
  run_id?: string;
  device_id: string;
  status?: string;
  summary?: string;
  started_at?: string;
  completed_at?: string | null;
  evidence?: DeviceEvidenceResponse;
  blockers?: string[];
  warnings?: string[];
}

export interface ShareLinkSummary {
  share_link_id: string;
  media_session_id?: string;
  device_id: string;
  device_name?: string;
  opened_by_user_id?: string | null;
  access_scope?: string;
  session_status?: string;
  status: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  can_revoke: boolean;
}

export interface ModelEndpointRecord {
  model_endpoint_id: string;
  workspace_id?: string | null;
  provider_account_id?: string | null;
  model_kind: string;
  endpoint_kind: string;
  provider_key: string;
  model_name: string;
  capability_tags?: string[];
  cost_policy?: Record<string, unknown>;
  status: string;
  metadata?: Record<string, unknown>;
}

export interface ModelEndpointsResponse {
  endpoints: ModelEndpointRecord[];
}

export interface ModelEndpointPayload {
  model_endpoint_id: string;
  workspace_id?: string | null;
  provider_account_id?: string | null;
  model_kind: string;
  endpoint_kind: string;
  provider_key: string;
  model_name: string;
  capability_tags: string[];
  cost_policy: Record<string, unknown>;
  status: string;
  metadata: Record<string, unknown>;
}

export interface ModelEndpointTestResult {
  ok: boolean;
  status: string;
  summary: string;
  endpoint?: ModelEndpointRecord;
  details?: Record<string, unknown>;
}

export interface ModelRoutePolicyRecord {
  route_policy_id: string;
  workspace_id: string;
  domain_scope: string;
  modality: string;
  privacy_level: string;
  local_preferred: boolean;
  max_cost_per_run?: number | null;
  fallback_order: string[];
  status: string;
  metadata?: Record<string, unknown>;
}

export interface ModelPoliciesResponse {
  route_policies: ModelRoutePolicyRecord[];
}

export interface LocalModelDownloadJob {
  job_id: string;
  model_id: string;
  display_name?: string;
  provider_key?: string;
  status: string;
  requested_at?: string;
  updated_at?: string;
  target_path?: string | null;
  progress_percent?: number | null;
  bytes_downloaded?: number | null;
  total_bytes?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface LocalModelCatalogItem {
  model_id: string;
  display_name: string;
  provider_key: string;
  model_kind: string;
  source_kind?: string;
  repo_id?: string;
  revision?: string;
  expected_capabilities?: string[];
  recommended_hardware: string;
  status: string;
  local_path?: string | null;
  installed?: boolean;
  size_bytes?: number | null;
  download_size_hint: string;
  acceptance_note?: string;
  evidence?: string[];
  metadata?: Record<string, unknown>;
}

export interface LocalModelCatalogResponse {
  generated_at?: string | null;
  cache_roots?: string[];
  models: LocalModelCatalogItem[];
  download_jobs?: LocalModelDownloadJob[];
}

export interface LocalModelDownloadsResponse {
  generated_at?: string | null;
  jobs: LocalModelDownloadJob[];
}

export interface LocalModelDownloadJobResponse {
  job: LocalModelDownloadJob;
}

export interface ModelDownloadRequest {
  model_id: string;
  display_name?: string | null;
  provider_key?: string | null;
  target_path?: string | null;
  metadata?: Record<string, unknown>;
}

export interface HardwareReadinessComponent {
  status: string;
  summary: string;
  detail: string;
  evidence?: string[];
}

export interface HardwareReadinessResponse {
  generated_at?: string | null;
  status: string;
  cpu: HardwareReadinessComponent;
  memory: HardwareReadinessComponent;
  gpu: HardwareReadinessComponent;
  npu: HardwareReadinessComponent;
  recommended_model_profile: string;
  blockers?: string[];
  evidence?: string[];
}

export interface RagReadinessComponent {
  status: string;
  summary: string;
  detail: string;
  evidence?: string[];
}

export interface RagCapabilityReadinessCard {
  capability_id: string;
  label: string;
  status: string;
  summary: string;
  blockers?: string[];
  warnings?: string[];
  evidence?: string[];
}

export interface RagReadinessResponse {
  generated_at?: string | null;
  status: string;
  summary?: string;
  source_roots?: RagReadinessComponent;
  index_directory: RagReadinessComponent;
  embedding_model: RagReadinessComponent;
  media_parser: RagReadinessComponent;
  storage_writable: RagReadinessComponent;
  capability_profiles?: RagCapabilityReadinessCard[];
  blockers?: string[];
  warnings?: string[];
  evidence?: string[];
}

export interface KnowledgeSourceRoot {
  root_id: string;
  label: string;
  path: string;
  enabled: boolean;
  include: string[];
  exclude: string[];
  last_indexed_at?: string | null;
}

export interface KnowledgeSettings {
  source_roots: KnowledgeSourceRoot[];
  index_root: string;
  privacy_level?: string;
  default_resource_profile?: string;
}

export interface KnowledgeIndexRootStatus {
  root_id: string;
  label: string;
  path: string;
  enabled: boolean;
  exists: boolean;
  last_indexed_at?: string | null;
  status: string;
  detail: string;
}

export interface KnowledgeIndexStatusResponse {
  generated_at: string;
  status: string;
  settings: KnowledgeSettings;
  index_root_exists: boolean;
  index_root_writable: boolean;
  manifest_count?: number;
  manifest_entry_count?: number;
  document_count?: number;
  image_count?: number;
  audio_count?: number;
  video_count?: number;
  content_indexed_image_count?: number;
  vlm_indexed_image_count?: number;
  ocr_indexed_image_count?: number;
  image_content_missing_count?: number;
  image_text_source_counts?: Record<string, number>;
  embedding_cache_count?: number;
  embedding_entry_count?: number;
  storage_usage_bytes?: number;
  last_indexed_at?: string | null;
  source_roots: KnowledgeIndexRootStatus[];
  blockers: string[];
}

export interface KnowledgeIndexRunResponse {
  generated_at: string;
  status: string;
  index_root: string;
  root_count: number;
  indexed_roots: KnowledgeIndexRootStatus[];
  errors: string[];
}

export interface FileBrowseEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size_bytes?: number | null;
}

export interface FilesBrowseResponse {
  path: string;
  parent?: string | null;
  readonly: boolean;
  allowed_roots: string[];
  entries: FileBrowseEntry[];
}

export interface HarborOsServiceStatus {
  service_id: string;
  label: string;
  status: string;
  detail: string;
}

export interface HarborOsStatusResponse {
  generated_at?: string | null;
  status: string;
  version: string;
  webui_url: string;
  system_domain_only: boolean;
  services: HarborOsServiceStatus[];
  jobs_alerts: HarborOsServiceStatus;
  storage_files_entry: HarborOsServiceStatus;
  evidence?: string[];
  blockers?: string[];
}

export interface HarborOsImCapabilityItem {
  capability_id: string;
  label: string;
  capability_class: 'safe_query' | 'approval_required_action' | 'unsupported_high_risk' | string;
  im_ready: boolean;
  risk_level: string;
  approval_required: boolean;
  harboros_surface: string;
  notes: string;
}

export interface HarborOsImCapabilityMapResponse {
  generated_at?: string | null;
  source?: string;
  items: HarborOsImCapabilityItem[];
}
