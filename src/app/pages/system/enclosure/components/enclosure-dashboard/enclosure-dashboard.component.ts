import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import {
  SetEnclosureLabelDialogComponent,
  SetEnclosureLabelDialogData,
} from 'app/pages/system/enclosure/components/enclosure-dashboard/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getEnclosureLabel } from 'app/pages/system/enclosure/utils/get-enclosure-label.utils';
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

  readonly selectedSlot$ = this.enclosureStore.selectedSlot$;
  readonly isJbofLicensed$ = this.ws.call('jbof.licensed');

  readonly selectedEnclosure = toSignal(this.enclosureStore.selectedEnclosure$);

  readonly enclosureLabel = computed(() => getEnclosureLabel(this.selectedEnclosure()));

  constructor(
    private enclosureStore: EnclosureStore,
    private matDialog: MatDialog,
    private ws: WebSocketService,
  ) {
    this.enclosureStore.initiate();
  }

  onEditLabel(): void {
    const enclosure = this.selectedEnclosure();
    const dialogConfig: SetEnclosureLabelDialogData = {
      currentLabel: this.enclosureLabel(),
      defaultLabel: enclosure.name,
      enclosureId: enclosure.id,
    };

    this.matDialog.open(SetEnclosureLabelDialogComponent, { data: dialogConfig })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe((newLabel: string) => {
        this.enclosureStore.renameSelectedEnclosure(newLabel);
      });
  }
}
