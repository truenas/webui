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
import Hls from 'hls.js';
import { forkJoin, fromEvent, Observable, of, timer } from 'rxjs';
import { catchError, finalize, retry, shareReplay, switchMap, tap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { harborAssistantBeaconApiUrl } from 'app/pages/harbor-assistant/services/harbor-assistant-api-prefix';
import { HarborAssistantContentApiService } from 'app/pages/harbor-assistant/shared/harbor-assistant-content-api.service';
import {
  buildHarborAssistantSearchPayload,
  buildHarborAssistantSearchWaterfallItems,
  harborAssistantHlsLiveUrl,
  harborAssistantSearchErrorMessage,
  harborAssistantSearchHasNoResults,
  harborAssistantSearchSameOriginAdminUrl,
  harborAssistantWhepUrl,
} from 'app/pages/harbor-assistant/shared/harbor-assistant-results';
import {
  HarborTimeRangeDialogComponent,
  HarborTimeRangeValue,
} from 'app/pages/harbor-assistant/shared/harbor-assistant-time-range-dialog.component';
import {
  HarborAssistantCameraLiveSessionResponse,
  HarborAssistantHarborLinkCapabilitiesResponse,
  HarborAssistantSearchCameraStateResponse,
  HarborAssistantSearchResultFilter,
  HarborAssistantSearchCameraDevice,
  HarborAssistantSearchDvrRecordingStatus,
  HarborAssistantSearchDvrTimelineSegment,
  HarborAssistantSearchHit,
  HarborAssistantSearchResponse,
  HarborAssistantSearchSourceScope,
  HarborAssistantSearchWaterfallItem,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';
import {
  HarborAssistantLiveControlsComponent,
  HarborAssistantLivePlaybackMode,
} from './live-controls/harbor-assistant-live-controls.component';

interface HarborAssistantSearchPromptSuggestion {
  label: string;
  query: string;
  filter: HarborAssistantSearchResultFilter;
  sourceScope?: HarborAssistantSearchSourceScope;
  matchers?: string[];
}

type HarborAssistantSearchLocalMediaStatus = 'archiving' | 'archive_failed' | 'finalizing' | 'finalize_failed';
type HarborAssistantSearchRecordIntent = 'starting' | 'finalizing';
type HarborAssistantLiveStreamProfile = 'sub' | 'main';
type HarborAssistantLiveTransport = 'hls' | 'webrtc';

interface HarborAssistantVideoFrameCallbacks {
  cancelVideoFrameCallback?: (callbackId: number) => void;
  requestVideoFrameCallback?: (callback: () => void) => number;
}

interface HarborAssistantHlsWarmStartRequest {
  deviceId: string;
  streamProfile: HarborAssistantLiveStreamProfile;
  token: number;
  request$: Observable<HarborAssistantCameraLiveSessionResponse>;
}

interface HarborAssistantLivePlaybackRequest {
  allowDelayedPlayback: boolean;
  attempt: number;
  token: number;
  url: string;
}

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
    HarborAssistantLiveControlsComponent,
  ],
})
export class HarborAssistantCameraComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(HarborAssistantContentApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly window = inject<Window>(WINDOW);
  @ViewChild('liveImage') private liveImage?: ElementRef<HTMLImageElement>;
  @ViewChild('liveTransitionFrame') private liveTransitionFrame?: ElementRef<HTMLCanvasElement>;
  @ViewChild('liveVideo') private liveVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('playbackVideo') private playbackVideo?: ElementRef<HTMLVideoElement>;
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
  protected readonly webrtcLiveUrl = signal<string | null>(null);
  protected readonly hlsLiveSession = signal<HarborAssistantCameraLiveSessionResponse | null>(null);
  protected readonly harborLinkCapabilities = signal<HarborAssistantHarborLinkCapabilitiesResponse | null>(null);
  protected readonly hlsLiveStatus = signal<'stopped' | 'starting' | 'live' | 'degraded'>('stopped');
  protected readonly hlsLiveError = signal<string | null>(null);
  protected readonly liveControlCurrentTime = signal(0);
  protected readonly liveControlEndTime = signal(0);
  protected readonly liveControlMuted = signal(true);
  protected readonly liveControlPaused = signal(true);
  protected readonly liveControlPlaybackMode = signal<HarborAssistantLivePlaybackMode>('hls-fallback');
  protected readonly liveControlPlaybackRate = signal(1);
  protected readonly liveControlStartTime = signal(0);
  protected readonly liveControlVolume = signal(1);
  protected readonly liveTransitionFrameVisible = signal(false);
  protected readonly selectedStreamProfile = signal<HarborAssistantLiveStreamProfile>('sub');
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
  private recordingFinalizationAttempts = 0;
  private recordingFinalizationTimer: number | null = null;
  private hlsAttachToken = 0;
  private hlsPlaybackToken = 0;
  private hlsWarmToken = 0;
  private hlsWarmTimer: number | null = null;
  private liveSessionRenewTimer: number | null = null;
  private hlsWarmSession: HarborAssistantCameraLiveSessionResponse | null = null;
  private hlsWarmStartRequest: HarborAssistantHlsWarmStartRequest | null = null;
  private hlsRecoveryAttempts = 0;
  private hlsStartingAssetRetryCount = 0;
  private hlsStartingAssetRetryTimer: number | null = null;
  private webrtcAttachToken = 0;
  private webrtcFirstFrameCallbackId: number | null = null;
  private webrtcFirstFrameCallbackVideo: (HTMLVideoElement & HarborAssistantVideoFrameCallbacks) | null = null;
  private webrtcFirstFrameDeadlineTimer: number | null = null;
  private webrtcMediaStream: MediaStream | null = null;
  private webrtcNegotiationAbortController: AbortController | null = null;
  private webrtcPlayRequestPending = false;
  private webrtcPlayRetryTimer: number | null = null;
  private webrtcPlaybackPending = false;
  private webrtcPeerConnection: RTCPeerConnection | null = null;
  private webrtcPostDispatched = false;
  private webrtcResourceUrl: string | null = null;
  private webrtcDegradedSessionId: string | null = null;
  private webrtcPauseTimelineSeconds: number | null = null;
  private liveTimelineStartedAtEpochSeconds: number | null = null;
  private pendingHlsBehindLiveSeconds: number | null = null;
  private hlsControlTimelineOffsetSeconds: number | null = null;
  private hlsFirstFrameSeen = false;
  private livePlaybackHasPlayed = false;
  private livePlaybackBackgroundPaused = false;
  private livePlaybackUserPaused = false;
  private livePlaybackUserDelayed = false;
  private userLivePlaybackAnchorSeconds: number | null = null;
  private userLivePlaybackRate = 1;
  private pendingProgrammaticLivePlayToken: number | null = null;
  private suppressLivePauseEvent = false;
  private programmaticLiveSeekTargetSeconds: number | null = null;
  private programmaticLivePlaybackRateTarget: number | null = null;
  private playbackSeekAnchorSeconds: number | null = null;
  private playbackSeekMediaKey: string | null = null;
  private programmaticPlaybackSeekTargetSeconds: number | null = null;
  private liveEdgeMonitor: number | null = null;
  private liveTransitionFrameCallbackId: number | null = null;
  private liveTransitionFrameCallbackVideo: (HTMLVideoElement & HarborAssistantVideoFrameCallbacks) | null = null;
  private liveTransitionRevealTimer: number | null = null;
  private liveTransitionTarget: HarborAssistantLiveTransport | null = null;
  private liveTransitionToken = 0;
  private hls: Hls | null = null;
  private readonly defaultLivePlaybackRate = 1;
  private readonly maxUserLivePlaybackRate = 4;
  private readonly liveEdgeFallbackBackoffSeconds = 1;
  private readonly liveEdgeMaxDriftSeconds = 18;
  private readonly liveEdgeReturnToleranceSeconds = 1;
  private readonly webRtcHandoffGapSeconds = 1;
  private readonly liveEdgeMonitorIntervalMs = 1_000;
  private readonly livePausedTimeDriftToleranceSeconds = 0.2;
  private readonly playbackSeekDriftToleranceSeconds = 0.2;
  private readonly livePlaybackRateChangeTolerance = 0.01;
  private readonly hlsPrewarmDelayMs = 300;
  private readonly hlsPrewarmPollIntervalMs = 1_000;
  private readonly hlsPrewarmMaxWaitMs = 60_000;
  private readonly hlsPlaylistPollIntervalMs = 500;
  private readonly hlsPlaylistMaxWaitMs = 90_000;
  private readonly hlsStartingAssetRetryDelayMs = 1_000;
  private readonly hlsStartingAssetRetryLimit = 5;
  private readonly liveSessionRenewIntervalMs = 120_000;
  private readonly liveSessionTtlSeconds = 300;
  private readonly webRtcFirstFrameDeadlineMs = 10_000;
  private readonly webRtcNegotiationDeadlineMs = 12_000;
  private readonly webRtcPlayAbortRetryLimit = 2;
  private readonly webRtcPlayRetryDelayMs = 100;
  private readonly liveTransitionFallbackRevealDelayMs = 250;
  private readonly liveTransitionPaintDelayMs = 32;
  private readonly recordingFinalizationPollDelayMs = 1_000;
  private readonly recordingFinalizationPollLimit = 8;

  ngOnInit(): void {
    this.refreshCameraDvr();
    fromEvent(document, 'visibilitychange').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.handleLiveDocumentVisibilityChange());
    timer(0, 3000).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (
        this.hlsLiveStatus() !== 'stopped'
        && !this.isRecording()
        && this.recordIntent() === null
        && this.actionBusy() !== 'snapshot'
      ) {
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
        tap((state) => this.applyCameraState(state)),
      ),
      dvr: this.api.dvrStatus().pipe(
        catchError((error: unknown) => {
          refreshErrors.push(harborAssistantSearchErrorMessage(error));
          return of({ generated_at: '', statuses: this.dvrStatuses() });
        }),
      ),
    }).subscribe({
      next: ({ dvr }) => {
        this.dvrStatuses.set(dvr.statuses ?? []);
        this.loadDvrTimeline(this.selectedCameraId(), refreshErrors);
      },
      error: (error: unknown) => {
        this.cameraLoading.set(false);
        this.cameraError.set(harborAssistantSearchErrorMessage(error));
      },
    });
  }

  private applyCameraState(state: HarborAssistantSearchCameraStateResponse): void {
    const devices = state.devices ?? [];
    const liveDevices = devices.filter((device) => !this.isFixtureCamera(device));
    const currentSelection = this.selectedCameraId();
    const defaultSelection = state.defaults?.selected_camera_device_id ?? null;
    const defaultIsLive = liveDevices.some((device) => device.device_id === defaultSelection);
    const currentIsLive = liveDevices.some((device) => device.device_id === currentSelection);
    const fallbackSelection = liveDevices[0]?.device_id
      ?? devices.find((device) => device.device_id !== this.fixtureCameraId)?.device_id
      ?? null;
    let selected = fallbackSelection;
    if (defaultIsLive) {
      selected = defaultSelection;
    }
    if (currentSelection && currentIsLive) {
      selected = currentSelection;
    }
    this.cameras.set(devices);
    if (selected !== currentSelection) {
      this.selectedStreamProfile.set(this.defaultStreamProfileForCamera(selected));
    }
    this.selectedCameraId.set(selected);
    this.scheduleHlsLivePrewarm();
  }

  selectCamera(deviceId: string): void {
    if (deviceId !== this.selectedCameraId()) {
      this.stopLive(false);
      this.stopHlsWarmSession();
      this.selectedStreamProfile.set(this.defaultStreamProfileForCamera(deviceId));
    }
    this.selectedCameraId.set(deviceId);
    this.liveMjpegFailed.set(false);
    this.liveSnapshotErrorToken.set(null);
    this.lastGoodLiveFrameUrl.set(null);
    this.selectedMediaItem.set(null);
    this.refreshCameraDvr();
  }

  selectStreamProfile(profile: HarborAssistantLiveStreamProfile): void {
    if (profile !== 'sub' && profile !== 'main') {
      return;
    }
    if (profile === this.selectedStreamProfile()) {
      return;
    }
    if (this.hlsLiveStatus() === 'live' || this.hlsLiveStatus() === 'starting') {
      this.stopLive(false);
      this.showLiveFeedback('Stream changed. Press Play live to start it.', 1800);
    }
    this.stopHlsWarmSession();
    this.selectedStreamProfile.set(profile);
    this.scheduleHlsLivePrewarm();
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
    if (result.documents.length > 0) {
      filters.push('text');
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
    this.window.open('/ui/harbor-assistant?tab=settings&section=ai&focus=semantic-index', '_blank', 'noopener');
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
    this.window.open(item.previewUrl, '_blank', 'noopener');
  }

  openReplay(segment: HarborAssistantSearchMediaItem): void {
    if (!this.canOpenMediaItem(segment)) {
      this.actionError.set('This media is not ready for playback yet.');
      return;
    }
    this.blurActiveElement();
    this.actionError.set(null);
    this.resetPlaybackSeekAnchor();
    this.selectedMediaItem.set(segment);
    this.onCameraTabChange(1);
    this.scrollToMediaViewer();
  }

  closeMediaPreview(): void {
    this.resetPlaybackSeekAnchor();
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
    this.api.startDvrRecording(deviceId, this.selectedStreamProfile()).pipe(
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
    this.clearRecordingFinalizationTimer();
    this.recordingFinalizationAttempts = 0;
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
      },
      error: (error: unknown) => {
        this.clearRecordingFinalizationTimer();
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
    this.cancelLiveTransportTransition();
    this.hlsLiveStatus.set('starting');
    this.hlsLiveError.set(null);
    this.hlsLiveUrl.set(null);
    this.clearLiveSessionRenewTimer();
    this.stopWebRtcPlayback();
    this.webrtcDegradedSessionId = null;
    const streamProfile = this.selectedStreamProfile();
    const warmSession = this.hlsWarmSession
      && this.hlsWarmSessionMatches(this.hlsWarmSession, deviceId, streamProfile)
      ? this.hlsWarmSession
      : null;
    const warmStartRequest$ = this.hlsWarmStartRequest
      && this.hlsWarmStartRequestMatches(this.hlsWarmStartRequest, deviceId, streamProfile)
      ? this.hlsWarmStartRequest.request$
      : null;
    this.cancelHlsLivePrewarmForPlayback();
    this.hlsAttachToken += 1;
    this.hlsPlaybackToken += 1;
    this.hlsRecoveryAttempts = 0;
    this.hlsFirstFrameSeen = false;
    this.resetLivePlaybackUserPause();
    this.stopHlsPlayback();
    this.resetLiveControlTimeline();
    const startRequest$ = warmSession?.session_id
      ? this.api.renewCameraLiveSession(
          warmSession.device_id,
          warmSession.session_id,
          this.liveSessionTtlSeconds,
        ).pipe(catchError(() => this.api.startCameraLiveSession(deviceId, streamProfile)))
      : warmStartRequest$ ?? this.api.startCameraLiveSession(deviceId, streamProfile);
    this.refreshHarborLinkCapabilitiesForLive().pipe(
      switchMap(() => startRequest$),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (this.actionBusy() === 'live') {
          this.actionBusy.set(null);
        }
      }),
    ).subscribe({
      next: (session) => {
        this.applySessionStreamProfile(session);
        this.hlsLiveSession.set(session);
        if (session.session_id) {
          this.scheduleLiveSessionRenewal(session);
          this.rememberLivePlaybackUrls(session);
          const usingWebRtc = this.startWebRtcPlaybackFromSession(session);
          const attached = !usingWebRtc
            && this.shouldAttachHlsPlayback(session)
            && this.startHlsPlaybackFromSession(session, { pending: !session.playlist_ready });
          if (usingWebRtc) {
            this.showLiveFeedback('Connecting low-latency live...', 1800);
            if (!session.playlist_ready) {
              this.waitForHlsPlaylist(session);
            }
            return;
          }
          if (session.playlist_ready && attached) {
            this.showLiveFeedback('Live buffer is ready...', 1800);
            return;
          }
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
        this.applySessionStreamProfile(status);
        this.hlsLiveSession.set(status);
        this.rememberLivePlaybackUrls(status);
        const usingWebRtc = this.isWebRtcPlaybackActive()
          || this.startWebRtcPlaybackFromSession(status);
        const attached = !usingWebRtc
          && this.shouldAttachHlsPlayback(status)
          && this.startHlsPlaybackFromSession(status, { pending: !status.playlist_ready });
        if (status.playlist_ready && usingWebRtc) {
          return;
        }
        if (status.playlist_ready && attached) {
          this.showLiveFeedback('Live buffer is ready...', 1800);
          return;
        }
        if (status.status === 'failed' || status.status === 'degraded' || status.status === 'stopped') {
          this.hlsLiveStatus.set('degraded');
          this.hlsLiveError.set(status.message || 'Live view is unavailable.');
          this.showLiveFeedback('Live unavailable. Falling back to snapshots.', 2200);
          return;
        }
        if (attempt * this.hlsPlaylistPollIntervalMs >= this.hlsPlaylistMaxWaitMs) {
          this.hlsLiveStatus.set('degraded');
          this.hlsLiveError.set(status.message || 'Live playlist is not ready yet.');
          this.showLiveFeedback('Live unavailable. Falling back to snapshots.', 2200);
          return;
        }
        this.window.setTimeout(
          () => this.waitForHlsPlaylist(status, attempt + 1),
          this.hlsPlaylistPollIntervalMs,
        );
      },
      error: (error: unknown) => {
        if (this.hlsLiveSession()?.session_id !== sessionId) {
          return;
        }
        if (attempt * this.hlsPlaylistPollIntervalMs < this.hlsPlaylistMaxWaitMs) {
          this.window.setTimeout(
            () => this.waitForHlsPlaylist(session, attempt + 1),
            this.hlsPlaylistPollIntervalMs,
          );
          return;
        }
        this.hlsLiveStatus.set('degraded');
        this.hlsLiveError.set(harborAssistantSearchErrorMessage(error));
        this.showLiveFeedback('Live unavailable. Falling back to snapshots.', 2200);
      },
    });
  }

  private scheduleHlsLivePrewarm(): void {
    this.clearHlsWarmTimer();
    this.hlsWarmTimer = this.window.setTimeout(() => {
      this.hlsWarmTimer = null;
      this.ensureHlsLivePrewarm();
    }, this.hlsPrewarmDelayMs);
  }

  private ensureHlsLivePrewarm(): void {
    const deviceId = this.selectedCameraId();
    const streamProfile = this.selectedStreamProfile();
    if (!deviceId || this.selectedCamera()?.device_id !== deviceId || this.hlsLiveStatus() !== 'stopped') {
      return;
    }
    const warmSession = this.hlsWarmSession;
    if (warmSession && this.hlsWarmSessionMatches(warmSession, deviceId, streamProfile)) {
      if (!warmSession.playlist_ready) {
        this.pollHlsLivePrewarm(warmSession, this.hlsWarmToken);
      }
      return;
    }
    if (warmSession) {
      this.stopHlsWarmSession();
    }
    const warmStartRequest = this.hlsWarmStartRequest;
    if (warmStartRequest && this.hlsWarmStartRequestMatches(warmStartRequest, deviceId, streamProfile)) {
      return;
    }
    this.hlsWarmToken += 1;
    const token = this.hlsWarmToken;
    const request$ = this.api.startCameraLiveSession(deviceId, streamProfile).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (this.hlsWarmStartRequest?.token === token) {
          this.hlsWarmStartRequest = null;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.hlsWarmStartRequest = {
      deviceId, streamProfile, token, request$,
    };
    request$.subscribe({
      next: (session) => {
        if (!this.hlsWarmPrewarmCanContinue(session, token)) {
          this.releaseStaleHlsWarmSession(session);
          return;
        }
        this.hlsWarmSession = session;
        if (!session.playlist_ready) {
          this.pollHlsLivePrewarm(session, token);
        }
      },
      error: () => {
        if (this.hlsWarmToken === token) {
          this.hlsWarmSession = null;
        }
      },
    });
  }

  private pollHlsLivePrewarm(
    session: HarborAssistantCameraLiveSessionResponse,
    token: number,
    attempt = 0,
  ): void {
    const sessionId = session.session_id;
    const deviceId = session.device_id;
    if (!sessionId || !deviceId || !this.hlsWarmPrewarmCanContinue(session, token)) {
      return;
    }
    if (attempt * this.hlsPrewarmPollIntervalMs >= this.hlsPrewarmMaxWaitMs) {
      return;
    }
    this.clearHlsWarmTimer();
    this.hlsWarmTimer = this.window.setTimeout(() => {
      this.hlsWarmTimer = null;
      if (!this.hlsWarmPrewarmCanContinue(session, token)) {
        return;
      }
      this.api.cameraLiveStatus(deviceId, sessionId).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: (status) => {
          if (!this.hlsWarmPrewarmCanContinue(status, token)) {
            this.releaseStaleHlsWarmSession(status);
            return;
          }
          this.hlsWarmSession = status;
          if (!status.playlist_ready && status.status !== 'failed' && status.status !== 'degraded') {
            this.pollHlsLivePrewarm(status, token, attempt + 1);
          }
        },
        error: () => {
          if (this.hlsWarmToken === token) {
            this.pollHlsLivePrewarm(session, token, attempt + 1);
          }
        },
      });
    }, this.hlsPrewarmPollIntervalMs);
  }

  private hlsWarmPrewarmCanContinue(session: HarborAssistantCameraLiveSessionResponse, token: number): boolean {
    const profile = this.normalizeLiveStreamProfile(session.stream_profile);
    return this.hlsWarmToken === token
      && this.hlsLiveStatus() === 'stopped'
      && Boolean(session.session_id)
      && session.device_id === this.selectedCameraId()
      && profile === this.selectedStreamProfile();
  }

  private hlsWarmSessionMatches(
    session: HarborAssistantCameraLiveSessionResponse,
    deviceId: string,
    streamProfile: HarborAssistantLiveStreamProfile,
  ): boolean {
    return Boolean(session.session_id)
      && session.device_id === deviceId
      && this.normalizeLiveStreamProfile(session.stream_profile) === streamProfile;
  }

  private hlsWarmStartRequestMatches(
    request: HarborAssistantHlsWarmStartRequest,
    deviceId: string,
    streamProfile: HarborAssistantLiveStreamProfile,
  ): boolean {
    return request.deviceId === deviceId && request.streamProfile === streamProfile;
  }

  private cancelHlsLivePrewarmForPlayback(): void {
    this.clearHlsWarmTimer();
    this.hlsWarmToken += 1;
    this.hlsWarmSession = null;
  }

  private stopHlsWarmSession(): void {
    this.clearHlsWarmTimer();
    this.hlsWarmToken += 1;
    const session = this.hlsWarmSession;
    this.hlsWarmSession = null;
    if (session) {
      this.releaseHlsWarmSession(session);
    }
  }

  private releaseStaleHlsWarmSession(session: HarborAssistantCameraLiveSessionResponse): void {
    if (this.hlsLiveSession()?.session_id === session.session_id) {
      return;
    }
    if (
      this.hlsLiveStatus() !== 'stopped'
      && session.device_id === this.selectedCameraId()
      && this.normalizeLiveStreamProfile(session.stream_profile) === this.selectedStreamProfile()
    ) {
      return;
    }
    this.releaseHlsWarmSession(session);
  }

  private releaseHlsWarmSession(session: HarborAssistantCameraLiveSessionResponse): void {
    if (!session.device_id || !session.session_id) {
      return;
    }
    this.api.stopCameraLiveSession(session.device_id, session.session_id).subscribe({
      error: () => undefined,
    });
  }

  private clearHlsWarmTimer(): void {
    if (this.hlsWarmTimer === null) {
      return;
    }
    this.window.clearTimeout(this.hlsWarmTimer);
    this.hlsWarmTimer = null;
  }

  private scheduleLiveSessionRenewal(session: HarborAssistantCameraLiveSessionResponse): void {
    this.clearLiveSessionRenewTimer();
    if (!session.device_id || !session.session_id) {
      return;
    }
    const deviceId = session.device_id;
    const sessionId = session.session_id;
    this.liveSessionRenewTimer = this.window.setTimeout(() => {
      this.liveSessionRenewTimer = null;
      if (
        this.hlsLiveStatus() === 'stopped'
        || this.hlsLiveSession()?.session_id !== sessionId
      ) {
        return;
      }
      this.api.renewCameraLiveSession(deviceId, sessionId, this.liveSessionTtlSeconds).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: (renewed) => {
          if (this.hlsLiveSession()?.session_id !== sessionId) {
            return;
          }
          this.applySessionStreamProfile(renewed);
          this.hlsLiveSession.set(renewed);
          this.rememberLivePlaybackUrls(renewed);
          if (renewed.status === 'running' || renewed.status === 'starting') {
            this.scheduleLiveSessionRenewal(renewed);
            return;
          }
          this.hlsLiveStatus.set('degraded');
          this.hlsLiveError.set(renewed.message || 'Live session expired.');
        },
        error: () => {
          if (this.hlsLiveSession()?.session_id === sessionId) {
            this.scheduleLiveSessionRenewal(session);
          }
        },
      });
    }, this.liveSessionRenewIntervalMs);
  }

  private clearLiveSessionRenewTimer(): void {
    if (this.liveSessionRenewTimer === null) {
      return;
    }
    this.window.clearTimeout(this.liveSessionRenewTimer);
    this.liveSessionRenewTimer = null;
  }

  stopLive(showMessage = true): void {
    const session = this.hlsLiveSession();
    const deviceId = session?.device_id ?? this.selectedCameraId();
    this.hlsAttachToken += 1;
    this.hlsPlaybackToken += 1;
    this.hlsRecoveryAttempts = 0;
    this.clearLiveSessionRenewTimer();
    this.cancelLiveTransportTransition();
    this.resetLivePlaybackUserPause();
    this.stopWebRtcPlayback();
    this.stopHlsPlayback();
    this.resetLiveControlTimeline();
    this.hlsLiveUrl.set(null);
    this.liveControlPlaybackMode.set('hls-fallback');
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
      const transport = this.liveControlPlaybackMode() === 'webrtc' ? 'WebRTC' : 'HLS';
      return `Live ${transport} H.264 ${this.selectedStreamProfile()}`;
    }
    if (this.hlsLiveStatus() === 'starting') {
      return `Starting ${this.selectedStreamProfile()} stream`;
    }
    if (this.hlsLiveStatus() === 'degraded') {
      return 'Snapshot fallback';
    }
    return 'Stopped';
  }

  private applySessionStreamProfile(session: HarborAssistantCameraLiveSessionResponse): void {
    const profile = this.normalizeLiveStreamProfile(session.stream_profile);
    if (profile) {
      this.selectedStreamProfile.set(profile);
    }
  }

  private normalizeLiveStreamProfile(profile: string | null | undefined): HarborAssistantLiveStreamProfile | null {
    if (profile === 'sub' || profile === 'main') {
      return profile;
    }
    return null;
  }

  private defaultStreamProfileForCamera(deviceId: string | null | undefined): HarborAssistantLiveStreamProfile {
    if (deviceId?.toLowerCase().includes('main')) {
      return 'main';
    }
    return 'sub';
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

  onCameraTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    if (index !== 0) {
      return;
    }
    this.pausePlaybackVideo();
    if (this.livePlaybackBackgroundPaused) {
      if (this.liveControlPlaybackMode() === 'webrtc') {
        this.resumeLivePlayback();
        return;
      }
      this.scheduleLiveVideoPlayback(0, this.hlsLiveUrl(), this.hlsPlaybackToken, true);
      return;
    }
    this.resumeLivePlayback();
  }

  resumeLivePlayback(): void {
    if (this.livePlaybackUserPaused) {
      return;
    }
    if (this.isWebRtcPlaybackActive()) {
      const video = this.liveVideo?.nativeElement;
      if (video?.paused) {
        this.requestWebRtcPlayback(video, this.webrtcAttachToken);
      }
      return;
    }
    this.scheduleLiveVideoPlayback();
  }

  onLiveVideoLoadedData(): void {
    const video = this.liveVideo?.nativeElement;
    if (video?.srcObject && video.srcObject === this.webrtcMediaStream) {
      this.waitForWebRtcDecodedFrame(video, this.webrtcAttachToken);
      return;
    }
    this.syncLiveControlState();
    this.markHlsPlaybackReady();
    this.resumeLivePlayback();
    this.scheduleLiveTransportFrameReveal();
  }

  onLiveVideoPlaying(): void {
    const video = this.liveVideo?.nativeElement;
    if (
      video?.srcObject
      && video.srcObject === this.webrtcMediaStream
      && this.webrtcPeerConnection
    ) {
      this.waitForWebRtcDecodedFrame(video, this.webrtcAttachToken);
      return;
    }
    this.livePlaybackHasPlayed = true;
    this.livePlaybackBackgroundPaused = false;
    this.startLiveControlTimeline();
    this.syncLiveControlState();
    this.markHlsPlaybackReady();
    this.scheduleLiveTransportFrameReveal();
  }

  onLiveVideoPause(): void {
    this.syncLiveControlState();
    if (this.liveControlPlaybackMode() === 'webrtc') {
      if (this.suppressLivePauseEvent || this.liveDocumentIsHidden() || this.selectedTabIndex() !== 0) {
        this.livePlaybackBackgroundPaused = true;
        return;
      }
      this.livePlaybackUserPaused = true;
      this.livePlaybackUserDelayed = true;
      this.webrtcPauseTimelineSeconds = this.liveSessionElapsedSeconds();
      this.hlsPlaybackToken += 1;
      this.hlsLiveError.set(null);
      return;
    }
    if (this.suppressLivePauseEvent || !this.hlsLiveUrl() || this.hlsLiveStatus() !== 'live') {
      return;
    }
    if (this.selectedTabIndex() !== 0) {
      this.preserveBackgroundLivePlaybackPosition();
      this.hlsLiveError.set(null);
      this.scheduleLiveVideoPlayback(0, this.hlsLiveUrl(), this.hlsPlaybackToken, true);
      return;
    }
    if (this.liveDocumentIsHidden()) {
      this.preserveBackgroundLivePlaybackPosition();
      this.hlsLiveError.set(null);
      this.scheduleLiveVideoPlayback(0, this.hlsLiveUrl(), this.hlsPlaybackToken, true);
      return;
    }
    if (!this.livePlaybackHasPlayed && !this.livePlaybackUserPaused) {
      this.hlsLiveError.set(null);
      this.scheduleLiveVideoPlayback();
      return;
    }
    this.livePlaybackUserPaused = true;
    this.livePlaybackUserDelayed = true;
    this.userLivePlaybackAnchorSeconds = this.normalizedLiveVideoCurrentTime();
    this.hlsPlaybackToken += 1;
    this.hlsLiveError.set(null);
  }

  private handleLiveDocumentVisibilityChange(): void {
    if (!this.hlsLiveUrl() || this.hlsLiveStatus() !== 'live' || this.livePlaybackUserPaused) {
      return;
    }
    const video = this.liveVideo?.nativeElement;
    if (this.liveControlPlaybackMode() === 'webrtc') {
      if (!this.liveDocumentIsHidden() && video?.paused) {
        this.livePlaybackBackgroundPaused = false;
        this.requestWebRtcPlayback(video, this.webrtcAttachToken);
      }
      return;
    }
    if (this.liveDocumentIsHidden()) {
      if (video?.paused) {
        this.preserveBackgroundLivePlaybackPosition();
        this.scheduleLiveVideoPlayback(0, this.hlsLiveUrl(), this.hlsPlaybackToken, true);
      }
      return;
    }
    if (video?.paused && this.livePlaybackHasPlayed) {
      this.preserveBackgroundLivePlaybackPosition();
    }
    if (this.livePlaybackBackgroundPaused || video?.paused) {
      this.scheduleLiveVideoPlayback(0, this.hlsLiveUrl(), this.hlsPlaybackToken, true);
    }
  }

  private preserveBackgroundLivePlaybackPosition(): void {
    this.livePlaybackBackgroundPaused = true;
    const currentTime = this.normalizedLiveVideoCurrentTime();
    if (currentTime !== null && this.livePlaybackHasPlayed) {
      this.livePlaybackUserDelayed = true;
      this.userLivePlaybackAnchorSeconds = currentTime;
    }
  }

  private liveDocumentIsHidden(): boolean {
    return document.visibilityState === 'hidden';
  }

  private pausePlaybackVideo(): void {
    const video = this.playbackVideo?.nativeElement;
    if (video && !video.paused) {
      video.pause();
    }
  }

  onLiveVideoPlay(): void {
    this.syncLiveControlState();
    if (this.liveControlPlaybackMode() === 'webrtc') {
      this.livePlaybackBackgroundPaused = false;
      this.hlsLiveError.set(null);
      return;
    }
    if (!this.hlsLiveUrl() || this.hlsLiveStatus() !== 'live') {
      return;
    }
    const video = this.liveVideo?.nativeElement;
    if (this.livePlaybackUserPaused && this.hasPendingProgrammaticLivePlayRequest()) {
      if (video) {
        this.pauseLiveVideoSilently(video);
      }
      return;
    }
    const shouldRestoreUserAnchor = this.livePlaybackUserPaused && this.livePlaybackUserDelayed;
    this.livePlaybackUserPaused = false;
    if (video) {
      if (shouldRestoreUserAnchor) {
        this.restoreUserLivePlaybackAnchor(video);
      }
      this.applyUserLivePlaybackRate(video);
    }
    this.hlsLiveError.set(null);
  }

  onLiveVideoRateChange(): void {
    this.syncLiveControlState();
    if (this.liveControlPlaybackMode() === 'webrtc') {
      const video = this.liveVideo?.nativeElement;
      if (video && Math.abs(video.playbackRate - this.defaultLivePlaybackRate) > this.livePlaybackRateChangeTolerance) {
        this.setLiveVideoPlaybackRate(video, this.defaultLivePlaybackRate);
      }
      return;
    }
    if (!this.hlsLiveUrl() || this.hlsLiveStatus() !== 'live') {
      return;
    }
    const video = this.liveVideo?.nativeElement;
    if (!video) {
      return;
    }
    if (this.consumeProgrammaticLivePlaybackRate(video)) {
      return;
    }
    const playbackRate = this.normalizedLivePlaybackRate(video.playbackRate);
    if (playbackRate === null) {
      return;
    }
    if (
      !this.livePlaybackUserDelayed
      && this.userLivePlaybackRateIsCatchingUp(playbackRate)
      && this.returnLivePlaybackToWebRtcAfterCatchUp(video)
    ) {
      return;
    }
    this.userLivePlaybackRate = playbackRate;
    if (Math.abs(playbackRate - this.defaultLivePlaybackRate) > this.livePlaybackRateChangeTolerance) {
      this.livePlaybackUserDelayed = true;
      this.hlsPlaybackToken += 1;
    }
    this.hlsLiveError.set(null);
  }

  onLiveVideoTimeUpdate(): void {
    this.syncLiveControlState();
    if (this.liveControlPlaybackMode() === 'webrtc') {
      return;
    }
    if (
      !this.hlsLiveUrl()
      || this.hlsLiveStatus() !== 'live'
      || !this.livePlaybackUserDelayed
      || !this.userLivePlaybackRateIsCatchingUp()
    ) {
      return;
    }
    const video = this.liveVideo?.nativeElement;
    if (!video) {
      return;
    }
    this.returnLivePlaybackToWebRtcAfterCatchUp(video);
  }

  onLiveVideoSeeked(): void {
    this.syncLiveControlState();
    if (this.liveControlPlaybackMode() === 'webrtc') {
      return;
    }
    if (!this.hlsLiveUrl() || this.hlsLiveStatus() !== 'live') {
      return;
    }
    const video = this.liveVideo?.nativeElement;
    if (!video || !Number.isFinite(video.currentTime)) {
      return;
    }
    if (this.consumeProgrammaticLiveSeek(video)) {
      return;
    }
    this.livePlaybackUserPaused = video.paused;
    this.livePlaybackUserDelayed = true;
    this.userLivePlaybackAnchorSeconds = video.currentTime;
    this.hlsPlaybackToken += 1;
    this.applyUserLivePlaybackRate(video);
    this.hlsLiveError.set(null);
  }

  onLiveVideoVolumeChange(): void {
    this.syncLiveControlState();
  }

  toggleLivePlaybackFromControls(): void {
    const video = this.liveVideo?.nativeElement;
    if (!video) {
      return;
    }
    if (this.liveControlPlaybackMode() === 'webrtc') {
      if (this.liveControlPaused() || video.paused) {
        const timelineSeconds = this.webrtcPauseTimelineSeconds ?? this.liveSessionElapsedSeconds();
        this.switchToHlsTimeshift(timelineSeconds, true);
      } else {
        const timelineSeconds = this.liveSessionElapsedSeconds();
        this.webrtcPauseTimelineSeconds = timelineSeconds;
        this.livePlaybackUserPaused = true;
        this.livePlaybackUserDelayed = true;
        video.pause();
        this.liveControlCurrentTime.set(timelineSeconds);
        this.liveControlPaused.set(true);
      }
      return;
    }
    if (video.paused) {
      video.play().catch((): void => undefined);
    } else {
      video.pause();
    }
  }

  seekLivePlaybackFromControls(seconds: number): void {
    const video = this.liveVideo?.nativeElement;
    if (!video || !Number.isFinite(seconds)) {
      return;
    }
    const start = this.liveControlStartTime();
    const end = this.liveControlEndTime();
    const timelineSeconds = Math.min(end, Math.max(start, seconds));
    if (this.liveControlPlaybackMode() === 'webrtc') {
      if (end - timelineSeconds <= this.liveEdgeReturnToleranceSeconds && !video.paused) {
        return;
      }
      this.switchToHlsTimeshift(timelineSeconds, !video.paused);
      return;
    }
    if (
      end - timelineSeconds <= this.liveEdgeReturnToleranceSeconds
      && this.switchLivePlaybackToWebRtc(video)
    ) {
      return;
    }
    const liveEdge = this.liveVideoEdgeSeconds(video);
    const sessionElapsed = this.liveSessionElapsedSeconds();
    const timelineOffset = this.hlsControlTimelineOffset(sessionElapsed, liveEdge);
    video.currentTime = liveEdge === null
      ? timelineSeconds
      : Math.max(0, timelineSeconds - timelineOffset);
  }

  setLivePlaybackRateFromControls(rate: number): void {
    const video = this.liveVideo?.nativeElement;
    if (!video || !Number.isFinite(rate) || rate <= 0 || rate > this.maxUserLivePlaybackRate) {
      return;
    }
    if (this.liveControlPlaybackMode() === 'webrtc') {
      if (video.paused) {
        this.userLivePlaybackRate = rate;
        this.liveControlPlaybackRate.set(rate);
      } else {
        this.userLivePlaybackRate = this.defaultLivePlaybackRate;
        this.liveControlPlaybackRate.set(this.defaultLivePlaybackRate);
      }
      return;
    }
    video.playbackRate = rate;
  }

  setLiveMutedFromControls(muted: boolean): void {
    const video = this.liveVideo?.nativeElement;
    if (!video) {
      return;
    }
    video.muted = muted;
    this.syncLiveControlState();
  }

  setLiveVolumeFromControls(volume: number): void {
    const video = this.liveVideo?.nativeElement;
    if (!video || !Number.isFinite(volume)) {
      return;
    }
    video.volume = Math.min(1, Math.max(0, volume));
    if (video.volume > 0) {
      video.muted = false;
    }
    this.syncLiveControlState();
  }

  onPlaybackVideoSeeking(event: Event): void {
    const video = this.playbackVideoFromEvent(event);
    if (!video || !Number.isFinite(video.currentTime)) {
      return;
    }
    if (this.consumeProgrammaticPlaybackSeek(video)) {
      return;
    }
    this.playbackSeekAnchorSeconds = video.currentTime;
    this.playbackSeekMediaKey = this.selectedPlaybackMediaKey();
  }

  onPlaybackVideoSeeked(event: Event): void {
    this.restorePlaybackSeekAnchor(this.playbackVideoFromEvent(event));
  }

  onPlaybackVideoReady(event: Event): void {
    this.restorePlaybackSeekAnchor(this.playbackVideoFromEvent(event));
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
    if (this.hlsLiveStatus() === 'stopped') {
      return null;
    }
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
    if (this.hlsLiveStatus() === 'stopped') {
      return null;
    }
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
    this.window.open('/ui/harbor-assistant?tab=settings&section=camera', '_blank', 'noopener');
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
    this.clearRecordingFinalizationTimer();
    this.stopHlsPlayback();
    this.stopLive(false);
    this.stopHlsWarmSession();
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
    if (segment.local_status === 'finalize_failed') {
      return 'Recording unavailable';
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
    return segment.local_status === 'archive_failed' || segment.local_status === 'finalize_failed';
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
    target?.requestFullscreen?.().catch((): void => undefined);
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
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
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
    this.dvrTimeline.set(
      [normalized, ...existing].sort((left, right) => this.mediaTimestamp(right) - this.mediaTimestamp(left)),
    );
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

  private replaceOptimisticMediaItem(
    optimisticKey: string | null,
    item: HarborAssistantSearchDvrTimelineSegment,
  ): void {
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

  private pruneFinalizingRecordings(
    deviceId: string,
    segments: HarborAssistantSearchDvrTimelineSegment[],
  ): boolean {
    const pendingRecordings = this.optimisticMediaItems().filter((segment) => {
      return segment.device_id === deviceId
        && this.mediaKind(segment) === 'recording'
        && segment.local_status === 'finalizing';
    });
    if (pendingRecordings.length === 0) {
      return true;
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
    return playableRecordingExists;
  }

  private scheduleRecordingFinalizationRefresh(deviceId: string): void {
    this.clearRecordingFinalizationTimer();
    if (this.recordingFinalizationAttempts >= this.recordingFinalizationPollLimit) {
      this.optimisticMediaItems.set(this.optimisticMediaItems().map((segment) => {
        if (
          segment.device_id !== deviceId
          || this.mediaKind(segment) !== 'recording'
          || segment.local_status !== 'finalizing'
        ) {
          return segment;
        }
        return { ...segment, local_status: 'finalize_failed' };
      }));
      this.recordIntent.set(null);
      this.actionError.set('Recording stopped, but the saved clip did not appear in Playback.');
      return;
    }
    this.recordingFinalizationAttempts += 1;
    this.recordingFinalizationTimer = this.window.setTimeout(() => {
      this.recordingFinalizationTimer = null;
      if (this.recordIntent() === 'finalizing' && this.selectedCameraId() === deviceId) {
        this.refreshCameraDvr();
      }
    }, this.recordingFinalizationPollDelayMs);
  }

  private clearRecordingFinalizationTimer(): void {
    if (this.recordingFinalizationTimer === null) {
      return;
    }
    this.window.clearTimeout(this.recordingFinalizationTimer);
    this.recordingFinalizationTimer = null;
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

  private normalizeTimelineItem(
    item: HarborAssistantSearchDvrTimelineSegment,
    displayAt?: string | null,
  ): HarborAssistantSearchMediaItem {
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
        const recordingFinalized = this.pruneFinalizingRecordings(deviceId, segments);
        if (this.recordIntent() === 'finalizing') {
          if (recordingFinalized) {
            this.clearRecordingFinalizationTimer();
            this.recordIntent.set(null);
            this.showActionMessage('Recording is ready in Playback.');
          } else {
            this.scheduleRecordingFinalizationRefresh(deviceId);
          }
        }
        this.cameraError.set(refreshErrors.length > 0 ? refreshErrors[0] : null);
      },
      error: (error: unknown) => {
        this.cameraError.set(harborAssistantSearchErrorMessage(error));
      },
    });
  }

  private searchScopeForQuery(query: string): {
    filter: HarborAssistantSearchResultFilter;
    cameraId: string | null;
    sourceScope: HarborAssistantSearchSourceScope;
  } {
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

  private normalizeTimelineSegmentsForDisplay(
    deviceId: string,
    segments: HarborAssistantSearchDvrTimelineSegment[],
  ): HarborAssistantSearchMediaItem[] {
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
        const segmentTimestamp = Number(
          segment.ended_at || segment.created_at || segment.started_at || 0,
        );
        return Math.abs(segmentTimestamp - this.mediaTimestamp(item)) <= 30;
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

  private rememberLivePlaybackUrls(session: HarborAssistantCameraLiveSessionResponse): void {
    if (session.playlist_url) {
      this.hlsLiveUrl.set(harborAssistantHlsLiveUrl(session.playlist_url));
    }
    if (session.webrtc_status === 'ready' && session.webrtc_url) {
      this.webrtcLiveUrl.set(harborAssistantWhepUrl(session.webrtc_url));
    }
  }

  private startWebRtcPlaybackFromSession(session: HarborAssistantCameraLiveSessionResponse): boolean {
    if (
      !this.harborLinkWebRtcReady()
      || session.session_id === this.webrtcDegradedSessionId
      || session.webrtc_status !== 'ready'
      || !session.webrtc_url
      || typeof RTCPeerConnection === 'undefined'
    ) {
      return false;
    }
    const url = harborAssistantWhepUrl(session.webrtc_url);
    if (!url) {
      return false;
    }
    if (this.liveControlPlaybackMode() !== 'webrtc') {
      this.beginLiveTransportTransition('webrtc');
    }
    this.webrtcLiveUrl.set(url);
    this.scheduleWebRtcPlaybackAttach(0, url);
    return true;
  }

  private scheduleWebRtcPlaybackAttach(
    attempt = 0,
    url = this.webrtcLiveUrl(),
    token = this.webrtcAttachToken + 1,
  ): void {
    if (!url) {
      return;
    }
    if (attempt === 0) {
      this.webrtcAttachToken = token;
      this.webrtcPlaybackPending = true;
    }
    this.window.setTimeout(() => {
      if (this.webrtcAttachToken !== token || this.webrtcLiveUrl() !== url) {
        return;
      }
      const video = this.liveVideo?.nativeElement;
      if (!video) {
        if (attempt < 20) {
          this.scheduleWebRtcPlaybackAttach(attempt + 1, url, token);
        } else {
          this.fallbackToHlsPlayback('WebRTC player did not initialize.');
        }
        return;
      }
      this.attachWhepPlayback(video, url, token).catch((error: unknown) => {
        if (this.webrtcAttachToken === token) {
          this.fallbackToHlsPlayback(this.webRtcNegotiationFailureMessage(error));
        }
      });
    }, attempt === 0 ? 0 : 100);
  }

  private async attachWhepPlayback(video: HTMLVideoElement, url: string, token: number): Promise<void> {
    const peerConnection = new RTCPeerConnection({ iceServers: [] });
    this.webrtcPeerConnection?.close();
    this.abortWebRtcNegotiation();
    this.clearWebRtcFirstFrameDeadline();
    this.clearWebRtcPlayRetry();
    this.webrtcMediaStream = null;
    this.webrtcPlayRequestPending = false;
    this.webrtcPostDispatched = false;
    this.webrtcPeerConnection = peerConnection;
    const abortController = new AbortController();
    this.webrtcNegotiationAbortController = abortController;
    let negotiatedResourceUrl: string | null = null;
    peerConnection.addTransceiver('video', { direction: 'recvonly' });
    peerConnection.addTransceiver('audio', { direction: 'recvonly' });
    peerConnection.ontrack = (event) => {
      if (this.webrtcAttachToken !== token || this.webrtcPeerConnection !== peerConnection) {
        return;
      }
      this.attachWebRtcTrack(video, event);
      video.autoplay = true;
      video.playsInline = true;
      video.muted = this.liveControlMuted();
      video.volume = this.liveControlVolume();
      this.webrtcPauseTimelineSeconds = null;
      this.resetLivePlaybackUserPause();
      this.requestWebRtcPlayback(video, token);
    };
    peerConnection.onconnectionstatechange = () => {
      if (this.webrtcAttachToken !== token || this.webrtcPeerConnection !== peerConnection) {
        return;
      }
      if (peerConnection.connectionState === 'failed') {
        this.fallbackToHlsPlayback('WebRTC connection failed.');
      } else if (peerConnection.connectionState === 'disconnected') {
        this.window.setTimeout(() => {
          if (
            this.webrtcAttachToken === token
            && this.webrtcPeerConnection === peerConnection
            && peerConnection.connectionState === 'disconnected'
          ) {
            this.fallbackToHlsPlayback('WebRTC connection was interrupted.');
          }
        }, 2_000);
      }
    };

    const negotiation = async (): Promise<void> => {
      const offer = await peerConnection.createOffer();
      this.ensureWebRtcNegotiationIsActive(peerConnection, token, abortController.signal);
      await peerConnection.setLocalDescription(offer);
      await this.waitForIceGathering(peerConnection);
      this.ensureWebRtcNegotiationIsActive(peerConnection, token, abortController.signal);
      const offerSdp = peerConnection.localDescription?.sdp;
      if (!offerSdp) {
        throw new Error('WebRTC offer did not contain SDP');
      }
      this.webrtcPostDispatched = true;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offerSdp,
        signal: abortController.signal,
      });
      this.ensureWebRtcNegotiationIsActive(peerConnection, token, abortController.signal);
      if (!response.ok) {
        throw new Error(`WHEP negotiation failed with HTTP ${response.status}`);
      }
      negotiatedResourceUrl = this.validateWhepResourceUrl(response.headers.get('Location'));
      const answer = await response.text();
      this.ensureWebRtcNegotiationIsActive(peerConnection, token, abortController.signal);
      await peerConnection.setRemoteDescription({ type: 'answer', sdp: answer });
      this.ensureWebRtcNegotiationIsActive(peerConnection, token, abortController.signal);
    };

    try {
      await this.runWebRtcNegotiationWithDeadline(negotiation(), abortController);
      this.webrtcResourceUrl = negotiatedResourceUrl;
      this.scheduleWebRtcFirstFrameDeadline(peerConnection, token);
    } catch (error: unknown) {
      if (this.webrtcPeerConnection === peerConnection) {
        this.webrtcPeerConnection = null;
      }
      peerConnection.ontrack = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.close();
      this.deleteWhepResource(negotiatedResourceUrl);
      throw error;
    } finally {
      if (this.webrtcNegotiationAbortController === abortController) {
        this.webrtcNegotiationAbortController = null;
      }
    }
  }

  private runWebRtcNegotiationWithDeadline(
    negotiation: Promise<void>,
    abortController: AbortController,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const deadline = this.window.setTimeout(() => {
        abortController.abort();
        reject(new Error('WebRTC negotiation timed out'));
      }, this.webRtcNegotiationDeadlineMs);
      negotiation.then(resolve, reject).finally(() => this.window.clearTimeout(deadline));
    });
  }

  private ensureWebRtcNegotiationIsActive(
    peerConnection: RTCPeerConnection,
    token: number,
    abortSignal: AbortSignal,
  ): void {
    if (
      abortSignal.aborted
      || this.webrtcAttachToken !== token
      || this.webrtcPeerConnection !== peerConnection
    ) {
      throw new Error('WebRTC negotiation was cancelled');
    }
  }

  private validateWhepResourceUrl(location: string | null): string {
    if (!location) {
      throw new Error('WHEP response did not include a Location header');
    }
    const resourceUrl = new URL(location, this.window.location.href);
    const currentUrl = new URL(this.window.location.href);
    if (
      resourceUrl.origin !== currentUrl.origin
      || !/^\/api\/harbor-link\/media\/[^/]+\/whep\/[^/]+$/.test(resourceUrl.pathname)
      || resourceUrl.search
    ) {
      throw new Error('WHEP resource Location is outside the allowed HarborLink media path');
    }
    resourceUrl.hash = '';
    return resourceUrl.toString();
  }

  private scheduleWebRtcFirstFrameDeadline(peerConnection: RTCPeerConnection, token: number): void {
    this.clearWebRtcFirstFrameDeadline();
    this.webrtcFirstFrameDeadlineTimer = this.window.setTimeout(() => {
      this.webrtcFirstFrameDeadlineTimer = null;
      if (
        this.webrtcAttachToken === token
        && this.webrtcPeerConnection === peerConnection
        && this.liveControlPlaybackMode() !== 'webrtc'
      ) {
        this.fallbackToHlsPlayback('WebRTC did not render a first frame in time.');
      }
    }, this.webRtcFirstFrameDeadlineMs);
  }

  private waitForWebRtcDecodedFrame(video: HTMLVideoElement, token: number): void {
    if (
      this.webrtcAttachToken !== token
      || video.srcObject !== this.webrtcMediaStream
      || !this.webrtcPeerConnection
    ) {
      return;
    }
    const frameVideo = video as HTMLVideoElement & HarborAssistantVideoFrameCallbacks;
    if (frameVideo.requestVideoFrameCallback) {
      if (this.webrtcFirstFrameCallbackVideo === frameVideo && this.webrtcFirstFrameCallbackId !== null) {
        return;
      }
      this.clearWebRtcFirstFrameCallback();
      this.webrtcFirstFrameCallbackVideo = frameVideo;
      this.webrtcFirstFrameCallbackId = frameVideo.requestVideoFrameCallback(() => {
        this.webrtcFirstFrameCallbackId = null;
        this.webrtcFirstFrameCallbackVideo = null;
        this.markWebRtcDecodedFrame(video, token);
      });
      return;
    }
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.markWebRtcDecodedFrame(video, token);
    }
  }

  private markWebRtcDecodedFrame(video: HTMLVideoElement, token: number): void {
    if (
      this.webrtcAttachToken !== token
      || video.srcObject !== this.webrtcMediaStream
      || !this.webrtcPeerConnection
    ) {
      return;
    }
    this.clearWebRtcFirstFrameCallback();
    this.clearWebRtcFirstFrameDeadline();
    this.liveControlPlaybackMode.set('webrtc');
    this.hlsLiveStatus.set('live');
    this.webrtcPlaybackPending = false;
    this.webrtcPauseTimelineSeconds = null;
    this.resetLivePlaybackUserPause();
    this.livePlaybackHasPlayed = true;
    this.livePlaybackBackgroundPaused = false;
    this.startLiveControlTimeline();
    this.syncLiveControlState();
    this.scheduleLiveTransportFrameReveal();
    this.startLiveEdgeMonitor();
  }

  private clearWebRtcFirstFrameCallback(): void {
    if (this.webrtcFirstFrameCallbackId !== null) {
      this.webrtcFirstFrameCallbackVideo?.cancelVideoFrameCallback?.(this.webrtcFirstFrameCallbackId);
    }
    this.webrtcFirstFrameCallbackId = null;
    this.webrtcFirstFrameCallbackVideo = null;
  }

  private clearWebRtcFirstFrameDeadline(): void {
    if (this.webrtcFirstFrameDeadlineTimer === null) {
      return;
    }
    this.window.clearTimeout(this.webrtcFirstFrameDeadlineTimer);
    this.webrtcFirstFrameDeadlineTimer = null;
  }

  private abortWebRtcNegotiation(): void {
    this.webrtcNegotiationAbortController?.abort();
    this.webrtcNegotiationAbortController = null;
  }

  private attachWebRtcTrack(video: HTMLVideoElement, event: RTCTrackEvent): void {
    const stream = this.webrtcMediaStream ?? event.streams[0] ?? new MediaStream();
    this.webrtcMediaStream = stream;
    if (!stream.getTracks().includes(event.track)) {
      stream.addTrack(event.track);
    }
    if (video.srcObject !== stream) {
      this.stopHlsPlayback();
      video.srcObject = stream;
    }
  }

  private requestWebRtcPlayback(
    video: HTMLVideoElement,
    token: number,
    abortRetryCount = 0,
  ): void {
    if (
      this.webrtcAttachToken !== token
      || video.srcObject !== this.webrtcMediaStream
      || this.webrtcPlayRequestPending
      || this.webrtcPlayRetryTimer !== null
    ) {
      return;
    }
    this.webrtcPlayRequestPending = true;
    video.play().then(() => {
      if (this.webrtcAttachToken === token) {
        this.webrtcPlayRequestPending = false;
      }
    }).catch((error: unknown) => {
      if (this.webrtcAttachToken !== token) {
        return;
      }
      this.webrtcPlayRequestPending = false;
      if (this.webRtcPlaybackWasAborted(error) && abortRetryCount < this.webRtcPlayAbortRetryLimit) {
        this.webrtcPlayRetryTimer = globalThis.setTimeout(() => {
          this.webrtcPlayRetryTimer = null;
          this.requestWebRtcPlayback(video, token, abortRetryCount + 1);
        }, this.webRtcPlayRetryDelayMs);
        return;
      }
      this.fallbackToHlsPlayback(this.webRtcPlaybackFailureMessage(error));
    });
  }

  private webRtcPlaybackWasAborted(error: unknown): boolean {
    return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError');
  }

  private webRtcPlaybackFailureMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'name' in error && typeof error.name === 'string') {
      return `WebRTC playback failed (${error.name}).`;
    }
    return 'WebRTC playback failed.';
  }

  private webRtcNegotiationFailureMessage(error: unknown): string {
    if (error instanceof Error && error.message.includes('timed out')) {
      return 'WebRTC connection timed out.';
    }
    return 'WebRTC connection failed.';
  }

  private waitForIceGathering(peerConnection: RTCPeerConnection): Promise<void> {
    if (peerConnection.iceGatheringState === 'complete') {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      let timeout = 0;
      const handleStateChange = (): void => {
        if (peerConnection.iceGatheringState !== 'complete') {
          return;
        }
        this.window.clearTimeout(timeout);
        peerConnection.removeEventListener('icegatheringstatechange', handleStateChange);
        resolve();
      };
      timeout = this.window.setTimeout(() => {
        peerConnection.removeEventListener('icegatheringstatechange', handleStateChange);
        reject(new Error('WebRTC ICE gathering timed out'));
      }, 5_000);
      peerConnection.addEventListener('icegatheringstatechange', handleStateChange);
    });
  }

  private isWebRtcPlaybackActive(): boolean {
    return this.webrtcPlaybackPending || this.liveControlPlaybackMode() === 'webrtc';
  }

  private fallbackToHlsPlayback(message: string): void {
    const session = this.hlsLiveSession();
    const requiresRemoteSessionCleanup = Boolean(
      this.webrtcPostDispatched
      && !this.webrtcResourceUrl
      && session?.device_id
      && session.session_id,
    );
    if (session?.session_id) {
      this.webrtcDegradedSessionId = session.session_id;
    }
    if (this.isWebRtcPlaybackActive()) {
      this.beginLiveTransportTransition('hls');
    }
    this.stopWebRtcPlayback(false);
    this.liveControlPlaybackMode.set('hls-fallback');
    this.hlsLiveError.set(`${message} HLS fallback is active.`);
    if (requiresRemoteSessionCleanup && session) {
      this.restartLiveSessionForHlsFallback(session);
      this.showLiveFeedback('WebRTC unavailable. Using HLS.', 2200);
      return;
    }
    if (session?.playlist_url && this.shouldAttachHlsPlayback(session)) {
      this.startHlsPlaybackFromSession(session, { pending: !session.playlist_ready });
      this.scheduleLiveTransportFrameReveal();
    }
    this.showLiveFeedback('WebRTC unavailable. Using HLS.', 2200);
  }

  private restartLiveSessionForHlsFallback(session: HarborAssistantCameraLiveSessionResponse): void {
    const deviceId = session.device_id;
    const sessionId = session.session_id;
    if (!deviceId || !sessionId) {
      return;
    }
    const streamProfile = this.normalizeLiveStreamProfile(session.stream_profile);
    this.clearLiveSessionRenewTimer();
    this.hlsLiveStatus.set('starting');
    this.api.stopCameraLiveSession(deviceId, sessionId).pipe(
      retry({
        count: 3,
        delay: (_error, retryCount) => timer(retryCount * 500),
      }),
      catchError(() => of(null)),
      switchMap(() => this.api.startCameraLiveSession(deviceId, streamProfile)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (fallbackSession) => {
        if (
          this.hlsLiveStatus() === 'stopped'
          || this.hlsLiveSession()?.session_id !== sessionId
        ) {
          this.releaseHlsWarmSession(fallbackSession);
          return;
        }
        this.applySessionStreamProfile(fallbackSession);
        this.hlsLiveSession.set(fallbackSession);
        this.webrtcDegradedSessionId = fallbackSession.session_id;
        this.rememberLivePlaybackUrls(fallbackSession);
        this.scheduleLiveSessionRenewal(fallbackSession);
        const attached = this.shouldAttachHlsPlayback(fallbackSession)
          && this.startHlsPlaybackFromSession(fallbackSession, { pending: !fallbackSession.playlist_ready });
        if (!fallbackSession.playlist_ready || !attached) {
          this.waitForHlsPlaylist(fallbackSession);
        }
      },
      error: (error: unknown) => {
        if (this.hlsLiveSession()?.session_id !== sessionId) {
          return;
        }
        this.hlsLiveStatus.set('degraded');
        this.hlsLiveError.set(harborAssistantSearchErrorMessage(error));
      },
    });
  }

  private stopWebRtcPlayback(clearUrl = true): void {
    this.webrtcAttachToken += 1;
    this.abortWebRtcNegotiation();
    this.clearWebRtcFirstFrameCallback();
    this.clearWebRtcFirstFrameDeadline();
    this.clearWebRtcPlayRetry();
    this.webrtcMediaStream = null;
    this.webrtcPlayRequestPending = false;
    this.webrtcPlaybackPending = false;
    const peerConnection = this.webrtcPeerConnection;
    this.webrtcPeerConnection = null;
    this.webrtcPostDispatched = false;
    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.close();
    }
    const resourceUrl = this.webrtcResourceUrl;
    this.webrtcResourceUrl = null;
    this.deleteWhepResource(resourceUrl);
    const video = this.liveVideo?.nativeElement;
    if (video?.srcObject) {
      this.pauseLiveVideoSilently(video);
      video.srcObject = null;
    }
    if (clearUrl) {
      this.webrtcLiveUrl.set(null);
    }
  }

  private refreshHarborLinkCapabilitiesForLive(): Observable<HarborAssistantHarborLinkCapabilitiesResponse | null> {
    return this.api.harborLinkCapabilities().pipe(
      tap((capabilities) => this.harborLinkCapabilities.set(capabilities)),
      catchError(() => {
        this.harborLinkCapabilities.set(null);
        return of(null);
      }),
    );
  }

  private harborLinkWebRtcReady(): boolean {
    const capabilities = this.harborLinkCapabilities();
    return Boolean(capabilities?.ok !== false && capabilities?.features?.webrtc?.status === 'ready');
  }

  private deleteWhepResource(resourceUrl: string | null): void {
    if (!resourceUrl || typeof fetch === 'undefined') {
      return;
    }
    try {
      const validatedResourceUrl = this.validateWhepResourceUrl(resourceUrl);
      fetch(validatedResourceUrl, { method: 'DELETE', keepalive: true }).catch((): void => undefined);
    } catch {
      // Ignore unsafe or malformed resource URLs; they must never receive a browser request.
    }
  }

  private clearWebRtcPlayRetry(): void {
    if (this.webrtcPlayRetryTimer === null) {
      return;
    }
    globalThis.clearTimeout(this.webrtcPlayRetryTimer);
    this.webrtcPlayRetryTimer = null;
  }

  private switchToHlsTimeshift(timelineSeconds: number, autoplay: boolean): void {
    const session = this.hlsLiveSession();
    if (!session?.playlist_url) {
      this.fallbackToHlsPlayback('HLS time-shift is not ready.');
      return;
    }
    if (this.liveControlPlaybackMode() === 'webrtc') {
      this.beginLiveTransportTransition('hls');
    }
    this.pendingHlsBehindLiveSeconds = Math.max(0, this.liveSessionElapsedSeconds() - timelineSeconds);
    this.livePlaybackUserPaused = !autoplay;
    this.livePlaybackUserDelayed = true;
    this.webrtcPauseTimelineSeconds = null;
    this.stopWebRtcPlayback(false);
    this.liveControlPlaybackMode.set('hls-timeshift');
    this.startHlsPlaybackFromSession(session, { pending: !session.playlist_ready });
  }

  private restorePendingHlsPosition(video: HTMLVideoElement): void {
    const behindLiveSeconds = this.pendingHlsBehindLiveSeconds;
    const liveEdge = this.liveVideoEdgeSeconds(video);
    if (behindLiveSeconds === null || liveEdge === null) {
      return;
    }
    const seekableStart = video.seekable.length > 0 ? video.seekable.start(0) : 0;
    const targetTime = Math.max(seekableStart, liveEdge - behindLiveSeconds);
    this.pendingHlsBehindLiveSeconds = null;
    this.userLivePlaybackAnchorSeconds = targetTime;
    this.setLiveVideoCurrentTime(video, targetTime);
    this.applyUserLivePlaybackRate(video);
    if (this.livePlaybackUserPaused) {
      this.pauseLiveVideoSilently(video);
    } else {
      this.scheduleLiveVideoPlayback(0, this.hlsLiveUrl(), this.hlsPlaybackToken, true);
    }
  }

  private shouldAttachHlsPlayback(session: HarborAssistantCameraLiveSessionResponse): boolean {
    return session.playlist_ready
      || Boolean(session.diagnostics?.playlist_exists)
      || (session.diagnostics?.segment_count ?? 0) > 0;
  }

  private startHlsPlaybackFromSession(
    session: HarborAssistantCameraLiveSessionResponse,
    options: { pending?: boolean } = {},
  ): boolean {
    if (!session.playlist_url) {
      return false;
    }

    const liveUrl = harborAssistantHlsLiveUrl(session.playlist_url);
    const shouldAttach = this.hlsLiveUrl() !== liveUrl || this.hls === null;
    this.hlsLiveUrl.set(liveUrl);
    if (shouldAttach) {
      this.hlsFirstFrameSeen = false;
    }
    if (options.pending || !this.hlsFirstFrameSeen) {
      this.hlsLiveStatus.set('starting');
    } else {
      this.hlsLiveStatus.set('live');
    }
    if (shouldAttach) {
      this.scheduleHlsPlaybackAttach(0, liveUrl);
    } else {
      this.scheduleLiveVideoPlayback(0, liveUrl);
    }
    return true;
  }

  private scheduleHlsPlaybackAttach(
    attempt = 0,
    url = this.hlsLiveUrl(),
    token = this.hlsAttachToken + 1,
  ): void {
    if (!url) {
      return;
    }
    if (attempt === 0) {
      this.hlsAttachToken = token;
    }
    this.window.setTimeout(() => {
      if (
        this.hlsAttachToken !== token
        || this.hlsLiveUrl() !== url
        || this.hlsLiveStatus() === 'stopped'
      ) {
        return;
      }
      if (this.attachHlsPlayback()) {
        return;
      }
      if (attempt < 20) {
        this.scheduleHlsPlaybackAttach(attempt + 1, url, token);
        return;
      }
      this.hlsLiveStatus.set('degraded');
      this.hlsLiveError.set('Live player did not initialize. Retry live playback.');
    }, attempt === 0 ? 0 : 100);
  }

  private attachHlsPlayback(): boolean {
    const url = this.hlsLiveUrl();
    const video = this.liveVideo?.nativeElement;
    if (!url || !video) {
      return false;
    }
    const playbackMode = this.liveControlPlaybackMode();
    this.stopHlsPlayback();
    this.liveControlPlaybackMode.set(
      playbackMode === 'hls-timeshift' ? 'hls-timeshift' : 'hls-fallback',
    );
    this.hlsRecoveryAttempts = 0;
    video.autoplay = true;
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    if (Hls.isSupported()) {
      const hls = new Hls({
        backBufferLength: Number.POSITIVE_INFINITY,
        lowLatencyMode: true,
        maxBufferLength: 120,
        maxMaxBufferLength: 600,
        maxLiveSyncPlaybackRate: 1,
      });
      this.hls = hls;
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) {
          return;
        }
        if (this.isExpiredHlsAssetError(data)) {
          if (this.retryStartingHlsAsset(hls, data)) {
            return;
          }
          this.hlsLiveStatus.set('degraded');
          this.hlsLiveError.set('Live session expired. Start live playback again.');
          this.stopHlsPlayback();
          return;
        }
        if (this.recoverHlsPlayback(hls, data)) {
          return;
        }
        this.hlsLiveStatus.set('degraded');
        this.hlsLiveError.set(
          `Live HLS playback failed (${this.describeHlsError(data)}). Snapshot fallback is still available.`,
        );
        this.stopHlsPlayback();
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.startLiveEdgeMonitor();
        if (this.pendingHlsBehindLiveSeconds !== null) {
          this.restorePendingHlsPosition(video);
        } else {
          this.seekLiveVideoToEdge(true);
          this.scheduleLiveVideoPlayback();
        }
      });
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        this.markHlsPlaybackReady();
        if (this.pendingHlsBehindLiveSeconds !== null) {
          this.restorePendingHlsPosition(video);
        }
        if (this.livePlaybackUserPaused) {
          this.restoreUserLivePlaybackAnchor();
        }
        if (!this.livePlaybackUserDelayed) {
          this.scheduleLiveVideoPlayback();
        }
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      return true;
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.load();
      this.startLiveEdgeMonitor();
      if (this.pendingHlsBehindLiveSeconds !== null) {
        const restorePosition = (): void => {
          video.removeEventListener('loadedmetadata', restorePosition);
          this.restorePendingHlsPosition(video);
        };
        video.addEventListener('loadedmetadata', restorePosition);
      } else {
        this.scheduleLiveVideoPlayback();
      }
      return true;
    }
    this.hlsLiveStatus.set('degraded');
    this.hlsLiveError.set('This browser cannot play local HLS live video.');
    return true;
  }

  private markHlsPlaybackReady(): void {
    if (!this.hlsLiveUrl() || this.hlsLiveStatus() === 'stopped' || this.hlsLiveStatus() === 'degraded') {
      return;
    }
    if (!this.hlsFirstFrameSeen) {
      this.hlsFirstFrameSeen = true;
      this.showLiveFeedback('Live started.', 1800);
    }
    this.clearHlsStartingAssetRetry();
    this.hlsLiveStatus.set('live');
    this.hlsLiveError.set(null);
  }

  private recoverHlsPlayback(hls: Hls, data: { details?: unknown; type?: unknown }): boolean {
    if (this.hlsRecoveryAttempts >= 3) {
      return false;
    }
    const type = typeof data.type === 'string' ? data.type : '';
    if (type === 'networkError') {
      this.hlsRecoveryAttempts += 1;
      this.hlsLiveError.set(`Live HLS network error; retrying (${this.describeHlsError(data)}).`);
      hls.startLoad();
      this.scheduleLiveVideoPlayback();
      return true;
    }
    if (type === 'mediaError') {
      this.hlsRecoveryAttempts += 1;
      this.hlsLiveError.set(`Live HLS media error; retrying (${this.describeHlsError(data)}).`);
      hls.recoverMediaError();
      this.scheduleLiveVideoPlayback();
      return true;
    }
    return false;
  }

  private isExpiredHlsAssetError(data: { response?: unknown; type?: unknown }): boolean {
    if (data.type !== 'networkError') {
      return false;
    }
    const response = data.response;
    if (!response || typeof response !== 'object') {
      return false;
    }
    const code = (response as { code?: unknown }).code;
    return code === 404 || code === 410;
  }

  private retryStartingHlsAsset(
    hls: Hls,
    data: { details?: unknown; response?: unknown; type?: unknown },
  ): boolean {
    if (
      this.hlsLiveStatus() !== 'starting'
      || this.hlsStartingAssetRetryCount >= this.hlsStartingAssetRetryLimit
    ) {
      return false;
    }
    this.hlsStartingAssetRetryCount += 1;
    this.hlsLiveError.set(
      `Live HLS assets are starting; retrying ${this.hlsStartingAssetRetryCount}/${this.hlsStartingAssetRetryLimit} (${this.describeHlsError(data)}).`,
    );
    this.clearHlsStartingAssetRetryTimer();
    this.hlsStartingAssetRetryTimer = this.window.setTimeout(() => {
      this.hlsStartingAssetRetryTimer = null;
      if (this.hls === hls && this.hlsLiveStatus() === 'starting') {
        hls.startLoad();
      }
    }, this.hlsStartingAssetRetryDelayMs);
    return true;
  }

  private clearHlsStartingAssetRetry(): void {
    this.clearHlsStartingAssetRetryTimer();
    this.hlsStartingAssetRetryCount = 0;
  }

  private clearHlsStartingAssetRetryTimer(): void {
    if (this.hlsStartingAssetRetryTimer === null) {
      return;
    }
    this.window.clearTimeout(this.hlsStartingAssetRetryTimer);
    this.hlsStartingAssetRetryTimer = null;
  }

  private describeHlsError(data: { details?: unknown; error?: unknown; type?: unknown }): string {
    const type = typeof data.type === 'string' && data.type.trim() ? data.type.trim() : 'unknown';
    const details = typeof data.details === 'string' && data.details.trim() ? data.details.trim() : 'unknown';
    const error = data.error instanceof Error && data.error.message.trim() ? data.error.message.trim() : null;
    const message = error ? `${type}/${details}: ${error}` : `${type}/${details}`;
    return message.slice(0, 160);
  }

  private scheduleLiveVideoPlayback(
    attempt = 0,
    url = this.hlsLiveUrl(),
    token = this.hlsPlaybackToken,
    allowDelayedPlayback = false,
  ): void {
    if (!url || this.livePlaybackUserPaused || (this.livePlaybackUserDelayed && !allowDelayedPlayback)) {
      return;
    }
    this.window.setTimeout(() => {
      if (
        this.hlsPlaybackToken !== token
        || this.hlsLiveUrl() !== url
        || this.hlsLiveStatus() === 'stopped'
        || this.livePlaybackUserPaused
        || (this.livePlaybackUserDelayed && !allowDelayedPlayback)
      ) {
        return;
      }
      const video = this.liveVideo?.nativeElement;
      if (!video) {
        return;
      }
      video.playsInline = true;
      if (!video.paused && video.currentTime > 0) {
        this.hlsLiveError.set(null);
        return;
      }
      if (allowDelayedPlayback && this.livePlaybackBackgroundPaused) {
        this.restoreUserLivePlaybackAnchor(video);
        this.applyUserLivePlaybackRate(video);
      }
      this.requestProgrammaticLiveVideoPlay(video, {
        allowDelayedPlayback,
        attempt,
        token,
        url,
      });
    }, attempt === 0 ? 0 : 350);
  }

  private requestProgrammaticLiveVideoPlay(
    video: HTMLVideoElement,
    request: HarborAssistantLivePlaybackRequest,
  ): void {
    if (this.hasPendingProgrammaticLivePlayRequest(request.token)) {
      return;
    }
    this.pendingProgrammaticLivePlayToken = request.token;
    video.play().then(() => {
      this.completeProgrammaticLivePlayRequest(request.token);
      if (this.livePlaybackUserPaused) {
        this.pauseLiveVideoSilently(video);
        return;
      }
      if (!this.livePlaybackRequestIsCurrent(request)) {
        return;
      }
      this.hlsLiveError.set(null);
    }).catch(() => {
      this.completeProgrammaticLivePlayRequest(request.token);
      if (!this.livePlaybackRequestIsCurrent(request)) {
        return;
      }
      if (request.attempt < 6) {
        this.scheduleLiveVideoPlayback(
          request.attempt + 1,
          request.url,
          request.token,
          request.allowDelayedPlayback,
        );
        return;
      }
      if (!this.liveDocumentIsHidden()) {
        this.hlsLiveError.set('Browser paused live playback. Press the video play control.');
      }
    });
  }

  private livePlaybackRequestIsCurrent(request: HarborAssistantLivePlaybackRequest): boolean {
    return this.hlsPlaybackToken === request.token
      && this.hlsLiveUrl() === request.url
      && this.hlsLiveStatus() !== 'stopped'
      && !this.livePlaybackUserPaused
      && (!this.livePlaybackUserDelayed || request.allowDelayedPlayback);
  }

  private stopHlsPlayback(): void {
    this.stopLiveEdgeMonitor();
    this.clearHlsStartingAssetRetry();
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.hlsFirstFrameSeen = false;
    this.livePlaybackHasPlayed = false;
    this.livePlaybackBackgroundPaused = false;
    this.liveControlPaused.set(true);
    this.hlsControlTimelineOffsetSeconds = null;
    this.pendingProgrammaticLivePlayToken = null;
    const video = this.liveVideo?.nativeElement;
    if (video) {
      this.pauseLiveVideoSilently(video);
      this.resetUserLivePlaybackRate(video);
      video.removeAttribute('src');
      video.load();
    }
  }

  private beginLiveTransportTransition(target: HarborAssistantLiveTransport): void {
    this.resetLiveTransitionRevealWait();
    this.liveTransitionToken += 1;
    this.liveTransitionTarget = target;
    if (this.liveTransitionFrameVisible()) {
      return;
    }

    const video = this.liveVideo?.nativeElement;
    const canvas = this.liveTransitionFrame?.nativeElement;
    if (
      !video
      || !canvas
      || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      || video.videoWidth <= 0
      || video.videoHeight <= 0
    ) {
      this.liveTransitionTarget = null;
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      this.liveTransitionTarget = null;
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.liveTransitionFrameVisible.set(true);
    } catch {
      this.liveTransitionTarget = null;
      this.liveTransitionFrameVisible.set(false);
    }
  }

  private scheduleLiveTransportFrameReveal(): void {
    const target = this.liveTransitionTarget;
    const video = this.liveVideo?.nativeElement;
    if (
      !this.liveTransitionFrameVisible()
      || !target
      || !video
      || this.currentLiveTransport() !== target
      || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      || this.liveTransitionFrameCallbackId !== null
      || this.liveTransitionRevealTimer !== null
    ) {
      return;
    }

    const token = this.liveTransitionToken;
    const frameVideo = video as HTMLVideoElement & HarborAssistantVideoFrameCallbacks;
    const revealFrame = (): void => this.completeLiveTransportTransition(token, target);
    if (typeof frameVideo.requestVideoFrameCallback === 'function') {
      this.liveTransitionFrameCallbackVideo = frameVideo;
      this.liveTransitionFrameCallbackId = frameVideo.requestVideoFrameCallback(revealFrame);
    }
    this.liveTransitionRevealTimer = globalThis.setTimeout(
      revealFrame,
      typeof frameVideo.requestVideoFrameCallback === 'function'
        ? this.liveTransitionFallbackRevealDelayMs
        : this.liveTransitionPaintDelayMs,
    );
  }

  private completeLiveTransportTransition(token: number, target: HarborAssistantLiveTransport): void {
    if (
      token !== this.liveTransitionToken
      || target !== this.liveTransitionTarget
      || target !== this.currentLiveTransport()
    ) {
      return;
    }
    this.resetLiveTransitionRevealWait();
    this.liveTransitionTarget = null;
    this.liveTransitionFrameVisible.set(false);
  }

  private cancelLiveTransportTransition(): void {
    this.liveTransitionToken += 1;
    this.resetLiveTransitionRevealWait();
    this.liveTransitionTarget = null;
    this.liveTransitionFrameVisible.set(false);
  }

  private resetLiveTransitionRevealWait(): void {
    const callbackVideo = this.liveTransitionFrameCallbackVideo;
    const callbackId = this.liveTransitionFrameCallbackId;
    this.liveTransitionFrameCallbackVideo = null;
    this.liveTransitionFrameCallbackId = null;
    if (callbackVideo && callbackId !== null && typeof callbackVideo.cancelVideoFrameCallback === 'function') {
      callbackVideo.cancelVideoFrameCallback(callbackId);
    }
    if (this.liveTransitionRevealTimer !== null) {
      globalThis.clearTimeout(this.liveTransitionRevealTimer);
      this.liveTransitionRevealTimer = null;
    }
  }

  private currentLiveTransport(): HarborAssistantLiveTransport {
    return this.liveControlPlaybackMode() === 'webrtc' ? 'webrtc' : 'hls';
  }

  private startLiveEdgeMonitor(): void {
    this.stopLiveEdgeMonitor();
    this.liveEdgeMonitor = this.window.setInterval(() => {
      if (this.hlsLiveStatus() !== 'live') {
        return;
      }
      this.syncLiveControlState();
      if (this.liveControlPlaybackMode() === 'webrtc') {
        return;
      }
      this.seekLiveVideoToEdge();
    }, this.liveEdgeMonitorIntervalMs);
  }

  private stopLiveEdgeMonitor(): void {
    if (this.liveEdgeMonitor === null) {
      return;
    }
    this.window.clearInterval(this.liveEdgeMonitor);
    this.liveEdgeMonitor = null;
  }

  private seekLiveVideoToEdge(force = false): void {
    const video = this.liveVideo?.nativeElement;
    const liveEdge = video ? this.liveVideoEdgeSeconds(video) : null;
    if (!video || liveEdge === null) {
      return;
    }
    if (this.livePlaybackUserPaused) {
      this.restoreUserLivePlaybackAnchor(video);
      this.applyUserLivePlaybackRate(video);
      return;
    }
    if (this.livePlaybackUserDelayed) {
      if (
        this.userLivePlaybackRateIsCatchingUp()
        && this.returnLivePlaybackToWebRtcAfterCatchUp(video)
      ) {
        return;
      }
      this.applyUserLivePlaybackRate(video);
      return;
    }

    const targetTime = this.liveVideoTargetSeconds(liveEdge);
    const driftSeconds = liveEdge - video.currentTime;
    const targetDriftSeconds = liveEdge - targetTime;
    if (force || driftSeconds > this.liveEdgeMaxDriftSeconds) {
      this.setLiveVideoCurrentTime(video, targetTime);
      this.setLiveVideoPlaybackRate(video, this.defaultLivePlaybackRate);
      this.syncLiveControlState();
      return;
    }
    this.setLiveVideoPlaybackRate(video, driftSeconds > targetDriftSeconds + 4 ? 1.05 : 1);
    this.syncLiveControlState();
  }

  private syncLiveControlState(): void {
    const video = this.liveVideo?.nativeElement;
    if (!video) {
      return;
    }
    const sessionElapsed = this.liveSessionElapsedSeconds();
    if (this.liveControlPlaybackMode() === 'webrtc') {
      this.liveControlStartTime.set(0);
      this.liveControlEndTime.set(sessionElapsed);
      this.liveControlCurrentTime.set(
        video.paused && this.webrtcPauseTimelineSeconds !== null
          ? this.webrtcPauseTimelineSeconds
          : sessionElapsed,
      );
      this.liveControlPaused.set(video.paused);
      this.liveControlPlaybackRate.set(
        video.paused ? this.userLivePlaybackRate : this.defaultLivePlaybackRate,
      );
      this.liveControlMuted.set(video.muted);
      this.liveControlVolume.set(video.volume);
      return;
    }
    const liveEdge = this.liveVideoEdgeSeconds(video);
    const seekableStart = video.seekable?.length > 0 ? video.seekable.start(0) : 0;
    const normalizedLiveEdge = liveEdge ?? (Number.isFinite(video.duration) ? video.duration : 0);
    const timelineOffset = this.hlsControlTimelineOffset(sessionElapsed, liveEdge);
    const controlStart = Math.max(0, (Number.isFinite(seekableStart) ? seekableStart : 0) + timelineOffset);
    const controlEnd = liveEdge === null ? normalizedLiveEdge : sessionElapsed;
    const controlCurrent = Number.isFinite(video.currentTime)
      ? video.currentTime + timelineOffset
      : controlStart;
    this.liveControlStartTime.set(controlStart);
    this.liveControlEndTime.set(controlEnd);
    this.liveControlCurrentTime.set(Math.min(controlEnd, Math.max(controlStart, controlCurrent)));
    this.liveControlPaused.set(video.paused);
    this.liveControlPlaybackRate.set(video.playbackRate);
    this.liveControlMuted.set(video.muted);
    this.liveControlVolume.set(video.volume);
  }

  private hlsControlTimelineOffset(sessionElapsed: number, liveEdge: number | null): number {
    if (liveEdge === null) {
      return 0;
    }
    if (this.hlsControlTimelineOffsetSeconds === null) {
      // Media time advances continuously, while the HLS live edge jumps when a fragment is appended.
      // Prewarmed media can start before the user-visible timeline, so the stable mapping may be negative.
      this.hlsControlTimelineOffsetSeconds = sessionElapsed - liveEdge;
    }
    return this.hlsControlTimelineOffsetSeconds;
  }

  private resetLivePlaybackUserPause(): void {
    this.livePlaybackBackgroundPaused = false;
    this.livePlaybackUserPaused = false;
    this.livePlaybackUserDelayed = false;
    this.userLivePlaybackAnchorSeconds = null;
    this.userLivePlaybackRate = this.defaultLivePlaybackRate;
    this.pendingProgrammaticLivePlayToken = null;
    this.programmaticLiveSeekTargetSeconds = null;
    this.programmaticLivePlaybackRateTarget = null;
    this.webrtcPauseTimelineSeconds = null;
    this.pendingHlsBehindLiveSeconds = null;
  }

  private liveSessionElapsedSeconds(): number {
    if (this.liveTimelineStartedAtEpochSeconds === null) {
      return 0;
    }
    return Math.max(0, (Date.now() / 1_000) - this.liveTimelineStartedAtEpochSeconds);
  }

  private startLiveControlTimeline(): void {
    if (this.liveTimelineStartedAtEpochSeconds !== null) {
      return;
    }
    // Start once on the first playable frame so prewarm and transport setup are not shown as watched time.
    this.liveTimelineStartedAtEpochSeconds = Date.now() / 1_000;
    this.hlsControlTimelineOffsetSeconds = null;
  }

  private resetLiveControlTimeline(): void {
    this.liveTimelineStartedAtEpochSeconds = null;
    this.liveControlStartTime.set(0);
    this.liveControlCurrentTime.set(0);
    this.liveControlEndTime.set(0);
  }

  private resetPlaybackSeekAnchor(): void {
    this.playbackSeekAnchorSeconds = null;
    this.playbackSeekMediaKey = null;
    this.programmaticPlaybackSeekTargetSeconds = null;
  }

  private playbackVideoFromEvent(event: Event): HTMLVideoElement | null {
    return event.target instanceof HTMLVideoElement ? event.target : null;
  }

  private selectedPlaybackMediaKey(): string | null {
    const mediaItem = this.selectedMediaItem();
    if (!mediaItem) {
      return null;
    }
    return [
      this.mediaKind(mediaItem),
      mediaItem.optimistic_key ?? mediaItem.file_path,
      mediaItem.created_at,
    ].join(':');
  }

  private restorePlaybackSeekAnchor(video: HTMLVideoElement | null): void {
    const anchorTime = this.playbackSeekAnchorSeconds;
    if (!video || anchorTime === null || !Number.isFinite(anchorTime)) {
      return;
    }
    if (this.playbackSeekMediaKey !== this.selectedPlaybackMediaKey()) {
      this.resetPlaybackSeekAnchor();
      return;
    }
    if (Math.abs(video.currentTime - anchorTime) <= this.playbackSeekDriftToleranceSeconds) {
      return;
    }
    if (!this.playbackTimeIsAvailable(video, anchorTime)) {
      return;
    }
    this.setPlaybackVideoCurrentTime(video, anchorTime);
  }

  private playbackTimeIsAvailable(video: HTMLVideoElement, seconds: number): boolean {
    if (seconds < 0) {
      return false;
    }
    if (Number.isFinite(video.duration) && video.duration > 0) {
      return seconds <= video.duration + this.playbackSeekDriftToleranceSeconds;
    }
    return this.liveTimeRangeContains(video.seekable, seconds)
      || this.liveTimeRangeContains(video.buffered, seconds);
  }

  private setPlaybackVideoCurrentTime(video: HTMLVideoElement, seconds: number): void {
    this.programmaticPlaybackSeekTargetSeconds = seconds;
    video.currentTime = seconds;
  }

  private consumeProgrammaticPlaybackSeek(video: HTMLVideoElement): boolean {
    const targetTime = this.programmaticPlaybackSeekTargetSeconds;
    if (targetTime === null) {
      return false;
    }
    this.programmaticPlaybackSeekTargetSeconds = null;
    return Math.abs(video.currentTime - targetTime) <= this.playbackSeekDriftToleranceSeconds;
  }

  private hasPendingProgrammaticLivePlayRequest(token?: number): boolean {
    if (token === undefined) {
      return this.pendingProgrammaticLivePlayToken !== null;
    }
    return this.pendingProgrammaticLivePlayToken === token;
  }

  private completeProgrammaticLivePlayRequest(token: number): void {
    if (this.pendingProgrammaticLivePlayToken === token) {
      this.pendingProgrammaticLivePlayToken = null;
    }
  }

  private pauseLiveVideoSilently(video: HTMLVideoElement): void {
    this.suppressLivePauseEvent = true;
    try {
      video.pause();
      this.setLiveVideoPlaybackRate(video, this.defaultLivePlaybackRate);
    } finally {
      this.suppressLivePauseEvent = false;
    }
  }

  private restoreUserLivePlaybackAnchor(video = this.liveVideo?.nativeElement): void {
    const anchorTime = this.userLivePlaybackAnchorSeconds;
    if (!video || anchorTime === null || !Number.isFinite(anchorTime)) {
      return;
    }
    if (Math.abs(video.currentTime - anchorTime) <= this.livePausedTimeDriftToleranceSeconds) {
      return;
    }
    const anchorTimeAvailable = this.liveTimeRangeContains(video.seekable, anchorTime)
      || this.liveTimeRangeContains(video.buffered, anchorTime);
    if (!anchorTimeAvailable) {
      return;
    }
    this.setLiveVideoCurrentTime(video, anchorTime);
  }

  private liveVideoEdgeSeconds(video: HTMLVideoElement): number | null {
    const seekable = video.seekable;
    if (!seekable || seekable.length === 0) {
      return null;
    }
    const liveEdge = seekable.end(seekable.length - 1);
    return Number.isFinite(liveEdge) ? liveEdge : null;
  }

  private liveVideoTargetSeconds(liveEdge: number): number {
    const liveSyncPosition = this.hls?.liveSyncPosition;
    if (typeof liveSyncPosition === 'number' && Number.isFinite(liveSyncPosition)) {
      return Math.min(liveEdge, Math.max(0, liveSyncPosition));
    }
    return Math.max(0, liveEdge - this.liveEdgeFallbackBackoffSeconds);
  }

  private returnLivePlaybackToWebRtcAfterCatchUp(video: HTMLVideoElement): boolean {
    if (this.pendingHlsBehindLiveSeconds !== null) {
      return false;
    }
    const visibleGapSeconds = Math.max(0, this.liveControlEndTime() - this.liveControlCurrentTime());
    if (!Number.isFinite(visibleGapSeconds) || visibleGapSeconds >= this.webRtcHandoffGapSeconds) {
      return false;
    }
    return this.switchLivePlaybackToWebRtc(video);
  }

  private switchLivePlaybackToWebRtc(video: HTMLVideoElement): boolean {
    const session = this.hlsLiveSession();
    if (!session || !this.startWebRtcPlaybackFromSession(session)) {
      return false;
    }
    this.resetLivePlaybackUserPause();
    this.resetUserLivePlaybackRate(video);
    this.hlsLiveError.set(null);
    return true;
  }

  private applyUserLivePlaybackRate(video: HTMLVideoElement): void {
    this.setLiveVideoPlaybackRate(video, this.userLivePlaybackRate);
  }

  private userLivePlaybackRateIsCatchingUp(playbackRate = this.userLivePlaybackRate): boolean {
    return playbackRate > this.defaultLivePlaybackRate + this.livePlaybackRateChangeTolerance;
  }

  private resetUserLivePlaybackRate(video = this.liveVideo?.nativeElement): void {
    this.userLivePlaybackRate = this.defaultLivePlaybackRate;
    if (video) {
      this.setLiveVideoPlaybackRate(video, this.defaultLivePlaybackRate);
    }
  }

  private normalizedLiveVideoCurrentTime(): number | null {
    const currentTime = this.liveVideo?.nativeElement.currentTime;
    return typeof currentTime === 'number' && Number.isFinite(currentTime) ? currentTime : null;
  }

  private normalizedLivePlaybackRate(playbackRate: number): number | null {
    if (!Number.isFinite(playbackRate) || playbackRate <= 0) {
      return null;
    }
    return Math.min(playbackRate, this.maxUserLivePlaybackRate);
  }

  private setLiveVideoCurrentTime(video: HTMLVideoElement, seconds: number): void {
    this.programmaticLiveSeekTargetSeconds = seconds;
    video.currentTime = seconds;
  }

  private setLiveVideoPlaybackRate(video: HTMLVideoElement, playbackRate: number): void {
    const normalizedPlaybackRate = this.normalizedLivePlaybackRate(playbackRate) ?? this.defaultLivePlaybackRate;
    this.programmaticLivePlaybackRateTarget = normalizedPlaybackRate;
    video.playbackRate = normalizedPlaybackRate;
  }

  private consumeProgrammaticLiveSeek(video: HTMLVideoElement): boolean {
    const targetTime = this.programmaticLiveSeekTargetSeconds;
    if (targetTime === null) {
      return false;
    }
    this.programmaticLiveSeekTargetSeconds = null;
    return Math.abs(video.currentTime - targetTime) <= this.livePausedTimeDriftToleranceSeconds;
  }

  private consumeProgrammaticLivePlaybackRate(video: HTMLVideoElement): boolean {
    const targetRate = this.programmaticLivePlaybackRateTarget;
    if (targetRate === null) {
      return false;
    }
    this.programmaticLivePlaybackRateTarget = null;
    return Math.abs(video.playbackRate - targetRate) <= this.livePlaybackRateChangeTolerance;
  }

  private liveTimeRangeContains(ranges: TimeRanges | undefined, seconds: number): boolean {
    if (!ranges) {
      return false;
    }
    for (let index = 0; index < ranges.length; index += 1) {
      if (
        seconds >= ranges.start(index) - this.livePausedTimeDriftToleranceSeconds
        && seconds <= ranges.end(index) + this.livePausedTimeDriftToleranceSeconds
      ) {
        return true;
      }
    }
    return false;
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
