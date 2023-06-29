import { Location } from '@angular/common';
import { Injectable, Type } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { merge, Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxSlideInComponent } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.component';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class IxSlideInService {
  slideInComponent: IxSlideInComponent;
  slideInRefMap = new Map<string, IxSlideInRef<unknown>>();
  /**
   * Emits when any slide in has been closed.
   * Prefer to use slideInClosed$ in slideInRef to tell when an individual slide in is closed.
   */
  readonly onClose$ = new Subject<void>();

  constructor(
    private location: Location,
    private router: Router,
  ) {
    this.closeOnNavigation();
  }

  get isSlideInOpen(): boolean {
    return this.slideInComponent?.isSlideInOpen;
  }

  setSlideComponent(slideComponent: IxSlideInComponent): void {
    this.slideInComponent = slideComponent;
  }

  open<T, D>(component: Type<T>, params?: { wide?: boolean; data?: D }): IxSlideInRef<T, D> {
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
    return slideInRef;
  }

  closeLast(): void {
    if (!this.isSlideInOpen) { return; }

    const lastSlideInRef = Array.from(this.slideInRefMap.values()).pop();
    lastSlideInRef.close();
  }

  closeAll(): void {
    if (!this.isSlideInOpen) { return; }

    this.slideInRefMap.forEach((ref) => ref.close());
  }

  deleteRef(id: string): void {
    this.slideInRefMap.delete(id);

    if (this.isSlideInOpen) {
      this.slideInComponent.closeSlideIn();
    }
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
}
