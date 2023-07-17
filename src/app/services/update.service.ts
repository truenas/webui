import { Inject, Injectable } from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  constructor(
    @Inject(WINDOW) private window: Window,
  ) {}

  /**
   * Hard refresh is needed to load new html and js after the update.
   */
  setForHardRefresh(): void {
    this.window.localStorage.setItem('hardRefresh', 'true');
  }

  hardRefreshIfNeeded(): void {
    if (this.window.localStorage.getItem('hardRefresh') !== 'true') {
      return;
    }

    this.window.localStorage.removeItem('hardRefresh');
    this.window.location.reload();
  }
}
