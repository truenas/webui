import { ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IxSlideIn2Component } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in2.component';
import { IxSlideIn2Service } from 'app/services/ix-slide-in2.service';

export class IxSlideInRef<T, D = unknown> {
  slideInClosed$ = new Subject<D>();
  componentRef: ComponentRef<T>;
  id: string;

  get componentInstance(): T {
    return this.componentRef.instance;
  }

  constructor(
    private slideIn2Service: IxSlideIn2Service,
    private slideIn2Component: IxSlideIn2Component,
  ) {}

  close(response?: D): void {
    this.slideInClosed$.next(response);
    this.slideInClosed$.complete();
    this.slideIn2Service.slideInRefMap.delete(this.id);
    this.slideIn2Component.closeSlideIn();
  }

  get afterClosed$(): Observable<D> {
    return this.slideInClosed$;
  }
}
