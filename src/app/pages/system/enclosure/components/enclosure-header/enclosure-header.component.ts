import { ChangeDetectionStrategy, Component, DestroyRef, input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  SetEnclosureLabelDialog,
  SetEnclosureLabelDialogData,
} from 'app/pages/system/enclosure/components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-enclosure-header',
  templateUrl: './enclosure-header.component.html',
  styleUrls: ['./enclosure-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class EnclosureHeaderComponent {
  private enclosureStore = inject(EnclosureStore);
  private matDialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  readonly title = input.required<string>();

  protected readonly requiredRoles = [Role.EnclosureWrite];

  onEditLabel(): void {
    const enclosure = this.enclosureStore.selectedEnclosure();
    if (!enclosure) {
      return;
    }

    const dialogConfig: SetEnclosureLabelDialogData = {
      currentLabel: this.enclosureStore.enclosureLabel(),
      defaultLabel: enclosure.name,
      enclosureId: enclosure.id,
    };

    this.matDialog.open(SetEnclosureLabelDialog, { data: dialogConfig })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((newLabel: string) => {
        if (!newLabel) {
          return;
        }

        this.enclosureStore.renameSelectedEnclosure(newLabel);
      });
  }
}
