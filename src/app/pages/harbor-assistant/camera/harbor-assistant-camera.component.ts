import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import Hls from 'hls.js';
import {
  HarborAssistantCameraLiveSessionResponse,
  HarborAssistantSearchResultFilter,
  HarborAssistantSearchCameraDevice,
  HarborAssistantSearchDvrRecordingStatus,
  HarborAssistantSearchDvrTimelineSegment,
  HarborAssistantSearchHit,
  HarborAssistantSearchResponse,
  HarborAssistantSearchSourceScope,
  HarborAssistantSearchWaterfallItem,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';
import { HarborAssistantContentApiService } from 'app/pages/harbor-assistant/shared/harbor-assistant-content-api.service';
import {
  buildHarborAssistantSearchPayload,
  buildHarborAssistantSearchWaterfallItems,
  harborAssistantSearchErrorMessage,
  harborAssistantSearchHasNoResults,
  harborAssistantSearchSameOriginAdminUrl,
} from 'app/pages/harbor-assistant/shared/harbor-assistant-results';
import { harborAssistantBeaconApiUrl } from 'app/pages/harbor-assistant/services/harbor-assistant-api-prefix';
import {
  HarborTimeRangeDialogComponent,
  HarborTimeRangeValue,
} from 'app/pages/harbor-assistant/shared/harbor-assistant-time-range-dialog.component';

interface HarborAssistantSearchPromptSuggestion {
  label: string;
  query: string;
  filter: HarborAssistantSearchResultFilter;
  sourceScope?: HarborAssistantSearchSourceScope;
  matchers?: string[];
}

type HarborAssistantSearchLocalMediaStatus = 'archiving' | 'archive_failed' | 'finalizing';
type HarborAssistantSearchRecordIntent = 'starting' | 'finalizing';

interface HarborAssistantSearchMediaItem extends HarborAssistantSearchDvrTimelineSegment {
  local_preview_url?: string;
  local_status?: HarborAssistantSearchLocalMediaStatus;
  optimistic_key?: string;
  local_display_at?: string;
}

@Component({
  selector: 'ix-harbor-assistant-camera',
  templateUrl: './harbor-assistant-camera.component.html',
  styleUrl: './harbor-assistant-camera.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    NgClass,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCard,
    MatCardContent,
    MatProgressBar,
    MatTab,
    MatTabGroup,
  ],
})
export class HarborAssistantCameraComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(HarborAssistantContentApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  @ViewChild('liveImage') private liveImage?: ElementRef<HTMLImageElement>;
  @ViewChild('liveVideo') private liveVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('mediaViewer') private mediaViewer?: ElementRef<HTMLElement>;
  @ViewChild('searchResults') private searchResults?: ElementRef<HTMLElement>;

  protected readonly form = this.formBuilder.group({
    query: ['', Validators.required],
    filter: ['all' as HarborAssistantSearchResultFilter, Validators.required],
    sourceScope: ['dvr_library' as HarborAssistantSearchSourceScope, Validators.required],
    from: [''],
    to: [''],
  });

  protected readonly fixtureCameraId = 'public-fixture-dvr';

  protected readonly promptSuggestions: HarborAssistantSearchPromptSuggestion[] = [
    {
      label: 'Who is pouring beer?',
      query: 'who is pouring beer',
      filter: 'videos',
      sourceScope: 'dvr_library',
      matchers: ['who is pouring beer', 'pouring beer', 'beer'],
    },
    {
      label: 'Who is pouring a drink?',
      query: 'who is pouring a drink',
      filter: 'videos',
      sourceScope: 'dvr_library',
      matchers: ['who is pouring a drink', 'pouring a drink', 'pouring water', 'pouring beer'],
    },
    {
      label: 'Did the cat drink water?',
      query: 'cat drinking water',
      filter: 'videos',
      sourceScope: 'dvr_library',
      matchers: ['cat drinking water', 'did the cat drink water', 'drinking water'],
    },
    {
      label: 'Where is the cat resting?',
      query: 'cat resting on the sofa',
      filter: 'videos',
      sourceScope: 'dvr_library',
      matchers: ['where is the cat resting', 'cat resting on the sofa', 'cat resting', 'sofa'],
    },
  ];

  protected readonly loading = signal(false);
  protected readonly cameraLoading = signal(false);
  protected readonly response = signal<HarborAssistantSearchResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cameraError = signal<string | null>(null);
  protected readonly cameras = signal<HarborAssistantSearchCameraDevice[]>([]);
  protected readonly selectedCameraId = signal<string | null>(null);
  protected readonly dvrStatuses = signal<HarborAssistantSearchDvrRecordingStatus[]>([]);
  protected readonly dvrTimeline = signal<HarborAssistantSearchMediaItem[]>([]);
  protected readonly optimisticMediaItems = signal<HarborAssistantSearchMediaItem[]>([]);
  protected readonly liveSnapshotToken = signal(Date.now());
  protected readonly liveSnapshotErrorToken = signal<number | null>(null);
  protected readonly lastGoodLiveFrameUrl = signal<string | null>(null);
  protected readonly liveMjpegFailed = signal(false);
  protected readonly hlsLiveUrl = signal<string | null>(null);
  protected readonly hlsLiveSession = signal<HarborAssistantCameraLiveSessionResponse | null>(null);
  protected readonly hlsLiveStatus = signal<'stopped' | 'starting' | 'live' | 'degraded'>('stopped');
  protected readonly hlsLiveError = signal<string | null>(null);
  protected readonly actionBusy = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly mediaLibraryExpanded = signal(true);
  protected readonly selectedMediaItem = signal<HarborAssistantSearchMediaItem | null>(null);
  protected readonly selectedTabIndex = signal(0);
  protected readonly liveFeedback = signal<string | null>(null);
  protected readonly recordIntent = signal<HarborAssistantSearchRecordIntent | null>(null);
  protected readonly liveCameras = computed(() => this.cameras().filter((camera) => !this.isFixtureCamera(camera)));
  private cameraRefreshRetryQueued = false;
  private actionMessageToken = 0;
  private liveFeedbackToken = 0;
  private hls: Hls | null = null;

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
    const payload = buildHarborAssistantSearchPayload(
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
        this.error.set(harborAssistantSearchErrorMessage(error));
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
          const message = harborAssistantSearchErrorMessage(error);
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
          refreshErrors.push(harborAssistantSearchErrorMessage(error));
          return of({ generated_at: '', statuses: this.dvrStatuses() });
        }),
      ),
    }).subscribe({
      next: ({ state, dvr }) => {
        const devices = state.devices ?? [];
        const liveDevices = devices.filter((device) => !this.isFixtureCamera(device));
        const currentSelection = this.selectedCameraId();
        const defaultSelection = state.defaults?.selected_camera_device_id ?? null;
        const defaultIsLive = liveDevices.some((device) => device.device_id === defaultSelection);
        const currentIsLive = liveDevices.some((device) => device.device_id === currentSelection);
        const fallbackSelection = liveDevices[0]?.device_id
          ?? devices.find((device) => device.device_id !== this.fixtureCameraId)?.device_id
          ?? null;
        const selected = currentSelection && currentIsLive
          ? currentSelection
          : defaultIsLive
            ? defaultSelection
            : fallbackSelection;
        this.cameras.set(devices);
        this.selectedCameraId.set(selected);
        this.dvrStatuses.set(dvr.statuses ?? []);
        this.loadDvrTimeline(selected, refreshErrors);
      },
      error: (error: unknown) => {
        this.cameraLoading.set(false);
        this.cameraError.set(harborAssistantSearchErrorMessage(error));
      },
    });
  }

  selectCamera(deviceId: string): void {
    if (deviceId !== this.selectedCameraId()) {
      this.stopLive(false);
    }
    this.selectedCameraId.set(deviceId);
    this.liveMjpegFailed.set(false);
    this.liveSnapshotErrorToken.set(null);
    this.lastGoodLiveFrameUrl.set(null);
    this.selectedMediaItem.set(null);
    this.refreshCameraDvr();
  }

  usePromptSuggestion(suggestion: HarborAssistantSearchPromptSuggestion): void {
    this.form.patchValue({
      query: this.translate.instant(suggestion.query),
      filter: suggestion.filter,
      sourceScope: suggestion.sourceScope ?? 'dvr_library',
      from: '',
      to: '',
    });
    this.error.set(null);
  }

  waterfallItems(): HarborAssistantSearchWaterfallItem[] {
    return buildHarborAssistantSearchWaterfallItems(this.response(), this.form.controls.filter.value);
  }

  noResults(): boolean {
    return this.waterfallItems().length === 0;
  }

  hasAnyResult(result: HarborAssistantSearchResponse | null = this.response()): boolean {
    return !harborAssistantSearchHasNoResults(result);
  }

  availableResultFilters(result: HarborAssistantSearchResponse): HarborAssistantSearchResultFilter[] {
    const filters: HarborAssistantSearchResultFilter[] = [];
    if (result.images.length > 0) {
      filters.push('images');
    }
    if (result.documents.some((hit) => hit.modality !== 'audio')) {
      filters.push('text');
    }
    if (result.documents.some((hit) => hit.modality === 'audio')) {
      filters.push('audio');
    }
    if (result.videos.length > 0) {
      filters.push('videos');
    }
    if (filters.length > 1) {
      filters.unshift('all');
    }
    return filters.filter((filter) => filter !== this.form.controls.filter.value);
  }

  switchFilter(filter: HarborAssistantSearchResultFilter): void {
    this.form.controls.filter.setValue(filter);
  }

  hasSearchResponse(): boolean {
    return this.response() !== null;
  }

  embeddingUnavailable(result: HarborAssistantSearchResponse | null = this.response()): boolean {
    const reason = result?.degraded_reason?.toLowerCase() ?? '';
    const warnings = (result?.warnings ?? []).join(' ').toLowerCase();
    const blockers = (result?.blockers ?? []).join(' ').toLowerCase();
    return reason.includes('embedding')
      || warnings.includes('embedding')
      || blockers.includes('embedding');
  }

  openHarborAssistantModels(): void {
    window.open('/ui/harbor-assistant?tab=settings&section=ai&focus=semantic-index', '_blank', 'noopener');
  }

  selectedCameraIsFixture(): boolean {
    return this.selectedCameraId() === this.fixtureCameraId;
  }

  searchScopeLabel(): string {
    switch (this.form.controls.sourceScope.value) {
      case 'dvr_library':
        return 'DVR media library';
      case 'nas_files':
        return 'NAS folders';
      case 'all':
      default:
        return 'All knowledge sources';
    }
  }

  timeRangeLabel(): string {
    const from = this.formatLocalDateTimeLabel(this.form.controls.from.value);
    const to = this.formatLocalDateTimeLabel(this.form.controls.to.value);
    if (!from && !to) {
      return this.translate.instant('All time');
    }
    return `${from || this.translate.instant('Any')} - ${to || this.translate.instant('Any')}`;
  }

  hasTimeRange(): boolean {
    return Boolean(this.form.controls.from.value || this.form.controls.to.value);
  }

  openTimeRangeDialog(): void {
    this.dialog.open<HarborTimeRangeDialogComponent, HarborTimeRangeValue, HarborTimeRangeValue | null>(
      HarborTimeRangeDialogComponent,
      {
        width: '560px',
        data: {
          from: this.form.controls.from.value,
          to: this.form.controls.to.value,
        },
      },
    ).afterClosed().subscribe((value) => {
      if (!value) {
        return;
      }
      this.form.patchValue(value);
      this.form.markAsDirty();
    });
  }

  clearTimeRange(): void {
    this.form.patchValue({ from: '', to: '' });
    this.form.markAsDirty();
  }

  openPreview(item: HarborAssistantSearchWaterfallItem): void {
    window.open(item.previewUrl, '_blank', 'noopener');
  }

  openReplay(segment: HarborAssistantSearchMediaItem): void {
    if (!this.canOpenMediaItem(segment)) {
      this.actionError.set('This media is not ready for playback yet.');
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
      this.actionError.set('No playable recordings yet.');
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
      this.showActionMessage('This camera does not expose a still snapshot endpoint, so the current live preview is shown first.');
    }

    this.actionBusy.set('snapshot');
    timer(500).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.actionBusy() === 'snapshot') {
        this.actionBusy.set(null);
      }
    });
    this.showActionMessage(localPreviewUrl ? 'Current frame is shown. Archiving snapshot...' : 'Capturing current frame...');
    this.api.createSnapshotTask(deviceId).subscribe({
      next: (response) => {
        if (response.media_item) {
          this.replaceOptimisticMediaItem(optimisticKey, response.media_item);
        }
        this.showActionMessage(response.media_item ? 'Current frame was captured and archived.' : 'Current frame is shown.');
      },
      error: (error: unknown) => {
        this.markOptimisticArchiveFailed(optimisticKey);
        this.showActionMessage(localPreviewUrl ? 'Current preview was kept, but background archiving failed.' : 'Snapshot archive failed.');
        this.actionError.set(harborAssistantSearchErrorMessage(error));
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
        this.actionError.set(harborAssistantSearchErrorMessage(error));
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
        this.showActionMessage('Recording stopped. Preparing playable clips...');
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
        this.actionError.set(harborAssistantSearchErrorMessage(error));
      },
    });
  }

  startLive(): void {
    const deviceId = this.selectedCameraId();
    if (!deviceId || this.actionBusy() === 'live' || this.hlsLiveStatus() === 'starting') {
      return;
    }
    if (this.hlsLiveSession()?.device_id && this.hlsLiveSession()?.device_id !== deviceId) {
      this.stopLive(false);
    }
    this.actionBusy.set('live');
    this.hlsLiveStatus.set('starting');
    this.hlsLiveError.set(null);
    this.hlsLiveUrl.set(null);
    this.stopHlsPlayback();
    this.api.startCameraLiveSession(deviceId).pipe(
      finalize(() => {
        if (this.actionBusy() === 'live') {
          this.actionBusy.set(null);
        }
      }),
    ).subscribe({
      next: (session) => {
        this.hlsLiveSession.set(session);
        if (session.session_id) {
          this.showLiveFeedback('Live is starting...', 1800);
          this.waitForHlsPlaylist(session);
        } else {
          this.hlsLiveStatus.set('degraded');
          this.hlsLiveError.set(session.message || 'Live view is unavailable.');
          this.showLiveFeedback('Live unavailable. Falling back to snapshots.', 2200);
        }
      },
      error: (error: unknown) => {
        this.hlsLiveStatus.set('degraded');
        this.hlsLiveError.set(harborAssistantSearchErrorMessage(error));
        this.showLiveFeedback('Live unavailable. Falling back to snapshots.', 2200);
      },
    });
  }

  private waitForHlsPlaylist(session: HarborAssistantCameraLiveSessionResponse, attempt = 0): void {
    const sessionId = session.session_id;
    const deviceId = session.device_id;
    if (!sessionId || !deviceId || this.hlsLiveSession()?.session_id !== sessionId) {
      return;
    }
    this.api.cameraLiveStatus(deviceId, sessionId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (status) => {
        if (this.hlsLiveSession()?.session_id !== sessionId) {
          return;
        }
        this.hlsLiveSession.set(status);
        if (status.playlist_ready && status.playlist_url) {
          this.hlsLiveUrl.set(harborAssistantSearchSameOriginAdminUrl(status.playlist_url));
          this.hlsLiveStatus.set('live');
          this.showLiveFeedback('Live started.', 1800);
          window.setTimeout(() => this.attachHlsPlayback(), 0);
          return;
        }
        if (status.status === 'failed' || status.status === 'degraded' || status.status === 'stopped') {
          this.hlsLiveStatus.set('degraded');
          this.hlsLiveError.set(status.message || 'Live view is unavailable.');
          this.showLiveFeedback('Live unavailable. Falling back to snapshots.', 2200);
          return;
        }
        if (attempt >= 15) {
          this.hlsLiveStatus.set('degraded');
          this.hlsLiveError.set(status.message || 'Live playlist is not ready yet.');
          this.showLiveFeedback('Live unavailable. Falling back to snapshots.', 2200);
          return;
        }
        window.setTimeout(() => this.waitForHlsPlaylist(status, attempt + 1), 1000);
      },
      error: (error: unknown) => {
        if (this.hlsLiveSession()?.session_id !== sessionId) {
          return;
        }
        if (attempt < 15) {
          window.setTimeout(() => this.waitForHlsPlaylist(session, attempt + 1), 1000);
          return;
        }
        this.hlsLiveStatus.set('degraded');
        this.hlsLiveError.set(harborAssistantSearchErrorMessage(error));
        this.showLiveFeedback('Live unavailable. Falling back to snapshots.', 2200);
      },
    });
  }

  stopLive(showMessage = true): void {
    const session = this.hlsLiveSession();
    const deviceId = session?.device_id ?? this.selectedCameraId();
    this.stopHlsPlayback();
    this.hlsLiveUrl.set(null);
    this.hlsLiveStatus.set('stopped');
    this.hlsLiveError.set(null);
    this.hlsLiveSession.set(null);
    if (!deviceId || !session?.session_id) {
      return;
    }
    this.api.stopCameraLiveSession(deviceId, session.session_id).subscribe({
      next: () => {
        if (showMessage) {
          this.showLiveFeedback('Live stopped.', 1200);
        }
      },
      error: () => {
        if (showMessage) {
          this.showLiveFeedback('Live stop was requested.', 1200);
        }
      },
    });
  }

  liveModeLabel(): string {
    if (this.hlsLiveStatus() === 'live') {
      return 'Live H.264';
    }
    if (this.hlsLiveStatus() === 'starting') {
      return 'Starting live';
    }
    if (this.hlsLiveStatus() === 'degraded') {
      return 'Snapshot fallback';
    }
    return 'Stopped';
  }

  liveCanStart(): boolean {
    return Boolean(this.selectedCameraId())
      && this.actionBusy() !== 'live'
      && this.hlsLiveStatus() !== 'starting'
      && this.hlsLiveStatus() !== 'live';
  }

  liveCanStop(): boolean {
    return this.hlsLiveStatus() === 'starting' || this.hlsLiveStatus() === 'live';
  }

  ptzAction(direction: string): void {
    if (!this.canPtz()) {
      this.showActionMessage('The current camera does not support PTZ control.');
      return;
    }
    this.showActionMessage(this.translate.instant('PTZ {direction} is unavailable.', { direction }));
  }

  selectedCamera(): HarborAssistantSearchCameraDevice | undefined {
    return this.cameras().find((camera) => camera.device_id === this.selectedCameraId());
  }

  selectedDvrStatus(): HarborAssistantSearchDvrRecordingStatus | undefined {
    return this.dvrStatuses().find((status) => status.device_id === this.selectedCameraId());
  }

  recordingStatusLabel(): string {
    const status = this.selectedDvrStatus()?.status ?? 'stopped';
    if (this.recordIntent() === 'starting' || status === 'starting') {
      return 'Starting';
    }
    if (this.recordIntent() === 'finalizing' || status === 'stopping' || status === 'finalizing') {
      return 'Finalizing';
    }
    if (status === 'recording') {
      return 'Recording';
    }
    return 'Stopped';
  }

  selectedCameraLabel(): string {
    const camera = this.selectedCamera();
    return camera?.room || camera?.name || this.selectedCameraId() || 'Camera';
  }

  cameraStatusNotice(): string {
    return 'Camera settings did not fully refresh. Click Refresh cameras again later.';
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
      return 'Starting';
    }
    if (this.recordIntent() === 'finalizing') {
      return 'Finalizing';
    }
    return 'REC';
  }

  selectedLiveUrl(): string | null {
    if (this.hlsLiveUrl() && this.hlsLiveStatus() !== 'degraded') {
      return null;
    }
    const deviceId = this.selectedCameraId();
    if (!deviceId) {
      return null;
    }
    const lastGoodFrame = this.lastGoodLiveFrameUrl();
    if (lastGoodFrame && this.liveSnapshotErrorToken() === this.liveSnapshotToken()) {
      return lastGoodFrame;
    }
    if (this.liveSnapshotErrorToken() === this.liveSnapshotToken()) {
      return null;
    }
    const cameraSnapshotUrl = this.selectedCameraSnapshotUrl();
    if (cameraSnapshotUrl?.startsWith('/ui/assets/')) {
      return this.withRefreshToken(cameraSnapshotUrl);
    }
    const snapshotUrl = this.selectedSnapshotUrl();
    if (snapshotUrl) {
      return snapshotUrl;
    }
    const liveUrl = harborAssistantSearchSameOriginAdminUrl(this.selectedDvrStatus()?.live_mjpeg_url);
    if (liveUrl && !this.liveMjpegFailed()) {
      return liveUrl;
    }
    return null;
  }

  livePreviewErrorMessage(): string | null {
    if (!this.selectedCameraId()) {
      return 'Choose a camera.';
    }
    if (this.liveSnapshotErrorToken() === this.liveSnapshotToken()) {
      return 'Live view is unavailable. Retry, or check the address and account in camera settings.';
    }
    if (!this.selectedLiveUrl()) {
      return 'The current camera has no available live preview URL.';
    }
    return null;
  }

  retryLivePreview(): void {
    this.liveMjpegFailed.set(false);
    this.liveSnapshotErrorToken.set(null);
    this.liveSnapshotToken.set(Date.now());
  }

  openCameraSettings(): void {
    window.open('/ui/harbor-assistant?tab=settings&section=camera', '_blank', 'noopener');
  }

  selectedSnapshotUrl(): string | null {
    const deviceId = this.selectedCameraId();
    if (!deviceId) {
      return null;
    }
    const cameraSnapshotUrl = this.selectedCameraSnapshotUrl();
    if (cameraSnapshotUrl?.startsWith('/ui/assets/')) {
      return this.withRefreshToken(cameraSnapshotUrl);
    }
    return this.withRefreshToken(harborAssistantBeaconApiUrl(`/cameras/${encodeURIComponent(deviceId)}/snapshot.jpg`));
  }

  ngOnDestroy(): void {
    this.stopHlsPlayback();
    this.stopLive(false);
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

  timelineItems(): HarborAssistantSearchMediaItem[] {
    const deviceId = this.selectedCameraId();
    const segments = [...this.optimisticMediaItems(), ...this.dvrTimeline()];
    return this.uniqueMediaItems(deviceId ? segments.filter((segment) => segment.device_id === deviceId) : segments)
      .sort((left, right) => this.mediaTimestamp(right) - this.mediaTimestamp(left));
  }

  recentTimelineItems(): HarborAssistantSearchMediaItem[] {
    return this.timelineItems().slice(0, 6);
  }

  latestMediaLabel(): string {
    const latest = this.timelineItems()[0];
    if (!latest) {
      return 'No media yet';
    }
    return this.displayMediaTime(latest);
  }

  toggleMediaLibrary(): void {
    this.mediaLibraryExpanded.set(!this.mediaLibraryExpanded());
  }

  expandMediaLibrary(): void {
    this.mediaLibraryExpanded.set(true);
  }

  timelineTrackKey(index: number, segment: HarborAssistantSearchMediaItem): string {
    return `${this.mediaKind(segment)}:${segment.optimistic_key ?? segment.file_path}:${index}`;
  }

  mediaKind(segment: HarborAssistantSearchMediaItem): string {
    return segment.media_kind || 'recording';
  }

  mediaKindLabel(segment: HarborAssistantSearchMediaItem): string {
    return this.mediaKind(segment) === 'snapshot' ? 'Snapshot' : 'Video';
  }

  mediaPreviewUrl(segment: HarborAssistantSearchMediaItem): string {
    return segment.local_preview_url
      ?? harborAssistantSearchSameOriginAdminUrl(segment.thumbnail_url)
      ?? harborAssistantSearchSameOriginAdminUrl(segment.replay_url)
      ?? this.api.previewUrl(segment.file_path);
  }

  canOpenMediaItem(segment: HarborAssistantSearchMediaItem): boolean {
    return Boolean(segment.local_preview_url) || segment.playable !== false;
  }

  mediaDurationLabel(segment: HarborAssistantSearchMediaItem): string {
    if (this.mediaKind(segment) === 'snapshot') {
      return 'Single frame';
    }
    const seconds = segment.duration_actual_seconds ?? segment.duration_seconds;
    return `${seconds || 0}s`;
  }

  mediaStatusLabel(segment: HarborAssistantSearchMediaItem): string {
    if (segment.local_status === 'finalizing') {
      return 'Finalizing';
    }
    if (segment.local_status === 'archiving') {
      return 'Archiving';
    }
    if (segment.local_status === 'archive_failed') {
      return 'Archive failed';
    }
    return this.canOpenMediaItem(segment) ? 'Playable' : 'Not playable';
  }

  displayMediaTime(segment: HarborAssistantSearchMediaItem): string {
    return this.formatUnix(this.mediaDisplayValue(segment));
  }

  isOptimisticMediaItem(segment: HarborAssistantSearchMediaItem): boolean {
    return Boolean(segment.optimistic_key);
  }

  isArchiveFailed(segment: HarborAssistantSearchMediaItem): boolean {
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

  resultTrackKey(index: number, item: HarborAssistantSearchWaterfallItem): string {
    return `${item.kind}:${item.hit.path}:${item.hit.chunk_id ?? index}`;
  }

  kindLabel(item: HarborAssistantSearchWaterfallItem): string {
    if (item.kind === 'audio') {
      return 'Audio';
    }
    if (item.kind === 'image') {
      return 'Image';
    }
    if (item.kind === 'video') {
      return 'Video';
    }
    return 'Text';
  }

  scoreLabel(hit: HarborAssistantSearchHit): string {
    return `${hit.score}`;
  }

  videoPreviewUrl(item: HarborAssistantSearchWaterfallItem): string {
    return `${item.previewUrl}#t=0.1`;
  }

  mediaVideoPreviewUrl(segment: HarborAssistantSearchMediaItem): string {
    return `${this.mediaPreviewUrl(segment)}#t=0.1`;
  }

  mediaPlaybackUrl(segment: HarborAssistantSearchMediaItem): string {
    return segment.local_preview_url
      ?? harborAssistantSearchSameOriginAdminUrl(segment.replay_url)
      ?? this.api.previewUrl(segment.file_path);
  }

  sourceKinds(hit: HarborAssistantSearchHit): string {
    const kinds = hit.content_source_kinds ?? [];
    if (kinds.length > 0) {
      return kinds.join(', ');
    }
    return hit.provenance || hit.source_path || 'indexed';
  }

  matchedTerms(hit: HarborAssistantSearchHit): string {
    return (hit.matched_terms ?? []).join(', ');
  }

  summary(hit: HarborAssistantSearchHit): string {
    return hit.snippet || hit.provenance || hit.path;
  }

  emptyMessage(result: HarborAssistantSearchResponse): string {
    const query = this.form.controls.query.value.trim();
    const localizedSpring = this.translate.instant('spring');
    if (
      this.form.controls.filter.value === 'images'
      && (query.toLowerCase().includes('spring') || query.includes(localizedSpring))
    ) {
      return 'The current image filter has no related results. Switch to All to inspect other clues, or add and index a folder with spring photos.';
    }
    if (this.hasAnyResult(result)) {
      return 'No results for the current filter. Switch to a result type that has matches.';
    }
    return result.empty_guidance || result.empty_reason || 'No results found. Try another phrasing, or confirm the DVR media library is indexed in settings.';
  }

  filterLabel(filter: HarborAssistantSearchResultFilter): string {
    switch (filter) {
      case 'audio':
        return 'Audio';
      case 'images':
        return 'Image';
      case 'text':
        return 'Text';
      case 'videos':
        return 'Video';
      case 'all':
      default:
        return 'All';
    }
  }

  searchStatusLabel(result: HarborAssistantSearchResponse): string {
    if (result.degraded) {
      return 'Degraded';
    }
    return result.status === 'ok' ? 'Complete' : result.status;
  }

  userFacingSearchNotice(message: string): string {
    const normalized = message.toLowerCase();
    if (normalized.includes('embedding') || normalized.includes('/v1/embeddings')) {
      return 'Vector search model is unavailable, so local lexical search was used temporarily.';
    }
    return message;
  }

  fullscreenMediaViewer(): void {
    const media = this.mediaViewer?.nativeElement.querySelector('video, img') as HTMLElement | null;
    const target = media ?? this.mediaViewer?.nativeElement;
    void target?.requestFullscreen?.();
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

  private formatLocalDateTimeLabel(value: string): string {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) {
      return '';
    }
    return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
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

    const liveUrl = harborAssistantSearchSameOriginAdminUrl(this.selectedDvrStatus()?.live_mjpeg_url);
    if (liveUrl && !this.liveMjpegFailed()) {
      return liveUrl;
    }

    return this.selectedSnapshotUrl();
  }

  private selectedCameraSnapshotUrl(): string | null {
    const camera = this.selectedCamera();
    const snapshotUrl = harborAssistantSearchSameOriginAdminUrl(camera?.snapshot_url);
    if (!snapshotUrl) {
      return null;
    }
    if (snapshotUrl.startsWith('/ui/assets/') || camera?.capabilities?.snapshot) {
      return snapshotUrl;
    }
    return null;
  }

  private prependTimelineItem(item: HarborAssistantSearchDvrTimelineSegment): void {
    const normalized = this.normalizeTimelineItem(item);
    const existing = this.dvrTimeline().filter((segment) => segment.file_path !== item.file_path);
    this.dvrTimeline.set([normalized, ...existing].sort((left, right) => this.mediaTimestamp(right) - this.mediaTimestamp(left)));
  }

  private prependOptimisticSnapshot(deviceId: string, previewUrl: string): string {
    const createdAt = Math.floor(Date.now() / 1000);
    const optimisticKey = `snapshot:${deviceId}:${createdAt}:${Math.random().toString(36).slice(2)}`;
    const item: HarborAssistantSearchMediaItem = {
      device_id: deviceId,
      file_path: `ui://harbor-assistant-camera/${optimisticKey}`,
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
      local_display_at: String(createdAt),
    };
    this.optimisticMediaItems.set([item, ...this.optimisticMediaItems()]);
    return optimisticKey;
  }

  private prependOptimisticRecording(deviceId: string): string {
    const createdAt = Math.floor(Date.now() / 1000);
    const optimisticKey = `recording:${deviceId}:${createdAt}:${Math.random().toString(36).slice(2)}`;
    const item: HarborAssistantSearchMediaItem = {
      device_id: deviceId,
      file_path: `ui://harbor-assistant-camera/${optimisticKey}`,
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
      local_display_at: String(createdAt),
    };
    this.optimisticMediaItems.set([item, ...this.optimisticMediaItems()]);
    return optimisticKey;
  }

  private replaceOptimisticMediaItem(optimisticKey: string | null, item: HarborAssistantSearchDvrTimelineSegment): void {
    const optimisticItem = optimisticKey
      ? this.optimisticMediaItems().find((segment) => segment.optimistic_key === optimisticKey)
      : null;
    const normalizedItem = this.normalizeTimelineItem(item, optimisticItem?.local_display_at);
    if (optimisticKey) {
      this.optimisticMediaItems.set(
        this.optimisticMediaItems().filter((segment) => segment.optimistic_key !== optimisticKey),
      );
    }
    this.prependTimelineItem(normalizedItem);
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

  private pruneFinalizingRecordings(deviceId: string, segments: HarborAssistantSearchDvrTimelineSegment[]): void {
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

  private uniqueMediaItems(segments: HarborAssistantSearchMediaItem[]): HarborAssistantSearchMediaItem[] {
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

  private mediaTimestamp(segment: HarborAssistantSearchMediaItem): number {
    return Number(this.mediaDisplayValue(segment) || 0);
  }

  private mediaDisplayValue(segment: HarborAssistantSearchMediaItem): string | number | undefined | null {
    if (segment.local_display_at) {
      return segment.local_display_at;
    }
    if (this.mediaKind(segment) === 'recording') {
      return segment.ended_at || segment.created_at || segment.started_at;
    }
    return segment.created_at || segment.started_at || segment.ended_at;
  }

  private normalizeTimelineItem(item: HarborAssistantSearchDvrTimelineSegment, displayAt?: string | null): HarborAssistantSearchMediaItem {
    const mediaKind = item.media_kind || 'recording';
    if (displayAt && mediaKind === 'recording') {
      return { ...item, local_display_at: displayAt };
    }
    return { ...item };
  }

  private isFixtureCamera(camera: HarborAssistantSearchCameraDevice | null | undefined): boolean {
    const id = (camera?.device_id ?? '').toLowerCase();
    const name = (camera?.name ?? '').toLowerCase();
    return id === this.fixtureCameraId || name.includes('fixture') || name.includes('not live camera');
  }

  private shouldUseLivePreviewAsSnapshot(): boolean {
    const camera = this.selectedCamera();
    if (camera?.capabilities?.snapshot) {
      return false;
    }
    return Boolean(harborAssistantSearchSameOriginAdminUrl(this.selectedDvrStatus()?.live_mjpeg_url));
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
        const segments = this.normalizeTimelineSegmentsForDisplay(deviceId, timeline.segments ?? []);
        this.dvrTimeline.set(segments);
        this.pruneFinalizingRecordings(deviceId, segments);
        this.cameraError.set(refreshErrors.length > 0 ? refreshErrors[0] : null);
      },
      error: (error: unknown) => {
        this.cameraError.set(harborAssistantSearchErrorMessage(error));
      },
    });
  }

  private searchScopeForQuery(query: string): { filter: HarborAssistantSearchResultFilter; cameraId: string | null; sourceScope: HarborAssistantSearchSourceScope } {
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

  private normalizeTimelineSegmentsForDisplay(deviceId: string, segments: HarborAssistantSearchDvrTimelineSegment[]): HarborAssistantSearchMediaItem[] {
    const pendingRecordings = this.optimisticMediaItems().filter((segment) => {
      return segment.device_id === deviceId
        && this.mediaKind(segment) === 'recording'
        && segment.local_status === 'finalizing';
    });

    return segments.map((segment) => {
      if ((segment.media_kind || 'recording') !== 'recording') {
        return this.normalizeTimelineItem(segment);
      }
      const pending = pendingRecordings.find((item) => {
        return Math.abs(Number(segment.ended_at || segment.created_at || segment.started_at || 0) - this.mediaTimestamp(item)) <= 30;
      });
      return this.normalizeTimelineItem(segment, pending?.local_display_at);
    });
  }

  private matchPromptSuggestion(query: string): HarborAssistantSearchPromptSuggestion | undefined {
    const normalizedQuery = this.normalizePrompt(query);
    if (!normalizedQuery) {
      return undefined;
    }
    return this.promptSuggestions.find((suggestion) => {
      const candidates = [suggestion.query, suggestion.label, ...(suggestion.matchers ?? [])]
        .flatMap((candidate) => [candidate, this.translate.instant(candidate)]);
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
      return 'Harbor Assistant status is refreshing and the system will retry automatically. If this persists, save the configuration once in Settings.';
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

  private attachHlsPlayback(): void {
    const url = this.hlsLiveUrl();
    const video = this.liveVideo?.nativeElement;
    if (!url || !video) {
      return;
    }
    this.stopHlsPlayback();
    video.muted = true;
    video.playsInline = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      void video.play().catch(() => {
        this.hlsLiveStatus.set('degraded');
        this.hlsLiveError.set('Browser blocked live autoplay. Press Play again.');
      });
      return;
    }
    if (!Hls.isSupported()) {
      this.hlsLiveStatus.set('degraded');
      this.hlsLiveError.set('This browser cannot play local HLS live video.');
      return;
    }
    const hls = new Hls({
      backBufferLength: 30,
      lowLatencyMode: true,
    });
    this.hls = hls;
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) {
        return;
      }
      this.hlsLiveStatus.set('degraded');
      this.hlsLiveError.set('Live HLS playback failed. Snapshot fallback is still available.');
      this.stopHlsPlayback();
    });
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      this.hlsLiveStatus.set('live');
      void video.play().catch(() => {
        this.hlsLiveStatus.set('degraded');
        this.hlsLiveError.set('Browser blocked live autoplay. Press Play again.');
      });
    });
    hls.loadSource(url);
    hls.attachMedia(video);
  }

  private stopHlsPlayback(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    const video = this.liveVideo?.nativeElement;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
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
