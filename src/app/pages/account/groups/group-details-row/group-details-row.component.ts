import {
  Component, ChangeDetectionStrategy, Input, EventEmitter, Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Group } from 'app/interfaces/group.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import {
  WebSocketService, DialogService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-group-details-row',
  templateUrl: './group-details-row.component.html',
  styleUrls: ['./group-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDetailsRowComponent {
  @Input() group: Group;
  @Input() colspan: number;
  @Output() update = new EventEmitter<void>();

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private slideIn: IxSlideInService,
    private router: Router,
  ) {}

  doEdit(group: Group): void {
    const groupEdit = this.slideIn.open(GroupFormComponent);
    if (groupEdit) {
      groupEdit.setupForm(group);
    }
  }

  openGroupMembersForm(): void {
    this.router.navigate(['/', 'credentials', 'groups', this.group.id, 'members']);
  }

  doDelete(group: Group): void {
    const confirmOptions: DialogFormConfiguration = {
      title: this.translate.instant('Delete Group'),
      message: this.translate.instant('Are you sure you want to delete group <b>"{name}"</b>?', { name: group.group }),
      saveButtonText: this.translate.instant('Confirm'),
      confirmCheckbox: true,
      fieldConfig: [{
        type: 'checkbox',
        name: 'delete_users',
        placeholder: this.translate.instant('Delete {n, plural, one {# user} other {# users}} with this primary group?', { n: group.users.length }),
        value: false,
        isHidden: true,
      }],
      preInit: () => {
        confirmOptions.fieldConfig[0].isHidden = !group.users.length;
      },
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close(true);
        this.ws.call('group.delete', [group.id, entityDialog.formValue]).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.update.emit();
          },
          error: (err) => {
            new EntityUtils().handleWsError(entityDialog, err, this.dialogService);
          },
        });
      },
    };

    this.dialogService.dialogForm(confirmOptions);
  }
}
