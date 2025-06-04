import {
  animate, keyframes, style, transition, trigger,
  AnimationEvent,
  state,
} from '@angular/animations';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, HostListener, ViewChild,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  Observable, Subject, take,
} from 'rxjs';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

const slideInOutTrigger = trigger('slideInOut', [
  state('visible', style({ transform: 'translateX(0%)' })),
  state('hidden', style({ transform: 'translateX(100%)' })),
  transition('visible => hidden', [
    animate(
      '150ms ease-in',
      keyframes([
        style({ transform: 'translateX(0)', offset: 0 }),
        style({ transform: 'translateX(100%)', offset: 1 }),
      ]),
    ),
  ]),
  transition('hidden => visible', [
    animate(
      '150ms ease-out',
      keyframes([
        style({ transform: 'translateX(100%)', offset: 0 }),
        style({ transform: 'translateX(0)', offset: 1 }),
      ]),
    ),
  ]),
  transition('void => *', [
    animate(
      '150ms ease-out',
      keyframes([
        style({ transform: 'translateX(100%)', offset: 0 }),
        style({ transform: 'translateX(0)', offset: 1 }),
      ]),
    ),
  ]),
]);

@UntilDestroy()
@Component({
  selector: 'ix-slide-in-container',
  templateUrl: './slide-in-container.component.html',
  styleUrl: './slide-in-container.component.scss',
  standalone: true,
  imports: [
    CdkPortalOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [slideInOutTrigger],
})
export class SlideInContainerComponent {
  @ViewChild(CdkPortalOutlet, { static: true }) private readonly portalOutlet!: CdkPortalOutlet;

  private readonly whenHidden$ = new Subject<void>();

  private readonly whenVisible$ = new Subject<void>();

  @HostBinding('@slideInOut') private animationState: 'visible' | 'hidden' = 'visible';
  @HostBinding('style.width') private width = '480px';
  @HostBinding('style.max-width') private maxWidth = '480px';

  @HostListener('@slideInOut.done', ['$event'])
  private onAnimationDone(event: AnimationEvent): void {
    if (event.toState === 'visible') {
      this.whenVisible$.next();
    }
    if (event.toState === 'hidden') {
      this.whenHidden$.next();
    }
  }

  constructor(private cdr: ChangeDetectorRef) {}

  slideOut(): Observable<void> {
    this.animationState = 'hidden';
    this.cdr.markForCheck();
    return this.whenHidden$.pipe(take(1));
  }

  slideIn(): Observable<void> {
    this.animationState = 'visible';
    this.cdr.markForCheck();
    return this.whenVisible$.pipe(take(1));
  }

  makeWide(wide: boolean): void {
    this.width = wide ? '800px' : '480px';
    this.maxWidth = wide ? '800px' : '480px';
    this.cdr.markForCheck();
  }

  detachPortal(): void {
    this.portalOutlet.detach();
  }

  attachPortal<D, R>(portal: ComponentPortal<{
    slideInRef: SlideInRef<D, R>;
  }>): void {
    this.portalOutlet.attach(portal);
  }
}
