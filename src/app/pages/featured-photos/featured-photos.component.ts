import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { catchError, lastValueFrom, of, Subscription } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhotoItem {
  id: string;
  media_type: 'photo' | 'video';
  thumbnail_url: string;
  original_url: string;
  date: number | null;
  width: number | null;
  height: number | null;
}

type AppView = 'loading' | 'empty' | 'display' | 'offline';

// ---------------------------------------------------------------------------
// Constants (strictCamelCase per project ESLint config)
// ---------------------------------------------------------------------------

const tokenStorageKey = 'featured_photos_token';
const apiBase = '/featured-photos-api';
const displayDurationMs = 8000;
const crossfadeDurationMs = 1000;
const prefetchThreshold = 3;
const offlineRetryMs = 10000;
const metaVisibleMs = 4000;

// Ken Burns: 6 directions encoded as CSS transform pairs [from, to]
const kenBurnsDirections = [
  ['scale(1.0) translate(0%,0%)', 'scale(1.06) translate(-1%,-1%)'],
  ['scale(1.0) translate(0%,0%)', 'scale(1.06) translate(1%,-1%)'],
  ['scale(1.0) translate(0%,0%)', 'scale(1.06) translate(-1%,1%)'],
  ['scale(1.06) translate(-1%,-1%)', 'scale(1.0)  translate(0%,0%)'],
  ['scale(1.06) translate(1%,-1%)', 'scale(1.0)  translate(0%,0%)'],
  ['scale(1.06) translate(-1%,1%)', 'scale(1.0)  translate(0%,0%)'],
];

@Component({
  selector: 'ix-featured-photos',
  standalone: true,
  imports: [],
  templateUrl: './featured-photos.component.html',
  styleUrls: ['./featured-photos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedPhotosComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private window = inject<Window>(WINDOW);
  private elementRef = inject(ElementRef);

  // --- view state ---
  view = signal<AppView>('loading');

  // --- A/B slot double-buffer for crossfade ---
  // Swapping activeSlot instead of moving photo data avoids DOM recreation,
  // which eliminates the flash-and-restart on <video> and <img> elements.
  protected activeSlot = signal<'a' | 'b'>('a');
  slotA = signal<PhotoItem | null>(null);
  slotB = signal<PhotoItem | null>(null);
  currentPhoto = computed(() => (this.activeSlot() === 'a' ? this.slotA() : this.slotB()));
  nextPhoto = computed(() => (this.activeSlot() === 'a' ? this.slotB() : this.slotA()));
  isCrossfading = signal(false);

  // --- Ken Burns (per-slot so updating the back slot's KB doesn't restart the front animation) ---
  kenBurnsFromA = signal('scale(1.0) translate(0%,0%)');
  kenBurnsToA = signal('scale(1.06) translate(-1%,-1%)');
  kenBurnsFromB = signal('scale(1.0) translate(0%,0%)');
  kenBurnsToB = signal('scale(1.06) translate(-1%,-1%)');
  private lastKbIndex = -1;

  // --- metadata overlay ---
  metaVisible = signal(false);
  currentDate = computed(() => {
    const ts = this.currentPhoto()?.date;
    if (!ts) return null;
    return new Date(ts * 1000).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  });

  // --- video audio state ---
  videoMuted = signal(true);

  // --- video playback state ---
  videoPaused = signal(false);
  videoProgress = signal(0);
  videoRemaining = signal(0);

  videoRemainingFormatted = computed(() => {
    const total = this.videoRemaining();
    const mins = Math.floor(total / 60);
    const sec = String(total % 60).padStart(2, '0');
    return `${mins}:${sec}`;
  });

  // --- queue ---
  private queue: PhotoItem[] = [];
  private isFetching = false;
  private token: string | null = null;
  private mediaUrlCache = new Map<string, SafeUrl>();

  // Play the front-slot video as soon as the active slot flips.
  // Videos are NOT autoplayed in the back slot (preload="auto" buffers them).
  // This effect runs after each signal change, after Angular's render cycle.
  private readonly playFrontVideoEffect = effect(() => {
    const slot = this.activeSlot();
    const photo = this.currentPhoto();
    if (!isPlatformBrowser(this.platformId) || photo?.media_type !== 'video') return;

    // queueMicrotask runs after the current task but before the next macrotask,
    // giving Angular time to flush DOM updates first.
    queueMicrotask(() => {
      const slotEl = (this.elementRef.nativeElement as Element)
        .querySelector<HTMLVideoElement>(`[data-slot="${slot}"] video`);
      if (slotEl && slotEl.paused && !this.videoPaused()) {
        slotEl.play().catch(() => {});
      }
    });
  });

  // --- subscriptions / timers ---
  private subs: Subscription[] = [];
  private displayTimer: ReturnType<typeof setTimeout> | null = null;
  private displayTimerStart: number | null = null;
  private displayTimerRemaining: number | null = null;
  private metaTimer: ReturnType<typeof setTimeout> | null = null;
  private offlineTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const urlToken = this.extractUrlToken();
    if (urlToken) {
      localStorage.setItem(tokenStorageKey, urlToken);
      this.removeTokenFromUrl();
    }

    this.token = localStorage.getItem(tokenStorageKey);
    this.startDisplay();
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
    this.clearTimers();
  }

  // ---------------------------------------------------------------------------
  // Setup helpers
  // ---------------------------------------------------------------------------

  private extractUrlToken(): string | null {
    const params = new URLSearchParams(this.window.location.search);
    return params.get('token');
  }

  private removeTokenFromUrl(): void {
    const url = new URL(this.window.location.href);
    url.searchParams.delete('token');
    this.window.history.replaceState({}, '', url.toString());
  }

  // ---------------------------------------------------------------------------
  // Display loop
  // ---------------------------------------------------------------------------

  private startDisplay(): void {
    this.view.set('loading');
    this.fillQueue().then(() => {
      if (this.queue.length === 0) {
        this.view.set('empty');
        return;
      }
      this.showNext();
    });
  }

  private async fillQueue(): Promise<void> {
    if (this.isFetching || !this.token) return;
    this.isFetching = true;

    try {
      const items = await lastValueFrom(
        this.http
          .get<PhotoItem[]>(`${apiBase}/photos/next?count=20`, {
            headers: new HttpHeaders({ Authorization: `Bearer ${this.token}` }),
          })
          .pipe(catchError(() => of([] as PhotoItem[]))),
      );

      this.queue.push(...(items ?? []));
      if (this.view() === 'offline' && this.queue.length > 0) {
        this.clearOfflineTimer();
        this.showNext();
      }
    } finally {
      this.isFetching = false;
    }
  }

  private showNext(): void {
    if (this.queue.length === 0) {
      this.handleOffline();
      return;
    }

    const photo = this.queue.shift();
    if (!photo) return;

    if (this.queue.length < prefetchThreshold) {
      this.fillQueue();
    }

    this.startCrossfade(photo);

    if (photo.media_type !== 'video') {
      this.scheduleNext(displayDurationMs);
    }
    // Videos advance via the (ended) event on the <video> element.
  }

  private startCrossfade(next: PhotoItem): void {
    let kbIndex = this.kbIndexFromId(next.id);
    if (kbIndex === this.lastKbIndex) {
      kbIndex = (kbIndex + 1) % kenBurnsDirections.length;
    }
    this.lastKbIndex = kbIndex;

    this.videoPaused.set(false);
    this.videoProgress.set(0);

    // Determine which slot is back (will receive the new photo).
    const backSlot = this.activeSlot() === 'a' ? 'b' : 'a';

    // Write KB values and photo into the back slot only — never touches the front slot's DOM.
    if (backSlot === 'a') {
      this.kenBurnsFromA.set(kenBurnsDirections[kbIndex][0]);
      this.kenBurnsToA.set(kenBurnsDirections[kbIndex][1]);
      this.slotA.set(next);
    } else {
      this.kenBurnsFromB.set(kenBurnsDirections[kbIndex][0]);
      this.kenBurnsToB.set(kenBurnsDirections[kbIndex][1]);
      this.slotB.set(next);
    }

    if (!this.currentPhoto()) {
      // First photo — back slot IS the current slot; just flip and show.
      this.activeSlot.set(backSlot);
      this.view.set('display');
      this.showMeta();
      return;
    }

    this.isCrossfading.set(true);

    setTimeout(() => {
      // Flip active slot — the video/image DOM node in backSlot keeps playing uninterrupted.
      this.activeSlot.set(backSlot);
      this.isCrossfading.set(false);
      this.showMeta();
    }, crossfadeDurationMs);
  }

  private showMeta(): void {
    this.metaVisible.set(true);
    if (this.metaTimer) clearTimeout(this.metaTimer);
    this.metaTimer = setTimeout(() => this.metaVisible.set(false), metaVisibleMs);
  }

  // ---------------------------------------------------------------------------
  // Offline handling
  // ---------------------------------------------------------------------------

  private handleOffline(): void {
    this.view.set('offline');
    this.offlineTimer = setTimeout(() => {
      this.fillQueue();
    }, offlineRetryMs);
  }

  private clearOfflineTimer(): void {
    if (this.offlineTimer) {
      clearTimeout(this.offlineTimer);
      this.offlineTimer = null;
    }
  }

  private scheduleNext(duration: number): void {
    if (this.displayTimer !== null) clearTimeout(this.displayTimer);
    this.displayTimerStart = Date.now();
    this.displayTimerRemaining = duration;
    this.displayTimer = setTimeout(() => {
      // Clear state when the timer fires naturally. Otherwise, if the next
      // item is a video (no timer), pause/resume on that video would see
      // stale Start/Remaining values and incorrectly fire scheduleNext(0),
      // skipping the video immediately on unpause.
      this.displayTimer = null;
      this.displayTimerStart = null;
      this.displayTimerRemaining = null;
      this.showNext();
    }, duration);
  }

  private pauseDisplayTimer(): void {
    if (this.displayTimer === null || this.displayTimerStart === null || this.displayTimerRemaining === null) return;
    clearTimeout(this.displayTimer);
    this.displayTimer = null;
    this.displayTimerRemaining = Math.max(0, this.displayTimerRemaining - (Date.now() - this.displayTimerStart));
  }

  private resumeDisplayTimer(): void {
    if (this.displayTimerRemaining !== null) {
      this.scheduleNext(this.displayTimerRemaining);
    }
  }

  private clearTimers(): void {
    if (this.displayTimer) clearTimeout(this.displayTimer);
    if (this.metaTimer) clearTimeout(this.metaTimer);
    this.clearOfflineTimer();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private kbIndexFromId(id: string): number {
    const code = id.charCodeAt(0) || 0;
    return code % kenBurnsDirections.length;
  }

  // All paths are server-generated (/featured-photos-api/media/...) — no user content.
  // Token is appended as a query param so <img>/<video> requests pass auth
  // (they cannot send an Authorization header; the backend accepts ?token=).

  mediaUrl(photo: PhotoItem): SafeUrl {
    const cached = this.mediaUrlCache.get(photo.id);
    if (cached) return cached;
    let url = photo.media_type === 'video' ? photo.original_url : photo.thumbnail_url;
    if (this.token) {
      url += url.includes('?') ? `&token=${this.token}` : `?token=${this.token}`;
    }
    // eslint-disable-next-line sonarjs/no-angular-bypass-sanitization
    const safeUrl = this.sanitizer.bypassSecurityTrustUrl(url);
    this.mediaUrlCache.set(photo.id, safeUrl);
    return safeUrl;
  }

  toggleMute(): void {
    this.videoMuted.set(!this.videoMuted());
  }

  onVolumeChange(event: Event): void {
    const video = event.target as HTMLVideoElement;
    this.videoMuted.set(video.muted);
  }

  toggleVideoPlayPause(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    if (video.paused) {
      video.play();
      this.videoPaused.set(false);
      this.resumeDisplayTimer();
    } else {
      video.pause();
      this.videoPaused.set(true);
      this.pauseDisplayTimer();
    }
  }

  onVideoEnded(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    if (video.closest<HTMLElement>('[data-slot]')?.dataset['slot'] !== this.activeSlot()) return;
    this.showNext();
  }

  onVideoTimeUpdate(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    // Ignore timeupdate from the background (next) slot — it would overwrite
    // progress state for the foreground video that the user is watching.
    if (video.closest<HTMLElement>('[data-slot]')?.dataset['slot'] !== this.activeSlot()) return;
    if (video.duration) {
      this.videoProgress.set(video.currentTime / video.duration);
      this.videoRemaining.set(Math.ceil(video.duration - video.currentTime));
    }
  }

  // Returns a CSS url() string for the blurred background layer.
  // Passed via [style.--bg-url] — Angular treats CSS custom properties as safe
  // (they cannot execute code, unlike style.background-image bindings).
  mediaBgUrl(photo: PhotoItem): string {
    // Always use thumbnail for background; works for both photos and videos.
    let url = photo.thumbnail_url;
    if (this.token) {
      url += url.includes('?') ? `&token=${this.token}` : `?token=${this.token}`;
    }
    return `url(${url})`;
  }
}
