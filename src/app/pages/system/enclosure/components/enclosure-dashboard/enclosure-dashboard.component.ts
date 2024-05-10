import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-dashboard',
  templateUrl: './enclosure-dashboard.component.html',
  styleUrls: ['./enclosure-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureDashboardComponent {
  protected readonly requiredRoles = [Role.FullAdmin];

  constructor(
    private enclosureStore: EnclosureStore,
    private matDialog: MatDialog,
    private ws: WebSocketService,
  ) {
    this.enclosureStore.initiate();
  }
}
