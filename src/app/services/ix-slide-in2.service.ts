import { Location } from '@angular/common';
import { Injectable, Type } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { bindCallback, merge, take } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxSlideIn2Component } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in2.component';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class IxSlideIn2Service {
  slideIn2Component: IxSlideIn2Component;
  slideInRefMap = new Map<string, IxSlideInRef<unknown>>();

  constructor(
    private location: Location,
    private router: Router,
  ) {
    this.closeOnNavigation();
  }

  get isSlideInOpen(): boolean {
    return this.slideIn2Component?.isSlideInOpen;
  }

  setSlideComponent(slideComponent: IxSlideIn2Component): void {
    this.slideIn2Component = slideComponent;
  }

  open<T, D>(component: Type<T>, params?: { wide?: boolean; data?: D }): IxSlideInRef<T, D> {
    this.slideInRefMap.forEach((ref) => ref.close());
    this.slideInRefMap.clear();

    const slideInRef = this.slideIn2Component.openSlideIn<T, D>(component, params);
    this.slideInRefMap.set(slideInRef.id, slideInRef);
    slideInRef.onClose$.pipe(take(1), untilDestroyed(this)).subscribe((id) => {
      this.deleteRef(id);
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
    this.slideInRefMap.clear();
  }

  deleteRef(id: string): void {
    if (this.slideInRefMap.has(id)) {
      this.slideInRefMap.delete(id);
    }

    if (this.isSlideInOpen) {
      this.slideIn2Component.closeSlideIn();
    }
  }

  private closeOnNavigation(): void {
    merge(
      bindCallback(this.location.subscribe.bind(this.location))(),
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.closeAll();
      });
  }
}
