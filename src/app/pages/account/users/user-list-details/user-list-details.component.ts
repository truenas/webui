import {
  Component, OnInit, ChangeDetectionStrategy, Input, EventEmitter, Output, ViewChild,
  OnDestroy, ChangeDetectorRef,
} from '@angular/core';
import { MatRowDef, MatTableDataSource, MatColumnDef } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';
import { UserFormComponent } from 'app/pages/account/users/user-form/user-form.component';
import { AppLoaderService, ModalService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'app-user-list-details',
  templateUrl: './user-list-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListDetailsComponent implements OnInit, OnDestroy {
  @Input() expandedRow: User;
  @Input() dataSource: MatTableDataSource<User>;
  @Input() colspan: number;
  @Output() update = new EventEmitter<void>();
  @ViewChild(MatRowDef, { static: false }) rowDef: MatRowDef<User>;
  @ViewChild(MatColumnDef, { static: false }) columnDef: MatColumnDef;

  constructor(
    private table: IxTableComponent<User>,
    private ws: WebSocketService,
    private modalService: ModalService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private loader: AppLoaderService,
  ) { }

  ngOnInit(): void {
    if (this.table) {
      this.cdr.detectChanges();
      this.table.addColumnDef(this.columnDef);
      this.table.addRowDef(this.rowDef);
    }
  }

  ngOnDestroy(): void {
    if (this.table) {
      this.table.removeRowDef(this.rowDef);
      this.table.removeColumnDef(this.columnDef);
    }
  }

  getDetails(user: User): Option[] {
    return [
      { label: this.translate.instant('GID'), value: user?.group?.bsdgrp_gid },
      { label: this.translate.instant('Home Directory'), value: user.home },
      { label: this.translate.instant('Shell'), value: user.shell },
      { label: this.translate.instant('Email'), value: user.email },
      { label: this.translate.instant('Password Disabled'), value: user.password_disabled.toString() },
      { label: this.translate.instant('Lock User'), value: user.locked.toString() },
      { label: this.translate.instant('Permit Sudo'), value: user.sudo.toString() },
      { label: this.translate.instant('Microsoft Account'), value: user.microsoft_account.toString() },
      { label: this.translate.instant('Samba Authentication'), value: user.smb.toString() },
    ];
  }

  doEdit(user: User): void {
    this.modalService.openInSlideIn(UserFormComponent, user.id);
  }

  async doDelete(user: User): Promise<void> {
    this.loader.open();
    const showCheckboxIfLastMember = await this.ws.call('group.query', [[['id', '=', user.group.id]]]).pipe(
      map((groups) => {
        return groups.length ? groups[0].users.length === 1 : false;
      }),
    ).toPromise();

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
        this.ws.call('user.delete', [user.id, entityDialog.formValue]).pipe(untilDestroyed(this)).subscribe(
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
