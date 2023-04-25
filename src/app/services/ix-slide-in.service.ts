import { Location } from '@angular/common';
import { Injectable, Type } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { bindCallback, merge, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import {
  IxSlideInComponent,
} from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.component';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class IxSlideInService {
  private slideInComponent: IxSlideInComponent;
  private slideInClosed$ = new Subject<boolean>();

  constructor(
    private location: Location,
    private router: Router,
  ) {
    this.closeOnNavigation();
  }

  setModal(modal: IxSlideInComponent): void {
    this.slideInComponent = modal;
  }

  open<T, R>(modal: Type<T>, params?: { wide?: boolean; data?: R }): IxSlideInRef<T, R> {
    return this.slideInComponent.openSlideIn<T, R>(modal, params);
  }

  closeAll(): void {
    if (!this.slideInComponent?.isSlideInOpen) {
      return;
    }

    this.slideInClosed$.next(true);
    this.slideInComponent.slideInRefList.forEach((ref) => ref.close());
    this.slideInComponent.slideInRefList = [];
  }

  closeFromHeader(): void {
    this.slideInComponent.close();
  }

  // need remove all subscribers
  get onClose$(): Subject<boolean> {
    return this.slideInClosed$;
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
