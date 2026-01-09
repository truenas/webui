import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutService } from 'app/modules/layout/layout.service';
import { PageAlertsComponent } from 'app/modules/page-header/page-alerts/page-alerts.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';

@Component({
  selector: 'ix-default-page-header',
  templateUrl: './default-page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, PageAlertsComponent, AsyncPipe],
})
export class DefaultPageHeaderComponent {
  private layoutService = inject(LayoutService);

  readonly hasCustomPageHeader$ = this.layoutService.hasCustomPageHeader$;
}
