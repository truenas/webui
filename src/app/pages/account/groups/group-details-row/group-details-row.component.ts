import {
  Component, ChangeDetectionStrategy, Input, EventEmitter, Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import {
  WebSocketService, AppLoaderService, DialogService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'group-details-row',
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
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private slideIn: IxSlideInService,
    private router: Router,
  ) {}

  getDetails(group: Group): Option[] {
    return [
      { label: this.translate.instant('Samba Authentication'), value: group.smb.toString() },
    ];
  }

  doEdit(group: Group): void {
    this.slideIn.open(GroupFormComponent).setupForm(group);
  }

  openGroupMembersForm(): void {
    this.router.navigate(['/', 'credentials', 'groups', 'members', this.group.id]);
  }

  doDelete(group: Group): void {
    this.loader.open();

    const confirmOptions: DialogFormConfiguration = {
      title: this.translate.instant('Delete Group'),
      message: this.translate.instant('Are you sure you want to delete group <b>"{name}"</b>?', { name: group.group }),
      saveButtonText: this.translate.instant('Confirm'),
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
      afterInit: () => {
        this.loader.close();
      },
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close(true);
        this.ws.call('group.delete', [group.id, entityDialog.formValue]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.update.emit();
          },
          (err) => {
            new EntityUtils().handleWsError(this, err, this.dialogService);
          },
        );
      },
    };

    this.dialogService.dialogForm(confirmOptions);
  }
}
