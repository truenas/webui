import { Injectable, Type } from '@angular/core';
import { Subject } from 'rxjs';
import { IxModalComponent } from 'app/pages/common/ix-forms/components/ix-modal/ix-modal.component';

@Injectable({
  providedIn: 'root',
})
export class IxModalService {
  private modalComponent: IxModalComponent;
  private modalClosed$ = new Subject<unknown>();

  setModal(modal: IxModalComponent): void {
    this.modalComponent = modal;
  }

  open<T>(modal: Type<T>, title: string): T {
    return this.modalComponent.openModal(modal, title);
  }

  close(error?: Error, response?: unknown): void {
    if (error) {
      this.modalClosed$.error(error);
    }
    this.modalClosed$.next(response || {});
    this.modalComponent.closeModal();
  }

  get onClose$(): Subject<unknown> {
    return this.modalClosed$;
  }
}
