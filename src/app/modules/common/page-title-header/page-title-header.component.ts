import { Component, Input } from '@angular/core';
import { PageTitleService } from 'app/services/page-title.service';

@Component({
  selector: 'page-title-header',
  templateUrl: './page-title-header.component.html',
  styleUrls: ['./page-title-header.component.scss'],
})
export class PageTitleHeaderComponent {
  @Input() pageTitle: string;

  readonly defaultTitle$ = this.pageTitleService.title$;

  constructor(private pageTitleService: PageTitleService) {}
}
