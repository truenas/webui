import { AsyncPipe, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LayoutService } from 'app/modules/layout/layout.service';
import { PageTitleService } from 'app/modules/layout/page-title.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { HeaderBadgeComponent } from 'app/modules/page-header/header-badge/header-badge.component';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { NavigationService } from 'app/services/navigation/navigation.service';
import { appBarClosed, appBarMinimized } from 'app/store/app-bar/app-bar.actions';

@Component({
  selector: 'ix-page-header',
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderBadgeComponent,
    FakeProgressBarComponent,
    TranslateModule,
    AsyncPipe,
    TooltipComponent,
    IxIconComponent,
    NgClass,
  ],
})
export class PageHeaderComponent implements OnInit, OnDestroy {
  private pageTitleService = inject(PageTitleService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);
  private store = inject(Store);
  private navService = inject(NavigationService);

  readonly pageTitle = input<string>();
  readonly customBadgeTitle = input<string>();
  readonly tooltip = input<string>();
  readonly loading = input(false);
  // Indicates if this is a sub-page header (with smaller font size)
  readonly isSub = input(false);

  readonly default = input(false);

  readonly defaultTitle$ = this.pageTitleService.title$;
  readonly hasNewIndicator$ = this.pageTitleService.hasNewIndicator$;
  readonly currentTitle$ = this.defaultTitle$.pipe(
    map((defaultTitle) => {
      if (!this.pageTitle()) {
        return defaultTitle;
      }
      return this.pageTitle();
    }),
  );

  ngOnInit(): void {
    if (!this.default()) {
      this.layoutService.hasCustomPageHeader$.next(true);
    }
  }

  ngOnDestroy(): void {
    if (!this.default()) {
      this.layoutService.hasCustomPageHeader$.next(false);
    }
  }

  minimize(): void {
    const currentState = this.getCurrentMenuItemState();
    this.store.dispatch(appBarMinimized({ stateName: currentState }));
  }

  close(): void {
    const currentState = this.getCurrentMenuItemState();
    this.store.dispatch(appBarClosed({ stateName: currentState }));
  }

  private getCurrentMenuItemState(): string {
    const currentUrl = this.router.url.replace('/', '');

    // 查找匹配的 menuItem
    const matchedItem = this.navService.menuItems.find((item) => {
      if (currentUrl.startsWith(item.state)) return true;

      // 检查子菜单
      if (item.sub) {
        return item.sub.some((subItem) => subItem.state === currentUrl);
      }

      return false;
    });

    return (matchedItem?.state || currentUrl || 'desktop').toLowerCase();
  }
}
