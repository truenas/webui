import { CdkPortalOutlet } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, ElementRef, ViewChild,
} from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'ix-slide-in-container',
  templateUrl: './slide-in-container.component.html',
  styleUrl: './slide-in-container.component.scss',
  standalone: true,
  imports: [
    CdkPortalOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideInContainerComponent {
  @ViewChild(CdkPortalOutlet, { static: true }) portalOutlet!: CdkPortalOutlet;
  constructor(private host: ElementRef<HTMLElement>) {}

  startCloseAnimation(): Observable<void> {
    this.host.nativeElement.classList.add('slide-out');
    return new Observable((subscriber): void => {
      const onAnimationEnd = (): void => {
        this.host.nativeElement.removeEventListener('animationend', onAnimationEnd);
        subscriber.next();
        subscriber.complete();
      };
      this.host.nativeElement.addEventListener('animationend', onAnimationEnd);
    });
  }

  resetAnimation(): void {
    this.host.nativeElement.classList.remove('slide-out');
  }
}
