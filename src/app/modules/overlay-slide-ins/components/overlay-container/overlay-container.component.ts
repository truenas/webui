import { CdkPortalOutlet } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, ElementRef, ViewChild,
} from '@angular/core';

@Component({
  selector: 'ix-overlay-container',
  templateUrl: './overlay-container.component.html',
  styleUrl: './overlay-container.component.scss',
  standalone: true,
  imports: [
    CdkPortalOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayContainerComponent {
  @ViewChild(CdkPortalOutlet, { static: true }) portalOutlet!: CdkPortalOutlet;
  constructor(private host: ElementRef<HTMLElement>) {}

  startCloseAnimation(): Promise<void> {
    this.host.nativeElement.classList.add('slide-out');

    return new Promise((resolve): void => {
      const onAnimationEnd = (): void => {
        this.host.nativeElement.removeEventListener('animationend', onAnimationEnd);
        resolve();
      };
      this.host.nativeElement.addEventListener('animationend', onAnimationEnd);
    });
  }

  resetAnimation(): void {
    this.host.nativeElement.classList.remove('slide-out');
  }
}
