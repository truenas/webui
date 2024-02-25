import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LayoutService } from 'app/services/layout.service';

@Component({
  selector: 'ix-default-page-header',
  template: `
    <ix-page-header *ngIf="!(hasCustomPageHeader$ | async)" [default]="true"></ix-page-header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultPageHeaderComponent {
  readonly hasCustomPageHeader$ = this.layoutService.hasCustomPageHeader$;

  constructor(
    private layoutService: LayoutService,
  ) {}
}
