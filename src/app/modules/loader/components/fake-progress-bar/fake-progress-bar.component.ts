import {
  animate, style, transition, trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, input,
  OnChanges,
  OnDestroy, signal,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { interval, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
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
  animations: [
    trigger('fadeOut', [
      transition(':leave', [
        animate('150ms 100ms', style({ opacity: 0 })),
      ]),
    ]),
  ],
  imports: [MatProgressBar],
})
export class FakeProgressBarComponent implements OnChanges, OnDestroy {
  readonly loading = input<boolean>();

  /**
   * Pretend time for the whole progress bar.
   * Will never reach it, getting slower and slower.
   */
  readonly duration = input(1000);

  /**
   * Automatically fades out progress bar when loading becomes false.
   */
  readonly hideOnComplete = input(true);

  protected progress = signal(0);
  protected isAnimating = signal(false);

  private stop = new Subject<void>();
  private readonly redrawTime = 200;

  constructor(
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!('loading' in changes)) {
      return;
    }

    if (this.loading()) {
      this.start();
    } else {
      this.stop.next();
    }
  }

  ngOnDestroy(): void {
    this.stop.next();
  }

  private start(): void {
    this.isAnimating.set(true);
    interval(this.redrawTime).pipe(
      map((sequence) => this.getPercentage(sequence)),
      takeUntil(this.stop),
    ).subscribe({
      next: (progress) => {
        this.progress.set(progress);
      },
      complete: () => {
        this.progress.set(100);
        setTimeout(() => {
          this.isAnimating.set(false);
        });
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
