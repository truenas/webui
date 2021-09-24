import { Component, Injectable, Type } from '@angular/core';
import { Subject } from 'rxjs';
import { IxModalComponent } from 'app/pages/common/ix/components/ix-modal/ix-modal.component';

@Injectable()
export class IxModalService {
  private modalComponent: IxModalComponent;
  private modalClosed$ = new Subject();
  currentTime: Date = new Date();

  setModal(modal: IxModalComponent): void {
    // add modal to array of active modals
    this.modalComponent = modal;
  }

  open<T>(modal: Type<T>, title: string): Component {
    return this.modalComponent.openModal(modal, title);
  }

  close(error?: Error, response?: any): void {
    if (error) {
      this.modalClosed$.error(error);
    }
    this.modalClosed$.next(response || {});
    this.modalComponent.closeModal();
  }

  get onClose(): Subject<any> {
    return this.modalClosed$;
  }
}
