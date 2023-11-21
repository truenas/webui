import { Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './shares-dashboard.component.html',
  styleUrls: ['./shares-dashboard.component.scss'],
})
export class SharesDashboardComponent {
  isClustered$ = this.ws.call('cluster.utils.is_clustered');

  readonly Role = Role;

  constructor(private ws: WebSocketService) {}
}
