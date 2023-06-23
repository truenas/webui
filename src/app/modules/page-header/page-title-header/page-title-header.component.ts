import { Component, Input } from '@angular/core';
import { map } from 'rxjs/operators';
import { PageTitleService } from 'app/services/page-title.service';

@Component({
  selector: 'ix-page-title-header',
  templateUrl: './page-title-header.component.html',
  styleUrls: ['./page-title-header.component.scss'],
})
export class PageTitleHeaderComponent {
  @Input() pageTitle: string;
  @Input() loading = false;

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

  constructor(private pageTitleService: PageTitleService) {}
}
