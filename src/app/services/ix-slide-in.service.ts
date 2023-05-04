import { Location } from '@angular/common';
import { Injectable, Type } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { bindCallback, merge, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IxSlideInComponent } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.component';
import { IxSlideIn2Service } from 'app/services/ix-slide-in2.service';

export interface ResponseOnClose {
  response?: unknown;
  error?: unknown;
  modalType: Type<unknown>;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class IxSlideInService {
  private slideInComponent: IxSlideInComponent;
  private slideInClosed$ = new Subject<ResponseOnClose>();
  modalType: Type<unknown>;

  constructor(
    private location: Location,
    private router: Router,
    private slideIn2Service: IxSlideIn2Service,
  ) {
    this.closeOnNavigation();
  }

  setModal(modal: IxSlideInComponent): void {
    this.slideInComponent = modal;
  }

  open<T>(modal: Type<T>, params?: { wide: boolean }): T {
    this.modalType = modal;
    return this.slideInComponent.openSlideIn(modal, params);
  }

  close(error?: Error, response?: unknown): void {
    if (!this.slideInComponent?.isSlideInOpen) {
      return;
    }

    if (error) {
      this.slideInClosed$.error({
        error,
        modalType: this.modalType,
      });
    }

    this.slideInClosed$.next({
      response: response === undefined ? null : response,
      modalType: this.modalType,
    });

    this.slideInComponent.closeSlideIn();
  }

  get onClose$(): Subject<ResponseOnClose> {
    return this.slideInClosed$;
  }

  private closeOnNavigation(): void {
    merge(
      bindCallback(this.location.subscribe.bind(this.location))(),
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.close();
      });
  }
}
