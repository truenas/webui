import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  imports: [PageHeaderComponent, AsyncPipe],
})
export class DefaultPageHeaderComponent {
  private layoutService = inject(LayoutService);

  readonly hasCustomPageHeader$ = this.layoutService.hasCustomPageHeader$;
}
