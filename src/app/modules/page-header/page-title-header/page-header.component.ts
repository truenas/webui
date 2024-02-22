import {
  ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit,
} from '@angular/core';
import { map } from 'rxjs/operators';
import { LayoutService } from 'app/services/layout.service';
import { PageTitleService } from 'app/services/page-title.service';

/**
 * Usage:
 * Use in your template to override default page title.
 * If you don't use this component, the default page title will be shown.
 */
@Component({
  selector: 'ix-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent implements OnInit, OnDestroy {
  @Input() pageTitle: string;
  @Input() loading = false;

  /**
   * You probably don't need to use this.
   * Set to true for automatic header when no header is set.
   */
  @Input() default = false;

  readonly defaultTitle$ = this.pageTitleService.title$;
  readonly hasNewIndicator$ = this.pageTitleService.hasNewIndicator$;
  readonly currentTitle$ = this.defaultTitle$.pipe(
    map((defaultTitle) => {
      if (!this.pageTitle) {
        return defaultTitle;
      }

      return this.pageTitle;
    }),
  );

  constructor(
    private pageTitleService: PageTitleService,
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    if (!this.default) {
      this.layoutService.hasCustomPageHeader$.next(true);
    }
  }

  ngOnDestroy(): void {
    if (!this.default) {
      this.layoutService.hasCustomPageHeader$.next(false);
    }
  }
}
