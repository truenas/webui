import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  HarborBotResultFilter,
  HarborBotCameraDevice,
  HarborBotDvrRecordingStatus,
  HarborBotDvrTimelineSegment,
  HarborBotSearchHit,
  HarborBotSearchResponse,
  HarborBotSourceScope,
  HarborBotWaterfallItem,
} from 'app/pages/harbor/shared/harbor.interface';
import { HarborApiService } from 'app/pages/harbor/shared/harbor-api.service';
import {
  buildHarborBotSearchPayload,
  buildHarborBotWaterfallItems,
  harborBotErrorMessage,
  harborBotHasNoResults,
  harborBotSameOriginAdminUrl,
} from 'app/pages/harbor/shared/harbor-results';

interface HarborBotPromptSuggestion {
  label: string;
  query: string;
  filter: HarborBotResultFilter;
  sourceScope?: HarborBotSourceScope;
  matchers?: string[];
}

type HarborBotLocalMediaStatus = 'archiving' | 'archive_failed' | 'finalizing';
type HarborBotRecordIntent = 'starting' | 'finalizing';

interface HarborBotMediaItem extends HarborBotDvrTimelineSegment {
  local_preview_url?: string;
  local_status?: HarborBotLocalMediaStatus;
  optimistic_key?: string;
}

@Component({
  selector: 'ix-harborcam',
  templateUrl: './harborcam.component.html',
  styleUrl: './harborcam.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    ReactiveFormsModule,
    TranslateModule,
    NgClass,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCard,
    MatCardContent,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressBar,
    MatTab,
    MatTabGroup,
  ],
})
export class HarborCamComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(HarborApiService);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('liveImage') private liveImage?: ElementRef<HTMLImageElement>;
  @ViewChild('mediaViewer') private mediaViewer?: ElementRef<HTMLElement>;
  @ViewChild('searchResults') private searchResults?: ElementRef<HTMLElement>;

  protected readonly form = this.formBuilder.group({
    query: ['', Validators.required],
    filter: ['all' as HarborBotResultFilter, Validators.required],
    sourceScope: ['dvr_library' as HarborBotSourceScope, Validators.required],
    from: [''],
    to: [''],
  });

  protected readonly fixtureCameraId = 'public-fixture-dvr';

  protected readonly promptSuggestions: HarborBotPromptSuggestion[] = [
    {
      label: '谁在倒啤酒？',
      query: '谁在倒啤酒',
      filter: 'videos',
      sourceScope: 'dvr_library',
      matchers: ['谁在倒啤酒', '倒啤酒', '啤酒'],
    },
    {
      label: '谁在倒饮料？',
      query: '谁在倒饮料',
      filter: 'videos',
      sourceScope: 'dvr_library',
      matchers: ['谁在倒饮料', '倒饮料', '倒水', '倒啤酒'],
    },
    {
      label: '猫有没有喝水？',
      query: '猫喝水',
      filter: 'videos',
      sourceScope: 'dvr_library',
      matchers: ['猫喝水', '猫有没有喝水', '喝水'],
    },
    {
      label: '猫在哪里休息？',
      query: '猫在沙发上休息',
      filter: 'videos',
      sourceScope: 'dvr_library',
      matchers: ['猫在哪里休息', '猫在沙发上休息', '猫休息', '沙发'],
    },
  ];

  protected readonly loading = signal(false);
  protected readonly cameraLoading = signal(false);
  protected readonly response = signal<HarborBotSearchResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cameraError = signal<string | null>(null);
  protected readonly cameras = signal<HarborBotCameraDevice[]>([]);
  protected readonly selectedCameraId = signal<string | null>(null);
  protected readonly dvrStatuses = signal<HarborBotDvrRecordingStatus[]>([]);
  protected readonly dvrTimeline = signal<HarborBotMediaItem[]>([]);
  protected readonly optimisticMediaItems = signal<HarborBotMediaItem[]>([]);
  protected readonly liveSnapshotToken = signal(Date.now());
  protected readonly liveSnapshotErrorToken = signal<number | null>(null);
  protected readonly lastGoodLiveFrameUrl = signal<string | null>(null);
  protected readonly liveMjpegFailed = signal(false);
  protected readonly actionBusy = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly mediaLibraryExpanded = signal(true);
  protected readonly selectedMediaItem = signal<HarborBotMediaItem | null>(null);
  protected readonly selectedTabIndex = signal(0);
  protected readonly liveFeedback = signal<string | null>(null);
  protected readonly recordIntent = signal<HarborBotRecordIntent | null>(null);
  private cameraRefreshRetryQueued = false;
  private actionMessageToken = 0;
  private liveFeedbackToken = 0;

  ngOnInit(): void {
    this.refreshCameraDvr();
    timer(0, 3000).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (!this.isRecording() && this.recordIntent() === null && this.actionBusy() !== 'snapshot') {
        this.liveSnapshotToken.set(Date.now());
      }
    });
  }

  search(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    const searchScope = this.searchScopeForQuery(this.form.controls.query.value);
    const payload = buildHarborBotSearchPayload(
      this.form.controls.query.value,
      searchScope.filter,
      24,
      {
        cameraId: searchScope.cameraId,
        from: this.localDateTimeToUnixSeconds(this.form.controls.from.value),
        sourceScope: searchScope.sourceScope,
        to: this.localDateTimeToUnixSeconds(this.form.controls.to.value),
      },
    );
    this.loading.set(true);
    this.error.set(null);
    this.mediaLibraryExpanded.set(false);
    this.scrollToSearchResults();

    this.api.search(payload).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (response) => {
        this.response.set(response);
        this.mediaLibraryExpanded.set(false);
        this.scrollToSearchResults();
      },
      error: (error: unknown) => {
        this.response.set(null);
        this.error.set(harborBotErrorMessage(error));
        this.mediaLibraryExpanded.set(false);
        this.scrollToSearchResults();
      },
    });
  }

  refreshCameraDvr(): void {
    this.cameraLoading.set(true);
    this.cameraError.set(null);
    const refreshErrors: string[] = [];

    forkJoin({
      state: this.api.cameraState().pipe(
        catchError((error: unknown) => {
          const message = harborBotErrorMessage(error);
          const displayMessage = this.cameraRefreshErrorMessage(message);
          if (!this.isTransientAdminStateError(message) || this.cameras().length === 0) {
            refreshErrors.push(displayMessage);
          }
          if (this.isTransientAdminStateError(message)) {
            this.scheduleCameraRefreshRetry();
          }
          return of({
            defaults: { selected_camera_device_id: this.selectedCameraId() },
            devices: this.cameras(),
          });
        }),
      ),
      dvr: this.api.dvrStatus().pipe(
        catchError((error: unknown) => {
          refreshErrors.push(harborBotErrorMessage(error));
          return of({ generated_at: '', statuses: this.dvrStatuses() });
        }),
      ),
    }).subscribe({
      next: ({ state, dvr }) => {
        const devices = state.devices ?? [];
        const selected = this.selectedCameraId()
          || state.defaults?.selected_camera_device_id
          || devices[0]?.device_id
          || null;
        this.cameras.set(devices);
        this.selectedCameraId.set(selected);
        this.dvrStatuses.set(dvr.statuses ?? []);
        this.loadDvrTimeline(selected, refreshErrors);
      },
      error: (error: unknown) => {
        this.cameraLoading.set(false);
        this.cameraError.set(harborBotErrorMessage(error));
      },
    });
  }

  selectCamera(deviceId: string): void {
    this.selectedCameraId.set(deviceId);
    this.liveMjpegFailed.set(false);
    this.liveSnapshotErrorToken.set(null);
    this.lastGoodLiveFrameUrl.set(null);
    this.selectedMediaItem.set(null);
    this.refreshCameraDvr();
  }

  usePromptSuggestion(suggestion: HarborBotPromptSuggestion): void {
    this.form.patchValue({
      query: suggestion.query,
      filter: suggestion.filter,
      sourceScope: suggestion.sourceScope ?? 'dvr_library',
      from: '',
      to: '',
    });
    this.error.set(null);
  }

  waterfallItems(): HarborBotWaterfallItem[] {
    return buildHarborBotWaterfallItems(this.response(), this.form.controls.filter.value);
  }

  noResults(): boolean {
    return harborBotHasNoResults(this.response());
  }

  hasSearchResponse(): boolean {
    return this.response() !== null;
  }

  embeddingUnavailable(result: HarborBotSearchResponse | null = this.response()): boolean {
    const reason = result?.degraded_reason?.toLowerCase() ?? '';
    const warnings = (result?.warnings ?? []).join(' ').toLowerCase();
    const blockers = (result?.blockers ?? []).join(' ').toLowerCase();
    return reason.includes('embedding')
      || warnings.includes('embedding')
      || blockers.includes('embedding');
  }

  openHarborDeskModels(): void {
    window.open('/ui/harbordesk?tab=models&focus=semantic-index', '_blank', 'noopener');
  }

  selectedCameraIsFixture(): boolean {
    return this.selectedCameraId() === this.fixtureCameraId;
  }

  searchScopeLabel(): string {
    switch (this.form.controls.sourceScope.value) {
      case 'dvr_library':
        return 'DVR 媒体库';
      case 'nas_files':
        return 'NAS 文件夹';
      case 'all':
      default:
        return '全部知识源';
    }
  }

  openPreview(item: HarborBotWaterfallItem): void {
    window.open(item.previewUrl, '_blank', 'noopener');
  }

  openReplay(segment: HarborBotMediaItem): void {
    if (!this.canOpenMediaItem(segment)) {
      this.actionError.set('该媒体还不可回放。');
      return;
    }
    this.blurActiveElement();
    this.actionError.set(null);
    this.selectedMediaItem.set(segment);
    this.selectedTabIndex.set(1);
    this.scrollToMediaViewer();
  }

  closeMediaPreview(): void {
    this.selectedMediaItem.set(null);
  }

  openLatestReplay(): void {
    const segment = this.timelineItems().find((item) => this.mediaKind(item) === 'recording' && this.canOpenMediaItem(item));
    if (!segment) {
      this.actionError.set('No local DVR segments are visible yet.');
      return;
    }
    this.openReplay(segment);
  }

  captureSnapshot(): void {
    const deviceId = this.selectedCameraId();
    if (!deviceId || this.actionBusy() === 'record' || this.actionBusy() === 'snapshot') {
      return;
    }
    this.actionError.set(null);
    const localPreviewUrl = this.captureLiveImageSnapshot()
      ?? this.lastGoodLiveFrameUrl()
      ?? this.selectedSnapshotPreviewUrl();
    const optimisticKey = localPreviewUrl
      ? this.prependOptimisticSnapshot(deviceId, localPreviewUrl)
      : null;
    this.showLiveFeedback(localPreviewUrl ? 'Captured' : 'Capturing');

    if (this.shouldUseLivePreviewAsSnapshot()) {
      this.showActionMessage('该摄像头未暴露单帧快照接口，先显示当前实时预览画面。');
    }

    this.actionBusy.set('snapshot');
    timer(500).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.actionBusy() === 'snapshot') {
        this.actionBusy.set(null);
      }
    });
    this.showActionMessage(localPreviewUrl ? '已显示当前画面，正在归档快照...' : '正在抓拍当前画面...');
    this.api.createSnapshotTask(deviceId).subscribe({
      next: (response) => {
        if (response.media_item) {
          this.replaceOptimisticMediaItem(optimisticKey, response.media_item);
        }
        this.showActionMessage(response.media_item ? '已抓拍并归档当前画面。' : '已显示当前画面。');
      },
      error: (error: unknown) => {
        this.markOptimisticArchiveFailed(optimisticKey);
        this.showActionMessage(localPreviewUrl ? '已保留当前预览，后台归档失败。' : '快照归档失败。');
        this.actionError.set(harborBotErrorMessage(error));
      },
    });
  }

  startRecording(): void {
    const deviceId = this.selectedCameraId();
    if (!deviceId || this.actionBusy()) {
      return;
    }
    this.actionBusy.set('record');
    this.recordIntent.set('starting');
    this.actionError.set(null);
    this.showActionMessage('Starting recording...', 1800);
    this.api.startDvrRecording(deviceId).pipe(
      finalize(() => {
        if (this.actionBusy() === 'record') {
          this.actionBusy.set(null);
        }
      }),
    ).subscribe({
      next: (response) => {
        this.dvrStatuses.set(response.statuses ?? []);
        this.recordIntent.set(null);
        this.showActionMessage('Recording started.');
        this.refreshCameraDvr();
      },
      error: (error: unknown) => {
        this.recordIntent.set(null);
        this.actionError.set(harborBotErrorMessage(error));
      },
    });
  }

  stopRecording(): void {
    const deviceId = this.selectedCameraId();
    if (!deviceId || this.actionBusy()) {
      return;
    }
    this.actionBusy.set('record');
    this.recordIntent.set('finalizing');
    this.actionError.set(null);
    this.showActionMessage('Finalizing recording...', 2200);
    this.prependOptimisticRecording(deviceId);
    this.api.stopDvrRecording(deviceId).pipe(
      finalize(() => {
        if (this.actionBusy() === 'record') {
          this.actionBusy.set(null);
        }
      }),
    ).subscribe({
      next: (response) => {
        this.dvrStatuses.set(response.statuses ?? []);
        this.showActionMessage('Recording stopped. 正在整理可回放片段...');
        this.refreshCameraDvr();
        timer(1200).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.refreshCameraDvr();
          if (this.recordIntent() === 'finalizing') {
            this.recordIntent.set(null);
          }
        });
      },
      error: (error: unknown) => {
        this.recordIntent.set(null);
        this.removeOptimisticRecordings(deviceId);
        this.actionError.set(harborBotErrorMessage(error));
      },
    });
  }

  ptzAction(direction: string): void {
    if (!this.canPtz()) {
      this.showActionMessage('PTZ is unavailable for this camera.');
      return;
    }
    this.showActionMessage(`PTZ ${direction} is not exposed by the HarborBot API yet.`);
  }

  selectedCamera(): HarborBotCameraDevice | undefined {
    return this.cameras().find((camera) => camera.device_id === this.selectedCameraId());
  }

  selectedDvrStatus(): HarborBotDvrRecordingStatus | undefined {
    return this.dvrStatuses().find((status) => status.device_id === this.selectedCameraId());
  }

  selectedCameraLabel(): string {
    const camera = this.selectedCamera();
    return camera?.name || this.selectedCameraId() || 'Camera';
  }

  canPtz(): boolean {
    return Boolean(this.selectedCamera()?.capabilities?.ptz);
  }

  isRecording(): boolean {
    return this.selectedDvrStatus()?.status === 'recording';
  }

  showRecordingIndicator(): boolean {
    return this.isRecording() || this.recordIntent() !== null;
  }

  recordBadgeLabel(): string {
    if (this.recordIntent() === 'starting') {
      return 'STARTING';
    }
    if (this.recordIntent() === 'finalizing') {
      return 'FINALIZING';
    }
    return 'REC';
  }

  selectedLiveUrl(): string | null {
    const deviceId = this.selectedCameraId();
    if (!deviceId) {
      return null;
    }
    const lastGoodFrame = this.lastGoodLiveFrameUrl();
    if (lastGoodFrame && this.liveSnapshotErrorToken() === this.liveSnapshotToken()) {
      return lastGoodFrame;
    }
    const cameraSnapshotUrl = this.selectedCameraSnapshotUrl();
    if (cameraSnapshotUrl?.startsWith('/ui/assets/')) {
      return this.withRefreshToken(cameraSnapshotUrl);
    }
    const snapshotUrl = this.selectedSnapshotUrl();
    if (snapshotUrl) {
      return snapshotUrl;
    }
    const liveUrl = harborBotSameOriginAdminUrl(this.selectedDvrStatus()?.live_mjpeg_url);
    if (liveUrl && !this.liveMjpegFailed()) {
      return liveUrl;
    }
    return null;
  }

  selectedSnapshotUrl(): string | null {
    const deviceId = this.selectedCameraId();
    if (!deviceId) {
      return null;
    }
    const cameraSnapshotUrl = this.selectedCameraSnapshotUrl();
    if (cameraSnapshotUrl) {
      return this.withRefreshToken(cameraSnapshotUrl);
    }
    if (this.selectedCamera()?.capabilities?.snapshot) {
      return this.withRefreshToken(`/api/harbordesk/cameras/${encodeURIComponent(deviceId)}/snapshot.jpg`);
    }
    if (this.selectedCamera()?.capabilities?.stream || this.selectedDvrStatus()?.live_mjpeg_url) {
      return this.withRefreshToken(`/api/harbordesk/cameras/${encodeURIComponent(deviceId)}/snapshot.jpg`);
    }
    return null;
  }

  handleLiveError(): void {
    this.liveMjpegFailed.set(true);
    this.liveSnapshotErrorToken.set(this.liveSnapshotToken());
  }

  handleLiveLoad(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.currentSrc.startsWith('data:')) {
      return;
    }
    this.liveSnapshotErrorToken.set(null);
    const frameUrl = this.captureImageElement(image);
    if (frameUrl) {
      this.lastGoodLiveFrameUrl.set(frameUrl);
    }
  }

  timelineItems(): HarborBotMediaItem[] {
    const deviceId = this.selectedCameraId();
    const segments = [...this.optimisticMediaItems(), ...this.dvrTimeline()];
    return this.uniqueMediaItems(deviceId ? segments.filter((segment) => segment.device_id === deviceId) : segments)
      .sort((left, right) => this.mediaTimestamp(right) - this.mediaTimestamp(left))
      .slice(0, 12);
  }

  recentTimelineItems(): HarborBotMediaItem[] {
    return this.timelineItems().slice(0, 6);
  }

  latestMediaLabel(): string {
    const latest = this.timelineItems()[0];
    if (!latest) {
      return 'No recent media';
    }
    return this.formatUnix(latest.created_at || latest.started_at);
  }

  toggleMediaLibrary(): void {
    this.mediaLibraryExpanded.set(!this.mediaLibraryExpanded());
  }

  expandMediaLibrary(): void {
    this.mediaLibraryExpanded.set(true);
  }

  timelineTrackKey(index: number, segment: HarborBotMediaItem): string {
    return `${this.mediaKind(segment)}:${segment.optimistic_key ?? segment.file_path}:${index}`;
  }

  mediaKind(segment: HarborBotMediaItem): string {
    return segment.media_kind || 'recording';
  }

  mediaKindLabel(segment: HarborBotMediaItem): string {
    return this.mediaKind(segment) === 'snapshot' ? '快照' : '视频';
  }

  mediaPreviewUrl(segment: HarborBotMediaItem): string {
    return segment.local_preview_url
      ?? harborBotSameOriginAdminUrl(segment.thumbnail_url)
      ?? harborBotSameOriginAdminUrl(segment.replay_url)
      ?? this.api.previewUrl(segment.file_path);
  }

  canOpenMediaItem(segment: HarborBotMediaItem): boolean {
    return Boolean(segment.local_preview_url) || segment.playable !== false;
  }

  mediaDurationLabel(segment: HarborBotMediaItem): string {
    if (this.mediaKind(segment) === 'snapshot') {
      return '单帧';
    }
    const seconds = segment.duration_actual_seconds ?? segment.duration_seconds;
    return `${seconds || 0}s`;
  }

  mediaStatusLabel(segment: HarborBotMediaItem): string {
    if (segment.local_status === 'finalizing') {
      return '整理中';
    }
    if (segment.local_status === 'archiving') {
      return '归档中';
    }
    if (segment.local_status === 'archive_failed') {
      return '归档失败';
    }
    return this.canOpenMediaItem(segment) ? '可播放' : '不可播放';
  }

  isOptimisticMediaItem(segment: HarborBotMediaItem): boolean {
    return Boolean(segment.optimistic_key);
  }

  isArchiveFailed(segment: HarborBotMediaItem): boolean {
    return segment.local_status === 'archive_failed';
  }

  formatUnix(value: string | number | undefined | null): string {
    const seconds = Number(value ?? 0);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return 'n/a';
    }
    return new Date(seconds * 1000).toLocaleString();
  }

  bytesLabel(value: number | undefined | null): string {
    const bytes = Number(value ?? 0);
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let current = bytes;
    let unit = 0;
    while (current >= 1000 && unit < units.length - 1) {
      current /= 1000;
      unit += 1;
    }
    return `${current >= 10 || unit === 0 ? current.toFixed(0) : current.toFixed(1)} ${units[unit]}`;
  }

  resultTrackKey(index: number, item: HarborBotWaterfallItem): string {
    return `${item.kind}:${item.hit.path}:${item.hit.chunk_id ?? index}`;
  }

  kindLabel(item: HarborBotWaterfallItem): string {
    if (item.kind === 'image') {
      return 'Image';
    }
    if (item.kind === 'video') {
      return 'Video';
    }
    return 'Text';
  }

  scoreLabel(hit: HarborBotSearchHit): string {
    return `${hit.score}`;
  }

  videoPreviewUrl(item: HarborBotWaterfallItem): string {
    return `${item.previewUrl}#t=0.1`;
  }

  mediaVideoPreviewUrl(segment: HarborBotMediaItem): string {
    return `${this.mediaPreviewUrl(segment)}#t=0.1`;
  }

  mediaPlaybackUrl(segment: HarborBotMediaItem): string {
    return segment.local_preview_url
      ?? harborBotSameOriginAdminUrl(segment.replay_url)
      ?? this.api.previewUrl(segment.file_path);
  }

  sourceKinds(hit: HarborBotSearchHit): string {
    const kinds = hit.content_source_kinds ?? [];
    if (kinds.length > 0) {
      return kinds.join(', ');
    }
    return hit.provenance || hit.source_path || 'indexed';
  }

  matchedTerms(hit: HarborBotSearchHit): string {
    return (hit.matched_terms ?? []).join(', ');
  }

  summary(hit: HarborBotSearchHit): string {
    return hit.snippet || hit.provenance || hit.path;
  }

  emptyMessage(result: HarborBotSearchResponse): string {
    return result.empty_guidance || result.empty_reason || 'No results found.';
  }

  private localDateTimeToUnixSeconds(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const timestamp = new Date(trimmed).getTime();
    if (!Number.isFinite(timestamp)) {
      return null;
    }
    return Math.floor(timestamp / 1000).toString();
  }

  private withRefreshToken(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}ts=${this.liveSnapshotToken()}`;
  }

  private captureLiveImageSnapshot(): string | null {
    const image = this.liveImage?.nativeElement;
    if (!image?.naturalWidth || !image?.naturalHeight) {
      return null;
    }

    return this.captureImageElement(image);
  }

  private captureImageElement(image: HTMLImageElement): string | null {
    if (!image.naturalWidth || !image.naturalHeight) {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.86);
    } catch {
      return null;
    }
  }

  private selectedSnapshotPreviewUrl(): string | null {
    const cameraSnapshotUrl = this.selectedCameraSnapshotUrl();
    if (cameraSnapshotUrl) {
      return this.withRefreshToken(cameraSnapshotUrl);
    }

    const liveUrl = harborBotSameOriginAdminUrl(this.selectedDvrStatus()?.live_mjpeg_url);
    if (liveUrl && !this.liveMjpegFailed()) {
      return liveUrl;
    }

    return this.selectedSnapshotUrl();
  }

  private selectedCameraSnapshotUrl(): string | null {
    const camera = this.selectedCamera();
    const snapshotUrl = harborBotSameOriginAdminUrl(camera?.snapshot_url);
    if (!snapshotUrl) {
      return null;
    }
    if (snapshotUrl.startsWith('/ui/assets/') || camera?.capabilities?.snapshot) {
      return snapshotUrl;
    }
    return null;
  }

  private prependTimelineItem(item: HarborBotDvrTimelineSegment): void {
    const existing = this.dvrTimeline().filter((segment) => segment.file_path !== item.file_path);
    this.dvrTimeline.set([item, ...existing].sort((left, right) => this.mediaTimestamp(right) - this.mediaTimestamp(left)));
  }

  private prependOptimisticSnapshot(deviceId: string, previewUrl: string): string {
    const createdAt = Math.floor(Date.now() / 1000);
    const optimisticKey = `snapshot:${deviceId}:${createdAt}:${Math.random().toString(36).slice(2)}`;
    const item: HarborBotMediaItem = {
      device_id: deviceId,
      file_path: `ui://harborcam/${optimisticKey}`,
      media_kind: 'snapshot',
      stream_kind: 'snapshot',
      started_at: String(createdAt),
      created_at: String(createdAt),
      ended_at: String(createdAt),
      duration_seconds: 0,
      retention_expires_at: '',
      size_bytes: 0,
      replay_url: previewUrl,
      thumbnail_url: previewUrl,
      playable: true,
      indexed: false,
      local_preview_url: previewUrl,
      local_status: 'archiving',
      optimistic_key: optimisticKey,
    };
    this.optimisticMediaItems.set([item, ...this.optimisticMediaItems()]);
    return optimisticKey;
  }

  private prependOptimisticRecording(deviceId: string): string {
    const createdAt = Math.floor(Date.now() / 1000);
    const optimisticKey = `recording:${deviceId}:${createdAt}:${Math.random().toString(36).slice(2)}`;
    const item: HarborBotMediaItem = {
      device_id: deviceId,
      file_path: `ui://harborcam/${optimisticKey}`,
      media_kind: 'recording',
      stream_kind: 'recording',
      started_at: String(createdAt),
      created_at: String(createdAt),
      ended_at: String(createdAt),
      duration_seconds: 0,
      retention_expires_at: '',
      size_bytes: 0,
      replay_url: '',
      thumbnail_url: '',
      playable: false,
      indexed: false,
      local_status: 'finalizing',
      optimistic_key: optimisticKey,
    };
    this.optimisticMediaItems.set([item, ...this.optimisticMediaItems()]);
    return optimisticKey;
  }

  private replaceOptimisticMediaItem(optimisticKey: string | null, item: HarborBotDvrTimelineSegment): void {
    if (optimisticKey) {
      this.optimisticMediaItems.set(
        this.optimisticMediaItems().filter((segment) => segment.optimistic_key !== optimisticKey),
      );
    }
    this.prependTimelineItem(item);
  }

  private markOptimisticArchiveFailed(optimisticKey: string | null): void {
    if (!optimisticKey) {
      return;
    }
    this.optimisticMediaItems.set(this.optimisticMediaItems().map((segment) => {
      if (segment.optimistic_key !== optimisticKey) {
        return segment;
      }
      return {
        ...segment,
        local_status: 'archive_failed',
      };
    }));
  }

  private removeOptimisticRecordings(deviceId: string): void {
    this.optimisticMediaItems.set(this.optimisticMediaItems().filter((segment) => {
      return !(segment.device_id === deviceId && this.mediaKind(segment) === 'recording' && segment.optimistic_key);
    }));
  }

  private pruneFinalizingRecordings(deviceId: string, segments: HarborBotDvrTimelineSegment[]): void {
    const pendingRecordings = this.optimisticMediaItems().filter((segment) => {
      return segment.device_id === deviceId
        && this.mediaKind(segment) === 'recording'
        && segment.local_status === 'finalizing';
    });
    if (pendingRecordings.length === 0) {
      return;
    }
    const playableRecordingExists = segments.some((segment) => {
      const matchesPendingWindow = pendingRecordings.some((pending) => {
        return this.mediaTimestamp(segment) >= this.mediaTimestamp(pending) - 5;
      });
      return segment.device_id === deviceId
        && (segment.media_kind || 'recording') === 'recording'
        && segment.playable !== false
        && matchesPendingWindow;
    });
    if (playableRecordingExists) {
      this.removeOptimisticRecordings(deviceId);
    }
  }

  private uniqueMediaItems(segments: HarborBotMediaItem[]): HarborBotMediaItem[] {
    const seen = new Set<string>();
    return segments.filter((segment) => {
      const key = segment.optimistic_key ?? segment.file_path;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private mediaTimestamp(segment: HarborBotMediaItem): number {
    return Number(segment.created_at || segment.started_at || 0);
  }

  private shouldUseLivePreviewAsSnapshot(): boolean {
    const camera = this.selectedCamera();
    if (camera?.capabilities?.snapshot) {
      return false;
    }
    return Boolean(harborBotSameOriginAdminUrl(this.selectedDvrStatus()?.live_mjpeg_url));
  }

  private loadDvrTimeline(deviceId: string | null, refreshErrors: string[]): void {
    if (!deviceId) {
      this.dvrTimeline.set([]);
      this.cameraLoading.set(false);
      this.cameraError.set(refreshErrors.length > 0 ? refreshErrors[0] : null);
      return;
    }

    this.api.dvrTimeline(deviceId).pipe(
      finalize(() => this.cameraLoading.set(false)),
    ).subscribe({
      next: (timeline) => {
        const segments = timeline.segments ?? [];
        this.dvrTimeline.set(segments);
        this.pruneFinalizingRecordings(deviceId, segments);
        this.cameraError.set(refreshErrors.length > 0 ? refreshErrors[0] : null);
      },
      error: (error: unknown) => {
        this.cameraError.set(harborBotErrorMessage(error));
      },
    });
  }

  private searchScopeForQuery(query: string): { filter: HarborBotResultFilter; cameraId: string | null; sourceScope: HarborBotSourceScope } {
    const suggestion = this.matchPromptSuggestion(query);
    if (suggestion?.sourceScope) {
      if (this.form.controls.filter.value !== suggestion.filter) {
        this.form.controls.filter.setValue(suggestion.filter);
      }
      if (this.form.controls.sourceScope.value !== suggestion.sourceScope) {
        this.form.controls.sourceScope.setValue(suggestion.sourceScope);
      }
      return {
        filter: suggestion.filter,
        cameraId: null,
        sourceScope: suggestion.sourceScope,
      };
    }
    return {
      filter: this.form.controls.filter.value,
      cameraId: null,
      sourceScope: this.form.controls.sourceScope.value,
    };
  }

  private matchPromptSuggestion(query: string): HarborBotPromptSuggestion | undefined {
    const normalizedQuery = this.normalizePrompt(query);
    if (!normalizedQuery) {
      return undefined;
    }
    return this.promptSuggestions.find((suggestion) => {
      const candidates = [suggestion.query, suggestion.label, ...(suggestion.matchers ?? [])];
      return candidates.some((candidate) => {
        const normalizedCandidate = this.normalizePrompt(candidate);
        return normalizedCandidate
          && (normalizedQuery.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedQuery));
      });
    });
  }

  private normalizePrompt(value: string): string {
    return value
      .toLowerCase()
      .replace(/[？?。！!，,、：:；;\s]/g, '');
  }

  private cameraRefreshErrorMessage(message: string): string {
    if (this.isTransientAdminStateError(message)) {
      return 'HarborDesk 状态正在刷新，HarborBot 会自动重试；如果持续出现，请到 HarborDesk 保存一次配置。';
    }
    return message;
  }

  private isTransientAdminStateError(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('admin-console.json')
      && (normalized.includes('eof') || normalized.includes('parse'));
  }

  private scheduleCameraRefreshRetry(): void {
    if (this.cameraRefreshRetryQueued) {
      return;
    }
    this.cameraRefreshRetryQueued = true;
    timer(1500).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.cameraRefreshRetryQueued = false;
      this.refreshCameraDvr();
    });
  }

  private showActionMessage(message: string, durationMs = 3000): void {
    const token = ++this.actionMessageToken;
    this.actionMessage.set(message);
    timer(durationMs).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (this.actionMessageToken === token && this.actionMessage() === message) {
        this.actionMessage.set(null);
      }
    });
  }

  private clearActionMessage(): void {
    this.actionMessageToken += 1;
    this.actionMessage.set(null);
  }

  private showLiveFeedback(message: string, durationMs = 1100): void {
    const token = ++this.liveFeedbackToken;
    this.liveFeedback.set(message);
    timer(durationMs).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (this.liveFeedbackToken === token && this.liveFeedback() === message) {
        this.liveFeedback.set(null);
      }
    });
  }

  private scrollToSearchResults(): void {
    setTimeout(() => {
      this.searchResults?.nativeElement.scrollIntoView?.({
        block: 'start',
        behavior: 'smooth',
      });
    });
  }

  private scrollToMediaViewer(): void {
    setTimeout(() => {
      const viewer = this.mediaViewer?.nativeElement;
      if (!viewer) {
        return;
      }
      viewer.parentElement?.scrollTo?.({
        top: 0,
        behavior: 'auto',
      });
      viewer.scrollIntoView?.({
        block: 'nearest',
        behavior: 'auto',
      });
    }, 180);
  }

  private blurActiveElement(): void {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }
}
