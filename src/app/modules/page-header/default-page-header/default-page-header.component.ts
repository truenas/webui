import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LayoutService } from 'app/services/layout.service';

@Component({
  selector: 'ix-default-page-header',
  template: `
    @if (!(hasCustomPageHeader$ | async)) {
      <ix-page-header [default]="true"></ix-page-header>
    }
    `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultPageHeaderComponent {
  readonly hasCustomPageHeader$ = this.layoutService.hasCustomPageHeader$;

  constructor(
    private layoutService: LayoutService,
  ) {}
}
