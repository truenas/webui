import { Location } from '@angular/common';
import { Injectable, Type } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { bindCallback, merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxSlideIn2Component } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in2.component';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class IxSlideIn2Service {
  private slideIn2Component: IxSlideIn2Component;
  slideInRefList: IxSlideInRef<unknown>[] = [];

  constructor(
    private location: Location,
    private router: Router,
  ) {
    this.closeOnNavigation();
  }

  setModal(modal: IxSlideIn2Component): void {
    this.slideIn2Component = modal;
  }

  open<T, R>(modal: Type<T>, params?: { wide?: boolean; data?: R }): IxSlideInRef<T, R> {
    this.slideInRefList.forEach((ref) => ref.close());
    this.slideInRefList = [];
    const slideInRef = this.slideIn2Component.openSlideIn<T, R>(modal, params);
    this.slideInRefList.push(slideInRef);

    return slideInRef;
  }

  close(): void {
    if (!this.slideIn2Component?.isSlideInOpen) {
      return;
    }
    this.slideIn2Component.slideInRefClose();
  }

  closeAll(): void {
    if (!this.slideIn2Component?.isSlideInOpen) {
      return;
    }

    this.slideInRefList.forEach((ref) => ref.close());
    this.slideInRefList = [];
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
