import { Location } from '@angular/common';
import { Injectable, Type } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { bindCallback, merge, Subject } from 'rxjs';
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
  closeEvent$ = new Subject<boolean>();

  constructor(
    private location: Location,
    private router: Router,
  ) {
    this.closeOnNavigation();
    this.closeEvent$.pipe(untilDestroyed(this)).subscribe(() => {
      this.closeLast();
    });
  }

  get isSlideInOpen(): boolean {
    return this.slideIn2Component?.isSlideInOpen;
  }

  setSlideComponent(slideComponent: IxSlideIn2Component): void {
    this.slideIn2Component = slideComponent;
  }

  open<T, R>(component: Type<T>, params?: { wide?: boolean; data?: R }): IxSlideInRef<T, R> {
    this.slideInRefMap.forEach((ref) => ref.close());
    this.slideInRefMap.clear();

    const slideInRef = this.slideIn2Component.openSlideIn<T, R>(component, params);
    this.slideInRefMap.set(slideInRef.id, slideInRef);

    return slideInRef;
  }

  private closeLast(): void {
    if (!this.isSlideInOpen) { return; }

    const lastSlideInRef = Array.from(this.slideInRefMap.values()).pop();
    lastSlideInRef.close();
  }

  closeAll(): void {
    if (!this.isSlideInOpen) { return; }

    this.slideInRefMap.forEach((ref) => ref.close());
    this.slideInRefMap.clear();
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
