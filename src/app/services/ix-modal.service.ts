import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IxModal } from 'app/pages/common/ix/components/ix-modal/ix-modal.class';
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

  open(modal: IxModal): void {
    this.modalComponent.openModal(modal);
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
