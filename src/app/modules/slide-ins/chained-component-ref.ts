import { Type } from '@angular/core';
import { ChainedComponentResponse as ChainedResponse } from 'app/services/chained-slide-in.service';

export class ChainedRef<T> {
  close: (response: ChainedResponse) => void;
  /**
   * This method will destroy the caller slide-in component and replace it with the
   * provided new component. The new component will also take on the same "on-close"
   * observable that the caller had. Makes it easy to switch between components that
   * have the same purpose and return the same response type e.g, form to wizard and
   * wizard to form.
   */
  swap?: (component: Type<unknown>, wide: boolean, data?: unknown) => void;
  getData: () => T;
}
