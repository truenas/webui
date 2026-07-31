export interface HarborAssistantBackendStatus {
  connected: boolean;
  summary: string;
  generatedAt: string | null;
  error: string | null;
}

export type HarborAssistantStatusTone = 'good' | 'warn' | 'danger' | 'neutral';

export interface HarborAssistantMetric {
  label: string;
  value: string;
  detail: string;
  tone: HarborAssistantStatusTone;
}

export type HarborAssistantTabId = 'search' | 'camera' | 'messages' | 'home-assistant' | 'settings';

export interface HarborAssistantTab {
  id: HarborAssistantTabId;
  label: string;
  detail: string;
}

export interface EndpointResult<T> {
  data: T | null;
  error: string | null;
}

export interface HomeAssistantStatusResponse {
  configured: boolean;
  enabled: boolean;
  base_url: string;
  token_configured: boolean;
  token_redacted: boolean;
  exposed_domains: string[];
  status: string;
  last_error?: string | null;
  last_test_at?: string | null;
  last_sync_at?: string | null;
  entity_count: number;
  service_count: number;
  version?: string | null;
  location_name?: string | null;
}

export interface HomeAssistantConfigPayload {
  enabled: boolean;
  base_url: string;
  access_token?: string | null;
  exposed_domains: string[];
}

export interface HomeAssistantConfigResponse {
  status: HomeAssistantStatusResponse;
}

export interface HomeAssistantConnectionTest {
  ok: boolean;
  status: string;
  location_name?: string | null;
  version?: string | null;
  error?: string | null;
}

export interface HomeAssistantTestResponse {
  test: HomeAssistantConnectionTest;
  status: HomeAssistantStatusResponse;
}

export interface HomeAssistantEntity {
  entity_id: string;
  domain: string;
  state: string;
  display_name: string;
  source?: string;
  readiness?: 'read_only' | 'safe_control' | 'unsupported' | string;
  automation_role?: string;
  automation_reference_allowed?: boolean;
  safe_control?: boolean;
  area_id?: string | null;
  device_class?: string | null;
  last_changed?: string | null;
  last_updated?: string | null;
  attributes?: Record<string, unknown>;
}

export interface HomeAssistantEntitiesResponse {
  entities: HomeAssistantEntity[];
}

export interface HomeAssistantService {
  service: string;
  name?: string | null;
  description?: string | null;
  fields?: Record<string, unknown>;
}

export interface HomeAssistantServiceDomain {
  domain: string;
  services: HomeAssistantService[];
}

export interface HomeAssistantServicesResponse {
  services: HomeAssistantServiceDomain[];
}

export interface HomeAssistantSyncResponse {
  status: HomeAssistantStatusResponse;
  entities: HomeAssistantEntity[];
  service_domains: HomeAssistantServiceDomain[];
}

export type AutomationReviewStatus = 'draft' | 'pending' | 'active' | 'paused' | 'discarded' | 'expired';

export interface AutomationRuleReview {
  review_id: string;
  workspace_id: string;
  source: string;
  source_channel?: string | null;
  source_conversation_id?: string | null;
  original_prompt: string;
  status: AutomationReviewStatus;
  trigger_definition?: Record<string, unknown> | null;
  condition_definition?: Record<string, unknown> | null;
  action_plan?: Record<string, unknown> | null;
  device_refs?: unknown[];
  risk_level?: string | null;
  requires_approval?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  expires_at?: string | null;
  rule_id?: string | null;
  run_summaries?: unknown[];
  metadata?: Record<string, unknown> | null;
}

export interface AutomationReviewPayload {
  review_id?: string;
  workspace_id?: string;
  source?: string;
  source_channel?: string | null;
  source_conversation_id?: string | null;
  original_prompt: string;
  status?: AutomationReviewStatus;
  trigger_definition?: Record<string, unknown>;
  condition_definition?: Record<string, unknown>;
  action_plan?: Record<string, unknown>;
  device_refs?: unknown[];
  risk_level?: string;
  requires_approval?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AutomationReviewsResponse {
  generated_at: string;
  pending_count: number;
  reviews: AutomationRuleReview[];
}

export interface HomeAssistantInstallStatusResponse {
  app_id: string;
  status: string;
  managed: boolean;
  runtime: string;
  container_name?: string | null;
  onboarding_url?: string | null;
  message: string;
}

export interface HomeAssistantInstallPlanResponse {
  app_id: string;
  target: string;
  runtime: string;
  image: string;
  container_name: string;
  ports: string[];
  volumes: string[];
  next_step: string;
}

export interface HomeAssistantInstallResponse {
  status: string;
  dry_run: boolean;
  plan: HomeAssistantInstallPlanResponse;
  message: string;
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

export interface DvrRecordingSettings {
  recording_root: string;
  media_library_root: string;
  retention_days: number;
  segment_seconds: number;
  continuous_recording_enabled: boolean;
  low_bitrate_stream_preferred: boolean;
  continuous_bitrate_mbps: number;
  high_res_event_clips_enabled: boolean;
  high_res_event_clip_seconds: number;
  continuous_stream_path_hint?: string | null;
  high_res_stream_path_hint?: string | null;
  disk_budget_gb: number;
  keyframe_count: number;
  keyframe_interval_seconds: number;
  enabled_device_ids: string[];
}

export interface DvrRecordingStatus {
  device_id: string;
  status: string;
  started_at?: string | null;
  updated_at?: string | null;
  stream_kind?: string;
  last_segment_path?: string | null;
  live_mjpeg_url?: string | null;
  message?: string;
}

export interface DvrRecordingStatusResponse {
  generated_at: string;
  settings: DvrRecordingSettings;
  capacity: {
    camera_count: number;
    enabled_camera_count: number;
    retention_days: number;
    bitrate_mbps: number;
    estimated_bytes_per_camera: number;
    estimated_bytes_enabled_total: number;
    disk_budget_bytes?: number | null;
    disk_budget_warning?: string | null;
  };
  root_exists: boolean;
  root_writable: boolean;
  statuses: DvrRecordingStatus[];
}

export interface DvrTimelineSegment {
  device_id: string;
  file_path: string;
  sidecar_path?: string | null;
  media_kind?: 'snapshot' | 'recording' | string;
  stream_kind: string;
  started_at: string;
  created_at?: string;
  ended_at: string;
  duration_seconds: number;
  duration_actual_seconds?: number | null;
  retention_expires_at: string;
  size_bytes: number;
  replay_url?: string | null;
  thumbnail_url?: string | null;
  playable?: boolean;
  indexed: boolean;
}

export interface DvrTimelineResponse {
  generated_at: string;
  recording_root: string;
  media_library_root?: string;
  segments: DvrTimelineSegment[];
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
  rtsp_port?: number | null;
  rtsp_username?: string | null;
  rtsp_password?: string | null;
}

export interface DiscoveryScanResultItem {
  candidate_id: string;
  device_id?: string | null;
  name: string;
  room: string;
  ip: string;
  port: number;
  protocol: string;
  note: string;
  reachable: boolean;
  registered: boolean;
  requires_auth?: boolean;
  vendor?: string | null;
  model?: string | null;
  rtsp_paths?: string[];
}

export interface DiscoveryScanResponse extends AdminStateResponse {
  results?: DiscoveryScanResultItem[];
  scanned_hosts?: number;
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

export interface LocalVisionEventArtifact {
  artifact_id?: string | null;
  role: string;
  mime_type?: string | null;
  byte_size?: number | null;
  sha256?: string | null;
  source?: string | null;
}

export interface LocalVisionEventVlmSummary {
  status: string;
  summary: string;
  tags?: string[];
  labels?: string[];
  derived_text?: string;
  artifacts?: LocalVisionEventArtifact[];
  ingest_metadata?: Record<string, unknown>;
  vlm_metrics?: Record<string, unknown>;
  error?: string | null;
}

export interface LocalVisionSnapshotArtifact {
  artifact_id?: string | null;
  path?: string | null;
  mime_type?: string | null;
  byte_size?: number | null;
  sha256?: string | null;
  source?: string | null;
}

export interface LocalVisionEvent {
  event_id: string;
  camera_id: string;
  event_type: string;
  confidence: number;
  labels: string[];
  summary: string;
  snapshot_artifact: LocalVisionSnapshotArtifact;
  started_at: string;
  analyzer: string;
  latency_ms: number;
  metrics?: Record<string, unknown>;
  vlm?: LocalVisionEventVlmSummary | null;
}

export interface StoredLocalVisionEvent {
  received_at: string;
  event: LocalVisionEvent;
  audit_record?: Record<string, unknown>;
  ha_mqtt_payload?: Record<string, unknown>;
}

export interface LocalVisionEventsResponse {
  generated_at: string;
  limit: number;
  events: StoredLocalVisionEvent[];
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

export interface ModelRuntimeStatus {
  runtime_id: string;
  display_name: string;
  runtime_kind: string;
  provider_key: string;
  status: string;
  managed?: boolean;
  installable?: boolean;
  enabled?: boolean;
  capabilities?: string[];
  runtime_profiles?: string[];
  bind_url?: string | null;
  healthz_url?: string | null;
  model_store_path?: string;
  message?: string;
  installed_at?: string | null;
  updated_at?: string | null;
  metadata?: Record<string, unknown>;
  installed: boolean;
  active: boolean;
  next_action: string;
}

export interface ModelRuntimeManagerResponse {
  generated_at: string;
  checked_at: string;
  status: string;
  runtimes: ModelRuntimeStatus[];
  blockers?: string[];
  warnings?: string[];
}

export interface ModelRuntimeInstallResponse {
  runtime: ModelRuntimeStatus;
  runtime_manager: ModelRuntimeManagerResponse;
  message: string;
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
  installable?: boolean;
  manual_only?: boolean;
  repo_id?: string;
  revision?: string;
  file_policy?: string;
  default_hf_endpoint?: string | null;
  runtime_profiles?: string[];
  expected_capabilities?: string[];
  recommended_hardware: string;
  status: string;
  local_path?: string | null;
  installed?: boolean;
  size_bytes?: number | null;
  download_size_hint: string;
  hardware_fit?: string;
  fit_reason?: string;
  recommendation_group?: string;
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
  capability_id?: string | null;
  display_name?: string | null;
  provider_key?: string | null;
  target_path?: string | null;
  hf_endpoint?: string | null;
  metadata?: Record<string, unknown>;
}

export interface HardwareReadinessComponent {
  status: string;
  summary: string;
  detail: string;
  evidence?: string[];
}

export type ModelCapabilityStatusValue =
  | 'ready'
  | 'needs_model'
  | 'needs_runtime'
  | 'downloading'
  | 'installed_not_running'
  | 'degraded'
  | 'unsupported'
  | string;

export interface ModelCapabilityCurrentModel {
  model_endpoint_id: string;
  model_name: string;
  provider_key: string;
  status: string;
}

export interface ModelCapabilityInstallableModel {
  model_id: string;
  display_name: string;
  provider_key: string;
  model_kind: string;
  status: string;
  installed?: boolean;
  local_path?: string | null;
  download_job_id?: string | null;
  download_size_hint?: string;
  hardware_fit?: string;
  fit_reason?: string;
  recommendation_group?: string;
  source_kind?: string;
  repo_id?: string | null;
  file_policy?: string;
  default_hf_endpoint?: string | null;
  runtime_profiles?: string[];
  expected_capabilities?: string[];
}

export interface ModelCapabilityStatus {
  capability_id: string;
  label: string;
  model_kind: string;
  status: ModelCapabilityStatusValue;
  desired_model_id?: string | null;
  active_model_id?: string | null;
  transition_status?: string;
  last_error?: string | null;
  /** @deprecated Use desired_model_id. */
  selected_model_id?: string | null;
  /** @deprecated Use active_model_id. */
  runtime_model_id?: string | null;
  current_model?: ModelCapabilityCurrentModel | null;
  installed_models?: ModelCapabilityInstallableModel[];
  installable_models: ModelCapabilityInstallableModel[];
  download_jobs: LocalModelDownloadJob[];
  next_action: string;
  runtime_ready?: boolean;
  required_runtime_profile?: string | null;
  runtime_installed?: boolean;
  runtime_installable?: boolean;
  runtime_status?: string | null;
  runtime_next_action?: string | null;
  source_of_truth?: string;
  evidence?: string[];
}

export interface ModelStoreStatusResponse {
  path: string;
  status: string;
  writable: boolean;
  runtime_readable: boolean;
  next_action: string;
  blockers?: string[];
  warnings?: string[];
}

export interface ModelCapabilitiesResponse {
  generated_at: string;
  checked_at: string;
  status: string;
  model_store?: ModelStoreStatusResponse;
  runtime_manager?: ModelRuntimeManagerResponse;
  capabilities: ModelCapabilityStatus[];
  blockers?: string[];
  warnings?: string[];
}

export interface HardwareReadinessResponse {
  generated_at?: string | null;
  status: string;
  cpu: HardwareReadinessComponent;
  memory: HardwareReadinessComponent;
  gpu: HardwareReadinessComponent;
  npu: HardwareReadinessComponent;
  memory_mb?: number | null;
  gpu_vram_total_mb?: number | null;
  gpu_vram_free_mb?: number | null;
  hardware_class?: string;
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
  supported_file_count?: number | null;
  unindexed_file_count?: number | null;
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

export interface KnowledgeIndexJobRecord {
  job_id: string;
  source_root_id: string;
  source_root_label: string;
  source_root_path: string;
  modalities: string[];
  status: string;
  progress_percent?: number | null;
  requested_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  retry_count: number;
  checkpoint: {
    phase?: string;
    embedding_total?: number;
    embedding_completed?: number;
    embedding_skipped?: number;
    embedding_failed?: number;
    [key: string]: unknown;
  };
  resource_profile: string;
  cancel_requested: boolean;
}

export interface KnowledgeIndexJobsResponse {
  generated_at: string;
  jobs: KnowledgeIndexJobRecord[];
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
