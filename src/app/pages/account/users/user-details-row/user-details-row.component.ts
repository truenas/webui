import {
  Component, ChangeDetectionStrategy, Input, EventEmitter, Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import {
  WebSocketService, AppLoaderService, DialogService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-details-row',
  templateUrl: './user-details-row.component.html',
  styleUrls: ['./user-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsRowComponent {
  @Input() user: User;
  @Input() colspan: number;
  @Output() update = new EventEmitter<void>();

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private slideIn: IxSlideInService,
  ) {}

  getDetails(user: User): Option[] {
    return [
      { label: this.translate.instant('GID'), value: user?.group?.bsdgrp_gid },
      { label: this.translate.instant('Home Directory'), value: user.home },
      { label: this.translate.instant('Shell'), value: user.shell },
      { label: this.translate.instant('Email'), value: user.email },
      { label: this.translate.instant('Password Disabled'), value: user.password_disabled.toString() },
      { label: this.translate.instant('Lock User'), value: user.locked.toString() },
      { label: this.translate.instant('Permit Sudo'), value: user.sudo.toString() },
      { label: this.translate.instant('Samba Authentication'), value: user.smb.toString() },
    ];
  }

  doEdit(user: User): void {
    const editForm = this.slideIn.open(UserFormComponent, { wide: true });
    if (editForm) {
      editForm.setupForm(user);
    }
  }

  async doDelete(user: User): Promise<void> {
    this.loader.open();
    const showCheckboxIfLastMember = await lastValueFrom(
      this.ws.call('group.query', [[['id', '=', user.group.id]]]).pipe(
        map((groups) => (groups.length ? groups[0].users.length === 1 : false)),
      ),
    );

    const confirmOptions: DialogFormConfiguration = {
      title: this.translate.instant('Delete User'),
      message: this.translate.instant('Are you sure you want to delete user <b>"{user}"</b>?', { user: user.username }),
      saveButtonText: this.translate.instant('Confirm'),
      fieldConfig: [{
        type: 'checkbox',
        name: 'delete_group',
        placeholder: this.translate.instant('Delete user primary group "{name}"', { name: user.group.bsdgrp_group }),
        value: false,
        isHidden: true,
      }],
      preInit: () => {
        confirmOptions.fieldConfig[0].isHidden = !showCheckboxIfLastMember;
      },
      afterInit: () => {
        this.loader.close();
      },
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close(true);
        this.ws.call('user.delete', [user.id, entityDialog.formValue]).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.update.emit();
          },
          error: (err) => {
            new EntityUtils().handleWsError(this, err, this.dialogService);
          },
        });
      },
    };

    this.dialogService.dialogForm(confirmOptions);
  }
}
