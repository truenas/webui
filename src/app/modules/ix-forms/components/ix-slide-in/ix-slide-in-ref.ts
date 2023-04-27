import { ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IxSlideIn2Component } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in2.component';

export class IxSlideInRef<T, R = unknown> {
  private slideInClosed$ = new Subject<R>();
  componentRef: ComponentRef<T>;
  uuid: string;

  get hostOfInstance(): Element {
    return this.componentRef.location.nativeElement;
  }

  get componentInstance(): T {
    return this.componentRef.instance;
  }

  constructor(private slideIn2Component: IxSlideIn2Component) {}

  close(response?: R): void {
    this.slideInClosed$.next(response);
    this.slideInClosed$.complete();
    this.slideIn2Component.closeSlideIn(this.uuid);
  }

  get afterClosed$(): Observable<R> {
    return this.slideInClosed$;
  }
}
