import { ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IxSlideInComponent } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.component';

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

  constructor(private slideInComponent: IxSlideInComponent) {}

  close(response?: R): void {
    this.slideInClosed$.next(response);
    this.slideInClosed$.complete();
    this.slideInComponent.closeSlideIn(this.uuid);
  }

  afterClosed$(): Observable<R> { // need get
    return this.slideInClosed$;
  }
}
