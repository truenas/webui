import {
  ChangeDetectionStrategy,
  Component, input,
  OnChanges,
  OnDestroy, signal,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { interval, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AnimateOutDirective } from 'app/directives/animate-out/animate-out.directive';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';

/**
 * Show a bar that will show like it's doing something
 * and never complete until [loading] is set to false again.
 */
@Component({
  selector: 'ix-fake-progress-bar',
  templateUrl: './fake-progress-bar.component.html',
  styleUrls: ['./fake-progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressBar, AnimateOutDirective],
})
export class FakeProgressBarComponent implements OnChanges, OnDestroy {
  readonly loading = input<boolean>();

  /**
   * Pretend time for the whole progress bar.
   * Will never reach it, getting slower and slower.
   */
  readonly duration = input(1000);

  protected progress = signal(0);
  protected isAnimating = signal(false);
  protected shouldFadeOut = signal(false);
  protected isVisible = signal(false);

  private stop = new Subject<void>();
  private readonly redrawTime = 200;

  /**
   * Don't show progress bar immediately when loading becomes true.
   */
  private readonly gracePeriod = 200;

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!('loading' in changes)) {
      return;
    }

    if (this.loading()) {
      this.startAnimating();
    } else {
      this.stopAnimating();
    }
  }

  ngOnDestroy(): void {
    this.stop.next();
  }

  protected onFadeOutComplete(): void {
    this.isAnimating.set(false);
    this.isVisible.set(false);
  }

  private startAnimating(): void {
    this.shouldFadeOut.set(false);

    // Wait for grace period.
    setTimeout(() => {
      if (this.loading()) {
        this.start();
      }
    }, this.gracePeriod);
  }

  private stopAnimating(): void {
    this.stop.next();
    this.shouldFadeOut.set(true);
  }

  private start(): void {
    this.isAnimating.set(true);
    this.isVisible.set(true);
    interval(this.redrawTime).pipe(
      map((sequence) => this.getPercentage(sequence)),
      takeUntil(this.stop),
    ).subscribe({
      next: (progress) => {
        this.progress.set(progress);
      },
      complete: () => {
        this.progress.set(100);
        this.isAnimating.set(false);
      },
    });
  }

  private getPercentage(sequence: number): number {
    if (sequence === 0) {
      return 0;
    }

    const timeElapsed = this.redrawTime * sequence;
    const scale = this.duration();

    return 100 * timeElapsed / (timeElapsed + scale);
  }
}
