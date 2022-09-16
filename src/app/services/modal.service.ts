import { PlatformLocation } from '@angular/common';
import {
  ComponentFactoryResolver, Injectable, Injector, Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import { ModalConfiguration } from 'app/modules/common/modal/modal-configuration.interface';
import { ModalComponent } from 'app/modules/common/modal/modal.component';

export interface ModalServiceMessage {
  action: string;
  component: string;
  row: number;
}

export const slideInModalId = 'slide-in-form';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private modals: ModalComponent[] = [];

  private modalTypeOpenedInSlideIn: Type<unknown> = null;
  readonly refreshTable$ = new Subject<void>();
  readonly onClose$ = new Subject<{ modalType?: Type<unknown>; response: unknown }>();
  refreshForm$ = new Subject<void>();
  getRow$ = new Subject();
  message$ = new Subject<ModalServiceMessage>();

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private location: PlatformLocation,
  ) {
    this.location.onPopState(() => this.closeSlideIn());
  }

  refreshTable(): void {
    this.refreshTable$.next();
  }

  refreshForm(): void {
    this.refreshForm$.next();
  }

  message(message: ModalServiceMessage): void {
    this.message$.next(message);
  }

  add(modal: ModalComponent): void {
    // add modal to array of active modals
    this.modals.push(modal);
  }

  remove(id: string): void {
    // remove modal from array of active modals
    this.modals = this.modals.filter((modal) => modal.id !== id);
  }

  openInSlideIn<T>(componentType: Type<T>, rowId?: string | number): T {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);
    const componentRef = componentFactory.create(this.injector);
    this.open(slideInModalId, componentRef.instance, rowId);
    this.modalTypeOpenedInSlideIn = componentType;
    return componentRef.instance;
  }

  closeSlideIn(): Promise<boolean> {
    return this.close(slideInModalId);
  }

  /**
   * @deprecated Use openInSlideIn
   */
  private open(id: string, conf: ModalConfiguration, rowid?: string | number): void {
    if (rowid) {
      conf.rowid = rowid;
      this.getRow$.next(rowid);
    }
    // open modal specified by id
    const modal = this.modals.find((modal) => modal.id === id);
    modal.open(conf);
  }

  private close(id: string): Promise<boolean> {
    // close modal specified by id
    const modal = this.modals.find((modal) => modal.id === id);
    if (id === slideInModalId) {
      this.onClose$.next({ modalType: this.modalTypeOpenedInSlideIn, response: true });
    } else {
      this.onClose$.next({ response: true });
    }
    return modal.close();
  }
}
