import {
  Inject, Injectable,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  readonly hasCustomPageHeader$ = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(WINDOW) private window: Window,
  ) {}

  getContentContainer(): HTMLElement | null {
    return this.window.document.querySelector('.rightside-content-hold');
  }
}
