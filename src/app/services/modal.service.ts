import { PlatformLocation } from '@angular/common';
import {
  ComponentFactoryResolver, Injectable, Injector, Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import { ModalConfiguration } from 'app/modules/layout/components/modal/modal-configuration.interface';
import { ModalComponent } from 'app/modules/layout/components/modal/modal.component';

export interface ModalServiceMessage {
  action: string;
  component: string;
  row: number;
}

export const slideInModalId = 'slide-in-form';

/**
 * @deprecated Use MatDialog for dialogs and IxSlideInService for slide-ins
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private modals: ModalComponent[] = [];

  private modalTypeOpenedInSlideIn: Type<unknown> = null;
  readonly refreshTable$ = new Subject<void>();
  readonly onClose$ = new Subject<{ modalType?: Type<unknown>; response: unknown }>();
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

  message(message: ModalServiceMessage): void {
    this.message$.next(message);
  }

  add(modal: ModalComponent): void {
    this.modals.push(modal);
  }

  remove(id: string): void {
    this.modals = this.modals.filter((modal) => modal.id !== id);
  }

  openInSlideIn<T>(componentType: Type<T>, rowId?: string | number): T {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);
    const componentRef = componentFactory.create(this.injector);
    this.open(slideInModalId, componentRef.instance, rowId);
    this.modalTypeOpenedInSlideIn = componentType;
    return componentRef.instance;
  }

  closeSlideIn(value?: unknown): Promise<boolean> {
    return this.close(slideInModalId, value);
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
    const modalToOpen = this.modals.find((modal) => modal.id === id);
    modalToOpen.open(conf);
  }

  private close(id: string, response: unknown = true): Promise<boolean> {
    // close modal specified by id
    const modalToClose = this.modals.find((modal) => modal.id === id);
    if (id === slideInModalId) {
      this.onClose$.next({ modalType: this.modalTypeOpenedInSlideIn, response });
    } else {
      this.onClose$.next({ response });
    }
    return modalToClose.close();
  }
}
