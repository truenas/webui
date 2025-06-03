import {
  Observable,
} from 'rxjs';
import { ComponentInSlideIn, SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

export class SlideInRef<D, R> {
  close: (response: SlideInResponse<R>) => void;
  /**
   * This method will destroy the caller slide-in component and replace it with the
   * provided new component. The new component will also take on the same "on-close"
   * observable that the caller had. Makes it easy to switch between components that
   * have the same purpose and return the same response type e.g, form to wizard and
   * wizard to form.
   */
  swap?: <D2>(component: ComponentInSlideIn<D2, R>, options?: { wide?: boolean; data?: D2 }) => void;
  getData: () => D;
  requireConfirmationWhen: (confirm: () => Observable<boolean>) => void;
}
