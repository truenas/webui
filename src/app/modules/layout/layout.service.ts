import { Injectable, inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private window = inject<Window>(WINDOW);

  readonly hasCustomPageHeader$ = new BehaviorSubject<boolean>(false);

  getContentContainer(): HTMLElement | null {
    return this.window.document.querySelector('.rightside-content-hold');
  }

  navigatePreservingScroll(
    router: Router,
    commands: Parameters<Router['navigate']>[0],
    extras?: NavigationExtras,
  ): Promise<boolean> | boolean {
    const content = this.getContentContainer();
    const scrollTop = content?.scrollTop ?? 0;
    const navigateResult = router.navigate(commands, extras);
    if (navigateResult instanceof Promise) {
      return navigateResult.then((success) => {
        if (content) {
          content.scrollTop = scrollTop;
        }
        return success;
      });
    }
    if (content) {
      content.scrollTop = scrollTop;
    }
    return navigateResult;
  }
}
