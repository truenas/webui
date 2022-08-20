import {
  ComponentFactoryResolver, Injectable, Injector, Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import { ModalConfiguration } from 'app/modules/common/modal/modal-configuration.interface';
import { ModalComponent } from 'app/modules/common/modal/modal.component';

/**
 * @deprecated Use MatDialog for dialogs and IxSlideInService for slide-ins
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private modals: ModalComponent[] = [];

  refreshTable$ = new Subject();
  onClose$ = new Subject();
  getRow$ = new Subject();

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
  ) {}

  refreshTable(): void {
    this.refreshTable$.next();
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
    this.open('slide-in-form', componentRef.instance, rowId);
    return componentRef.instance;
  }

  closeSlideIn(): Promise<boolean> {
    return this.close('slide-in-form');
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
    this.onClose$.next(true);
    return modal.close();
  }
}
