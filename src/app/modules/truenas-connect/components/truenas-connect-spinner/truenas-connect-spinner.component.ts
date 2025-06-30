import {
  ChangeDetectionStrategy, Component, OnDestroy, AfterViewInit,
} from '@angular/core';

@Component({
  selector: 'ix-truenas-connect-spinner',
  standalone: true,
  templateUrl: './truenas-connect-spinner.component.html',
  styleUrl: './truenas-connect-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectSpinnerComponent implements AfterViewInit, OnDestroy {
  private animationFrameId: number;

  ngAfterViewInit(): void {
    this.startAnimation();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private startAnimation(): void {
    const paths = document.querySelectorAll('.tnc-spinner path.exploded');
    if (!paths.length) return;

    const duration = 300;
    const delayStep = 500;
    const cyclePause = 1200;

    const progressLoop = (): void => {
      paths.forEach((path) => {
        const svgPath = path as SVGPathElement;
        // Use a default length if getTotalLength is not available (e.g., in tests)
        const length = svgPath.getTotalLength ? svgPath.getTotalLength() : 200;
        svgPath.style.strokeDasharray = `${length}`;
        svgPath.style.strokeDashoffset = `${length}`;
      });

      let startTime: number;

      const draw = (timestamp: number): void => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        let allDone = true;

        paths.forEach((path, index) => {
          const svgPath = path as SVGPathElement;
          const delay = index * delayStep;
          const length = svgPath.getTotalLength ? svgPath.getTotalLength() : 200;

          if (elapsed < delay) {
            allDone = false;
            return;
          }

          const progress = Math.min((elapsed - delay) / duration, 1);
          svgPath.style.strokeDashoffset = `${this.tween(length, 0, progress)}`;

          if (progress < 1) {
            allDone = false;
          }
        });

        if (!allDone) {
          this.animationFrameId = requestAnimationFrame(draw);
        } else {
          setTimeout(() => {
            progressLoop();
          }, cyclePause);
        }
      };

      this.animationFrameId = requestAnimationFrame(draw);
    };

    progressLoop();
  }

  private tween(from: number, to: number, progress: number): number {
    return from + (to - from) * progress;
  }
}
