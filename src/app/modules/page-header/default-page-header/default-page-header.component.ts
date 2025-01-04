import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LayoutService } from 'app/modules/layout/layout.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';

@Component({
  selector: 'ix-default-page-header',
  template: `
    @if (!(hasCustomPageHeader$ | async)) {
      <ix-page-header [default]="true"></ix-page-header>
    }
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [PageHeaderComponent, AsyncPipe],
})
export class DefaultPageHeaderComponent {
  readonly hasCustomPageHeader$ = this.layoutService.hasCustomPageHeader$;

  constructor(
    private layoutService: LayoutService,
  ) {}
}
