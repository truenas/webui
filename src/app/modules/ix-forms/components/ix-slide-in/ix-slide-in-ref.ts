import { Type } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IxSlideInComponent } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.component';

export interface ResponseOnClose {
  response?: unknown;
  error?: unknown;
  modalType: Type<unknown>;
}

export class IxSlideInRef<T> {
  private slideInClosed$ = new Subject<ResponseOnClose>();
  componentInstance: T;
  uuid: string;
  constructor(
    private slideInComponent: IxSlideInComponent,
    private modalType: Type<T>, // ??
  ) {}
  // pass onle object rsponse {data: ... error:...}
  close(error?: Error, response?: unknown): void {
    if (error) {
      this.slideInClosed$.error({
        error,
        modalType: this.modalType, // ??
      });
    }

    this.slideInClosed$.next({
      response: response === undefined ? null : response,
      modalType: this.modalType, // ???
    });

    this.slideInClosed$.complete();
    this.slideInComponent.closeSlideIn(this.uuid);
  }

  afterClosed$(): Observable<ResponseOnClose> { // ? get
    return this.slideInClosed$;
  }
}
