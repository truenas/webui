import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';

export type HarborAssistantLivePlaybackMode = 'webrtc' | 'hls-timeshift' | 'hls-fallback';

@Component({
  selector: 'ix-harbor-assistant-live-controls',
  templateUrl: './harbor-assistant-live-controls.component.html',
  styleUrl: './harbor-assistant-live-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, TnIconComponent],
})
export class HarborAssistantLiveControlsComponent {
  readonly currentTime = input(0);
  readonly endTime = input(0);
  readonly fullscreenTarget = input<HTMLElement | null>(null);
  readonly muted = input(true);
  readonly paused = input(true);
  readonly playbackMode = input<HarborAssistantLivePlaybackMode>('hls-fallback');
  readonly playbackRate = input(1);
  readonly startTime = input(0);
  readonly volume = input(1);

  readonly mutedChange = output<boolean>();
  readonly playbackRateChange = output<number>();
  readonly playbackToggle = output();
  readonly seekRequested = output<number>();
  readonly volumeChange = output<number>();

  protected readonly menuOpen = signal(false);
  protected readonly pendingSeek = signal<number | null>(null);
  protected readonly playbackRates = [0.25, 0.5, 1, 1.5, 2, 4];
  protected readonly displayedCurrentTime = computed(() => this.pendingSeek() ?? this.currentTime());
  protected readonly sliderMaximum = computed(() => Math.max(this.endTime(), this.startTime() + 0.01));
  protected readonly sliderValue = computed(() => {
    return Math.min(this.sliderMaximum(), Math.max(this.startTime(), this.displayedCurrentTime()));
  });

  protected onSeekInput(event: Event): void {
    const value = this.numberFromInputEvent(event);
    if (value !== null) {
      this.pendingSeek.set(value);
    }
  }

  protected commitSeek(event: Event): void {
    const value = this.numberFromInputEvent(event) ?? this.pendingSeek();
    this.pendingSeek.set(null);
    if (value !== null) {
      this.seekRequested.emit(value);
    }
  }

  protected selectPlaybackRate(rate: number): void {
    this.menuOpen.set(false);
    this.playbackRateChange.emit(rate);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  protected toggleMute(): void {
    this.mutedChange.emit(!this.muted());
  }

  protected updateVolume(event: Event): void {
    const value = this.numberFromInputEvent(event);
    if (value !== null) {
      this.volumeChange.emit(Math.min(1, Math.max(0, value)));
    }
  }

  protected toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((): undefined => undefined);
      return;
    }
    const target = this.fullscreenTarget();
    if (target?.requestFullscreen) {
      target.requestFullscreen().catch((): undefined => undefined);
    }
  }

  protected formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const wholeSeconds = Math.floor(seconds);
    const hours = Math.floor(wholeSeconds / 3600);
    const minutes = Math.floor((wholeSeconds % 3600) / 60);
    const remainder = wholeSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainder.toString().padStart(2, '0')}`;
  }

  private numberFromInputEvent(event: Event): number | null {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return null;
    }
    const value = Number(target.value);
    return Number.isFinite(value) ? value : null;
  }
}
