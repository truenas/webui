import {
  trigger, state, animate, style, transition,
} from '@angular/animations';
import {
  Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ControlConfig, ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  DialogService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { WebSocketService } from 'app/services/ws.service';
import { UserFormComponent } from '../user-form/user-form.component';

@UntilDestroy()
@Component({
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class UserListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  protected users: [User[]?] = [];
  protected groups: [Group[]?] = [];
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
    private dialogService: DialogService,
    private ws: WebSocketService,
    private prefService: PreferencesService,
    private translate: TranslateService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private core: CoreService,
  ) { }

  ngOnInit(): void {
    this.setupToolbar();
    this.getUsers();
    this.getGroups();
  }

  ngAfterViewInit(): void {
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getUsers();
    });

    if (this.prefService.preferences.showUserListMessage) {
      setTimeout(() => {
        this.showOneTimeBuiltinMsg();
      }, 2000);
    }
  }

  getUsers(): void {
    this.loading = true;
    this.ws.call('user.query').pipe(
      map((users) => {
        this.users = [];
        this.users.push(users);
        if (this.prefService.preferences.hide_builtin_users) {
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

  getGroups(): void {
    this.ws.call('group.query').pipe(untilDestroyed(this)).subscribe((groups) => {
      this.groups = [];
      this.groups.push(groups);
    });
  }

  createDataSource(users: User[] = []): void {
    this.dataSource = new MatTableDataSource(users);
    this.dataSource.sort = this.sort;
  }

  ableToDeleteGroup(id: number): boolean {
    const user = _.find(this.users[0], { id });
    const groupUsers = _.find(this.groups[0], { id: user.group.id }).users;
    // Show checkbox if deleting the last member of a group
    return groupUsers.length === 1;
  }

  toggleBuiltins(): void {
    let dialogOptions: ConfirmOptions;
    if (this.prefService.preferences.hide_builtin_users) {
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
      this.prefService.preferences.hide_builtin_users = !this.prefService.preferences.hide_builtin_users;
      this.prefService.savePreferences();
      this.getUsers();
    });
  }

  showOneTimeBuiltinMsg(): void {
    this.prefService.preferences.showUserListMessage = false;
    this.prefService.savePreferences();
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

  doEdit(user: User): void {
    this.modalService.openInSlideIn(UserFormComponent, user.id);
  }

  doDelete(user: User): void {
    const confirmOptions: DialogFormConfiguration = {
      title: this.translate.instant('Delete User'),
      message: this.translate.instant('Are you sure you want to delete user <b>"{user}"</b>?', { user: user.username }),
      saveButtonText: this.translate.instant('Delete'),
      fieldConfig: [],
      preInit: () => {
        if (this.ableToDeleteGroup(user.id)) {
          confirmOptions.fieldConfig.push({
            type: 'checkbox',
            name: 'delete_group',
            placeholder: this.translate.instant('Delete user primary group "{name}"', { name: user.group.bsdgrp_group }),
            value: false,
          });
        }
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

  expandRow(row: User): void {
    this.expandedRow = this.expandedRow === row ? null : row;
    this.cdr.markForCheck();
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
}
