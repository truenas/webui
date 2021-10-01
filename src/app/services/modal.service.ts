import {
  ComponentFactoryResolver, Injectable, Injector, Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import { ModalComponent } from 'app/components/common/modal/modal.component';

export interface ModalServiceMessage {
  action: string;
  component: string;
  row: number;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private modals: ModalComponent[] = [];

  refreshTable$ = new Subject();
  onClose$ = new Subject();
  refreshForm$ = new Subject();
  getRow$ = new Subject();
  message$ = new Subject<ModalServiceMessage>();

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
  ) {}

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
    this.modals = this.modals.filter((x) => x.id !== id);
  }

  openInSlideIn<T>(componentType: Type<T>, rowId?: string | number): T {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentType);
    const componentRef = componentFactory.create(this.injector);
    this.open('slide-in-form', componentRef.instance, rowId);
    return componentRef.instance;
  }

  /**
   * @deprecated Use openInSlideIn
   */
  private open(id: string, conf: any, rowid?: any): void {
    if (rowid) {
      conf.rowid = rowid;
      this.getRow$.next(rowid);
    }
    // open modal specified by id
    const modal = this.modals.find((x) => x.id === id);
    modal.open(conf);
  }

  close(id: string, error?: any, response?: any): Promise<boolean> {
    // close modal specified by id
    const modal = this.modals.find((x) => x.id === id);
    if (error) {
      this.onClose$.error(error);
    } else if (response) {
      this.onClose$.next(response);
    } else {
      this.onClose$.next(true);
    }
    return modal.close();
  }
}
