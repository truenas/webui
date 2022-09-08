import { PlatformLocation } from '@angular/common';
import { Injectable, Type } from '@angular/core';
import { Subject } from 'rxjs';
import { IxSlideInComponent } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.component';

export interface ResponseOnClose {
  response?: unknown;
  error?: unknown;
  modalType: Type<unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class IxSlideInService {
  private slideInComponent: IxSlideInComponent;
  private slideInClosed$ = new Subject<ResponseOnClose>();
  modalType: Type<unknown>;

  constructor(private location: PlatformLocation) {
    this.location.onPopState(() => this.close());
  }

  setModal(modal: IxSlideInComponent): void {
    this.slideInComponent = modal;
  }

  open<T>(modal: Type<T>, params?: { wide: boolean }): T {
    this.modalType = modal;
    return this.slideInComponent.openSlideIn(modal, params);
  }

  close(error?: Error, response?: unknown): void {
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
}
