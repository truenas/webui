import { Location } from '@angular/common';
import { Injectable, Type } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { bindCallback, merge } from 'rxjs';
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
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.deleteRef(slideInRef.id);
    });
    return slideInRef;
  }

  closeLast(response?: unknown): void {
    if (!this.isSlideInOpen) { return; }

    const lastSlideInRef = Array.from(this.slideInRefMap.values()).pop();
    lastSlideInRef.close(response);
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
      bindCallback(this.location.subscribe.bind(this.location))(),
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.closeAll();
      });
  }
}
