import { Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  templateUrl: './shares-dashboard.component.html',
  styleUrls: ['./shares-dashboard.component.scss'],
})
export class SharesDashboardComponent {
}
