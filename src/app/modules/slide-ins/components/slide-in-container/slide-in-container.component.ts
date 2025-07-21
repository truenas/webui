import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  HostListener,
  Inject,
  ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  debounceTime,
  Observable, Subject, take,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

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
})
export class SlideInContainerComponent implements AfterViewInit {
  @ViewChild(CdkPortalOutlet, { static: true }) private readonly portalOutlet!: CdkPortalOutlet;

  private readonly whenHidden$ = new Subject<void>();
  private readonly whenVisible$ = new Subject<void>();
  private readonly resizeSubject$ = new Subject<void>();

  @HostBinding('class.slide-in-visible') private isVisible = false;
  @HostBinding('class.slide-in-hidden') private isHidden = true;
  @HostBinding('style.width') private width = '480px';
  @HostBinding('style.max-width') private maxWidth = '480px';
  private isWide = false;

  @HostListener('transitionend', ['$event'])
  private onTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName === 'transform') {
      if (this.isVisible && !this.isHidden) {
        this.whenVisible$.next();
      }
      if (this.isHidden && !this.isVisible) {
        this.whenHidden$.next();
      }
    }
  }

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngAfterViewInit(): void {
    this.resizeSubject$.pipe(
      debounceTime(100),
      untilDestroyed(this),
    ).subscribe(() => this.updateWidth());

    // Trigger entrance animation after view is initialized
    setTimeout(() => {
      this.slideIn();
    });
  }

  slideOut(): Observable<void> {
    this.isVisible = false;
    this.isHidden = true;
    this.cdr.markForCheck();
    return this.whenHidden$.pipe(take(1));
  }

  slideIn(): Observable<void> {
    this.isVisible = true;
    this.isHidden = false;
    this.cdr.markForCheck();
    return this.whenVisible$.pipe(take(1));
  }

  @HostListener('window:resize')
  private onResize(): void {
    this.resizeSubject$.next();
  }

  private updateWidth(): void {
    const baseWidth = this.isWide ? 800 : 480;
    const computedWidth = this.window.innerWidth <= baseWidth ? '100vw' : `${baseWidth}px`;
    this.width = computedWidth;
    this.maxWidth = computedWidth;
    this.cdr.markForCheck();
  }

  makeWide(wide: boolean): void {
    this.isWide = wide;
    this.updateWidth();
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
