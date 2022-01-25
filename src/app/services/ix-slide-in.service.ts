import { Injectable, Type } from '@angular/core';
import { Subject } from 'rxjs';
import { IxSlideInComponent } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.component';

@Injectable({
  providedIn: 'root',
})
export class IxSlideInService {
  private slideInComponent: IxSlideInComponent;
  private slideInClosed$ = new Subject<unknown>();

  setModal(modal: IxSlideInComponent): void {
    this.slideInComponent = modal;
  }

  open<T>(modal: Type<T>, params?: { wide: boolean }): T {
    return this.slideInComponent.openSlideIn(modal, params);
  }

  close(error?: Error, response?: unknown): void {
    if (error) {
      this.slideInClosed$.error(error);
    }
    this.slideInClosed$.next(response || {});
    this.slideInComponent.closeSlideIn();
  }

  get onClose$(): Subject<unknown> {
    return this.slideInClosed$;
  }
}
