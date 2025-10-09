import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostBinding, HostListener, ViewChild, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  debounceTime, fromEvent,
  Observable, of, Subject, Subscription, take, timeout,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { FocusService } from 'app/services/focus.service';

@UntilDestroy()
@Component({
  selector: 'ix-slide-in-container',
  templateUrl: './slide-in-container.component.html',
  styleUrl: './slide-in-container.component.scss',
  standalone: true,
  imports: [
    CdkPortalOutlet,
    CdkTrapFocus,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideInContainerComponent implements AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private window = inject<Window>(WINDOW);
  private elementRef = inject(ElementRef);
  private focusService = inject(FocusService);
  private document = inject(DOCUMENT);

  @ViewChild(CdkPortalOutlet, { static: true }) private readonly portalOutlet!: CdkPortalOutlet;

  private readonly whenHidden$ = new Subject<void>();
  private readonly whenVisible$ = new Subject<void>();
  private readonly resizeSubject$ = new Subject<void>();
  private keydownSubscription?: Subscription;
  private slideInRef?: SlideInRef<unknown, unknown>;

  @HostBinding('class.slide-in-visible') private isVisible = false;
  @HostBinding('class.slide-in-hidden') private isHidden = true;
  @HostBinding('style.width') private width = '480px';
  @HostBinding('style.max-width') private maxWidth = '480px';
  private isWide = false;

  @HostListener('transitionend', ['$event'])
  private onTransitionEnd(event: TransitionEvent): void {
    // Only handle events that originated from this element, not from children
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.propertyName === 'transform') {
      if (this.isVisible && !this.isHidden) {
        this.whenVisible$.next();
      }
      if (this.isHidden && !this.isVisible) {
        this.whenHidden$.next();
      }
    }
  }

  ngAfterViewInit(): void {
    this.resizeSubject$.pipe(
      debounceTime(100),
      untilDestroyed(this),
    ).subscribe(() => this.updateWidth());

    // Start with hidden state (already set by default)
    // Double requestAnimationFrame ensures proper rendering sequence:
    // 1st frame: DOM updates and layout calculations complete
    // 2nd frame: Style/transform changes can safely trigger CSS transitions
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.slideIn();
      });
    });
  }

  slideOut(): Observable<void> {
    // Set state immediately to prevent race conditions
    this.isVisible = false;
    this.isHidden = true;
    this.cdr.markForCheck();
    this.removeKeydownListener();

    // Add timeout fallback in case transition doesn't fire
    return this.whenHidden$.pipe(
      take(1),
      // Fallback after 300ms (150ms transition + buffer)
      timeout({ first: 300, with: () => of(undefined) }),
    );
  }

  slideIn(): Observable<void> {
    // Set state immediately to prevent race conditions
    this.isVisible = true;
    this.isHidden = false;
    this.cdr.markForCheck();

    // Add timeout fallback in case transition doesn't fire
    const slideIn$ = this.whenVisible$.pipe(
      take(1),
      // Fallback after 300ms (150ms transition + buffer)
      timeout({ first: 300, with: () => of(undefined) }),
    );

    slideIn$.pipe(untilDestroyed(this)).subscribe(() => {
      this.focusFirstElement();
      this.addKeydownListener();
    });

    return slideIn$;
  }

  private focusFirstElement(): void {
    requestAnimationFrame(() => {
      const container = this.elementRef.nativeElement as HTMLElement;

      // Try multiple selectors in order of preference
      const closeButton = container.querySelector<HTMLElement>(
        '#ix-close-icon, [aria-label*="Close"], [aria-label*="close"], .close-button, button[data-close]',
      ) || container.querySelector<HTMLElement>('button[type="button"]:last-of-type');

      if (closeButton) {
        closeButton.focus();
      } else {
        this.focusService.focusFirstFocusableElement(container);
      }
    });
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
    const componentRef = this.portalOutlet.attach(portal);
    if (componentRef && 'instance' in componentRef && 'slideInRef' in componentRef.instance) {
      this.slideInRef = (componentRef.instance as { slideInRef: SlideInRef<D, R> }).slideInRef;
    }
  }

  private addKeydownListener(): void {
    this.removeKeydownListener();

    this.keydownSubscription = fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(untilDestroyed(this))
      .subscribe((event) => {
        if (event.key === 'Escape' && this.slideInRef) {
          if (event.defaultPrevented) {
            return;
          }

          this.slideInRef.close({ response: false, error: undefined });
        }
      });
  }

  private removeKeydownListener(): void {
    this.keydownSubscription?.unsubscribe();
    this.keydownSubscription = undefined;
  }
}
