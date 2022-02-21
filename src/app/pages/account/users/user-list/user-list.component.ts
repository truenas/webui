import {
  Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy,
  Optional, ViewChildren, QueryList,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/modules/entity/entity-toolbar/entity-toolbar.component';
import { ControlConfig, ToolbarConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { ModalService } from 'app/services/modal.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { builtinUsersToggled, oneTimeBuiltinUsersMessageShown } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { IxDetailRowDirective } from '../../../../modules/ix-tables/directives/ix-detail-row.directive';
import { UserFormComponent } from '../user-form/user-form.component';

@UntilDestroy()
@Component({
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  displayedColumns: string[] = ['username', 'uid', 'builtin', 'full_name', 'actions'];
  toolbarConfig: ToolbarConfig;
  settingsEvent$: Subject<CoreEvent> = new Subject();
  filterString = '';
  dataSource: MatTableDataSource<User> = new MatTableDataSource([]);
  loading = false;
  error = false;
  defaultSort: Sort = { active: 'uid', direction: 'asc' };
  emptyConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    title: this.translate.instant('No Users'),
    large: true,
  };
  loadingConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  errorConf: EmptyConfig = {
    type: EmptyType.Errors,
    large: true,
    title: this.translate.instant('Can not retrieve response'),
  };
  expandedRow: User;
  @ViewChildren(IxDetailRowDirective) private detailRows: QueryList<IxDetailRowDirective>;

  private showUserListMessage = false;
  private hideBuiltinUsers = true;

  get currentEmptyConf(): EmptyConfig {
    if (this.loading) {
      return this.loadingConf;
    }
    if (this.error) {
      return this.errorConf;
    }
    return this.emptyConf;
  }

  constructor(
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private core: CoreService,
    private store$: Store<AppState>,
    @Optional() private ixDetailRowDirective: IxDetailRowDirective,
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.setupToolbar();
    this.store$.pipe(waitForPreferences, untilDestroyed(this)).subscribe((preferences) => {
      this.showUserListMessage = preferences.showUserListMessage;
      this.hideBuiltinUsers = preferences.hideBuiltinUsers;
      this.getUsers();
      this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
        this.getUsers();
      });
    });
  }

  ngAfterViewInit(): void {
    if (this.showUserListMessage) {
      setTimeout(() => {
        this.showOneTimeBuiltinMsg();
      }, 2000);
    }
  }

  getUsers(): void {
    this.loading = true;
    this.ws.call('user.query').pipe(
      map((users) => {
        if (this.hideBuiltinUsers) {
          // TODO: Use QueryParams and QueryFilter when it is possible
          // [['OR', [['builtin', '=', false], ['username', '=', 'root']]]]
          return users.filter((user) => !user.builtin || user.username === 'root');
        }
        return users;
      }),
      untilDestroyed(this),
    ).subscribe(
      (users) => {
        this.createDataSource(users);
        this.loading = false;
        this.error = false;
        this.cdr.markForCheck();
      },
      () => {
        this.createDataSource();
        this.loading = false;
        this.error = true;
        this.cdr.markForCheck();
      },
    );
  }

  createDataSource(users: User[] = []): void {
    this.dataSource = new MatTableDataSource(users);
    this.dataSource.sort = this.sort;
  }

  toggleBuiltins(): void {
    let dialogOptions: ConfirmOptions;
    if (this.hideBuiltinUsers) {
      dialogOptions = {
        title: this.translate.instant('Show Built-in Users'),
        message: this.translate.instant('Show built-in users (default setting is <i>hidden</i>).'),
        hideCheckBox: true,
        buttonMsg: this.translate.instant('Show'),
      };
    } else {
      dialogOptions = {
        title: this.translate.instant('Hide Built-in Users'),
        message: this.translate.instant('Hide built-in users (default setting is <i>hidden</i>).'),
        hideCheckBox: true,
        buttonMsg: this.translate.instant('Hide'),
      };
    }

    this.dialogService.confirm(dialogOptions).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.store$.dispatch(builtinUsersToggled());
      this.getUsers();
    });
  }

  showOneTimeBuiltinMsg(): void {
    this.store$.dispatch(oneTimeBuiltinUsersMessageShown());
    this.dialogService.confirm({
      title: this.translate.instant('Display Note'),
      message: this.translate.instant('All built-in users except <i>root</i> are hidden by default. Use the gear icon (top-right) to toggle the display of built-in users.'),
      hideCheckBox: true,
      hideCancel: true,
      buttonMsg: this.translate.instant('Close'),
    });
  }

  doAdd(): void {
    this.modalService.openInSlideIn(UserFormComponent);
  }

  onToggle(row: User): void {
    this.expandedRow = this.expandedRow === row ? null : row;
    this.toggleDetailRows();
    this.cdr.markForCheck();
  }

  toggleDetailRows(): void {
    this.detailRows.forEach((row) => {
      if (row.expanded && row.ixDetailRow !== this.expandedRow) {
        row.close();
      } else if (!row.expanded && row.ixDetailRow === this.expandedRow) {
        row.open();
      }
    });
  }

  setupToolbar(): void {
    this.settingsEvent$ = new Subject();
    this.settingsEvent$.pipe(
      untilDestroyed(this),
    ).subscribe((event: CoreEvent) => {
      switch (event.data.event_control) {
        case 'filter':
          this.filterString = event.data.filter;
          this.dataSource.filter = event.data.filter;
          break;
        case 'add':
          this.doAdd();
          break;
        case 'config':
          this.toggleBuiltins();
          break;
        default:
          break;
      }
    });

    const controls: ControlConfig[] = [
      {
        name: 'filter',
        type: 'input',
        value: this.filterString,
        placeholder: this.translate.instant('Search'),
      },
      {
        name: 'config',
        type: 'button',
        label: this.translate.instant('Toggle built-in users'),
      },
      {
        name: 'add',
        type: 'button',
        label: this.translate.instant('Add'),
        color: 'primary',
        ixAutoIdentifier: 'Users_ADD',
      },
    ];

    const toolbarConfig: ToolbarConfig = {
      target: this.settingsEvent$,
      controls,
    };
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig,
    };

    this.toolbarConfig = toolbarConfig;
    this.core.emit({ name: 'GlobalActions', data: settingsConfig, sender: this });
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
            this.getUsers();
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
