import { ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export class IxSlideInRef<T, D = unknown> {
  slideInClosed$ = new Subject<D>();
  onClose$ = new Subject<string>();
  componentRef: ComponentRef<T>;
  id: string;

  get componentInstance(): T {
    return this.componentRef.instance;
  }

  close(response?: D): void {
    this.onClose$.next(this.id);
    this.slideInClosed$.next(response);
    this.slideInClosed$.complete();
  }

  get afterClosed$(): Observable<D> {
    return this.slideInClosed$;
  }
}
