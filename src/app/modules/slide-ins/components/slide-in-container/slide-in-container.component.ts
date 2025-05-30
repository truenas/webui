import {
  animate, keyframes, style, transition, trigger,
  AnimationEvent,
} from '@angular/animations';
import { CdkPortalOutlet } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, HostListener, ViewChild,
} from '@angular/core';
import { Observable, Subject, take } from 'rxjs';

const enterTransition = transition(':enter', [
  animate(
    '150ms ease-out',
    keyframes([
      style({ transform: 'translateX(100%)', offset: 0 }),
      style({ transform: 'translateX(0)', offset: 1 }),
    ]),
  ),
]);

const leaveTransition = transition(':leave', [
  animate(
    '150ms ease-in',
    keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(100%)', offset: 1 }),
    ]),
  ),
]);

@Component({
  selector: 'ix-slide-in-container',
  templateUrl: './slide-in-container.component.html',
  styleUrl: './slide-in-container.component.scss',
  standalone: true,
  imports: [
    CdkPortalOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideInOut', [
      enterTransition,
      leaveTransition,
    ]),
  ],
})
export class SlideInContainerComponent {
  @ViewChild(CdkPortalOutlet, { static: true }) readonly portalOutlet!: CdkPortalOutlet;
  private animationDone$ = new Subject<void>();

  @HostBinding('@slideInOut') private animationState = 'in';
  @HostBinding('style.width') private width = '750px';
  @HostBinding('style.max-width') private maxWidth = '750px';

  @HostListener('@slideInOut.done', ['$event'])
  private onAnimationDone(event: AnimationEvent): void {
    if (event.toState === 'void') {
      this.animationDone$.next();
      this.animationState = 'in';
    }
  }

  constructor(private cdr: ChangeDetectorRef) {}

  animateClose(): Observable<void> {
    this.animationState = 'void';
    this.cdr.markForCheck();
    return this.animationDone$.asObservable().pipe(take(1));
  }

  makeWide(wide: boolean): void {
    this.width = wide ? '900px' : '500px';
    this.maxWidth = wide ? '900px' : '500px';
    this.cdr.markForCheck();
  }
}
