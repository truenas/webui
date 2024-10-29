import { Location } from '@angular/common';
import { Injectable, Injector, Type } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  merge, Observable, Subject, timer,
} from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInComponent } from 'app/modules/slide-ins/slide-in.component';
import { FocusService } from 'app/services/focus.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class SlideInService {
  slideInComponent: SlideInComponent;
  slideInRefMap = new Map<string, SlideInRef<unknown>>();
  /**
   * Emits when any slide in has been closed.
   * Prefer to use slideInClosed$ in slideInRef to tell when an individual slide in is closed.
   */
  readonly onClose$ = new Subject<void>();

  constructor(
    private location: Location,
    private router: Router,
    private focusService: FocusService,
  ) {
    this.closeOnNavigation();
  }

  get isSlideInOpen(): boolean {
    return this.slideInComponent?.isSlideInOpen;
  }

  // TODO: Rework via cdk overlays or something else that would make it easier to use in tests.
  setSlideComponent(slideComponent: SlideInComponent): void {
    this.slideInComponent = slideComponent;
  }

  open<T, D>(
    component: Type<T>,
    params?: { wide?: boolean; data?: D; injector?: Injector },
  ): SlideInRef<T, D> {
    this.slideInRefMap.forEach((ref) => ref.close());

    const slideInRef = this.slideInComponent.openSlideIn<T, D>(component, params);
    this.slideInRefMap.set(slideInRef.id, slideInRef);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe((response?: D) => {
      this.deleteRef(slideInRef.id);
      if (response === undefined) {
        response = null;
      }
      this.onClose$.next(null);
    });

    this.focusService.captureCurrentFocus();
    this.focusOnTheCloseButton();

    return slideInRef;
  }

  closeLast(): void {
    if (!this.isSlideInOpen) {
      return;
    }

    const lastSlideInRef = Array.from(this.slideInRefMap.values()).pop();
    lastSlideInRef.close();
  }

  closeAll(): void {
    if (!this.isSlideInOpen) {
      return;
    }

    this.slideInRefMap.forEach((ref) => ref.close());
  }

  deleteRef(id: string): void {
    this.slideInRefMap.delete(id);

    if (this.isSlideInOpen) {
      this.slideInComponent.closeSlideIn();
    }

    this.focusService.restoreFocus();
  }

  private closeOnNavigation(): void {
    merge(
      new Observable((observer) => {
        this.location.subscribe((event) => {
          observer.next(event);
        });
      }),
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.closeAll();
      });
  }

  private focusOnTheCloseButton(): void {
    timer(100).pipe(take(1)).subscribe(() => this.focusService.focusElementById('ix-close-icon'));
  }
}
