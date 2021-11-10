import {
  trigger, state, animate, style, transition,
} from '@angular/animations';
import {
  Component, OnInit, AfterViewInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PreferencesService } from 'app/core/services/preferences.service';
import helptext from 'app/helptext/account/user-list';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { UserListRow } from 'app/pages/account/users/user-list/user-list-row.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import {
  DialogService, UserService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';
import { WebSocketService } from 'app/services/ws.service';
import { UserLoadAction } from 'app/store/actions/user.actions';
import { AppState } from 'app/store/reducers/index';
import {
  selectAllUser, selectUserLoading, selectUserError,
} from 'app/store/selectors/user.selectors';
import { UserFormComponent } from '../user-form/user-form.component';

@UntilDestroy()
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UserService],
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
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;

  protected usr_lst: [User[]?] = [];
  protected grp_lst: [Group[]?] = [];
  filter = '';
  displayedColumns: string[] = ['username', 'uid', 'builtin', 'full_name', 'actions'];
  rowIdentifier = 'username';
  dataSource: MatTableDataSource<UserListRow>;
  loading: boolean;
  private subscription: Subscription = new Subscription();
  error$: Observable<boolean>;
  userTotal = 0;
  pageSize = 50;
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
  expandedRow: UserListRow;
  readonly helptext = helptext;

  constructor(
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected ws: WebSocketService,
    protected prefService: PreferencesService,
    private translate: TranslateService,
    private modalService: ModalService,
    public store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    this.getDataFromStore();

    setTimeout(() => {
      if (this.prefService.preferences.showUserListMessage) {
        this.showOneTimeBuiltinMsg();
      }
    }, 2000);
  }

  getDataFromStore(): void {
    this.store$.pipe(select(selectAllUser)).pipe(
      untilDestroyed(this),
    ).subscribe(
      (users) => {
        this.initializeData(this.resourceTransformIncomingRestData(users));
      },
    );

    this.subscription.add(this.store$.pipe(
      select(selectUserLoading),
      untilDestroyed(this),
    ).subscribe(
      (loading) => {
        if (loading) {
          this.dataSource = new MatTableDataSource([]);
        }
        this.loading = loading;
      },
    ));

    this.error$ = this.store$.pipe(select(selectUserError));
  }

  ngAfterViewInit(): void {
    this.loadUsers();
  }

  initializeData(users: UserListRow[]): void {
    console.info('initializeData', users.length);
    this.dataSource = new MatTableDataSource(users.length ? users : []);
    this.userTotal = users.length;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.cdr.markForCheck();
  }

  private loadUsers(): void {
    this.store$.dispatch(new UserLoadAction({
      search: this.filter.toLocaleLowerCase(),
      offset: 0,
    }));
  }

  ableToDeleteGroup(id: number): boolean {
    const user = _.find(this.usr_lst[0], { id });
    const group_users = _.find(this.grp_lst[0], { id: user.group.id }).users;
    // Show checkbox if deleting the last member of a group
    if (group_users.length === 1) {
      return true;
    }
    return false;
  }

  resourceTransformIncomingRestData(rawUsers: User[]): UserListRow[] {
    const users = [...rawUsers] as UserListRow[];
    this.usr_lst = [];
    this.grp_lst = [];
    this.usr_lst.push(users);
    if (this.prefService.preferences.hide_builtin_users) {
      const newData: UserListRow[] = [];
      users.forEach((user) => {
        if (!user.builtin || user.username === 'root') {
          newData.push(user);
        }
      });
      return newData;
    }
    return users;
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
      this.getDataFromStore();
    });
  }

  showOneTimeBuiltinMsg(): void {
    this.prefService.preferences.showUserListMessage = false;
    this.prefService.savePreferences();
    this.dialogService.confirm({
      title: helptext.builtinMessageDialog.title,
      message: helptext.builtinMessageDialog.message,
      hideCheckBox: true,
      hideCancel: true,
      buttonMsg: helptext.builtinMessageDialog.button,
    });
  }

  doAdd(): void {
    this.modalService.openInSlideIn(UserFormComponent);
  }

  doEdit(user: UserListRow): void {
    this.modalService.openInSlideIn(UserFormComponent, user.id);
  }

  doDelete(user: UserListRow): void {
    const confirmOptions: DialogFormConfiguration<UserListRow> = {
      title: this.translate.instant('Delete User'),
      message: this.translate.instant('Are you sure you want to delete the <b>{user}</b> user?', { user: user.username }),
      saveButtonText: this.translate.instant('Confirm'),
      fieldConfig: [],
      confirmCheckbox: true,
      preInit: () => {
        if (this.ableToDeleteGroup(user.id)) {
          confirmOptions.fieldConfig.push({
            type: 'checkbox',
            name: 'delete_group',
            placeholder: helptext.deleteDialog.deleteGroup_placeholder + user.group.bsdgrp_group,
            value: false,
          });
        }
      },
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close(true);
        const deleteGroup = !!entityDialog.formValue?.delete_group;
        this.userService.deleteUser(user.id, deleteGroup);
      },
    };

    this.dialogService.dialogForm(confirmOptions);
  }

  expandRow(element: UserListRow): void {
    this.expandedRow = this.expandedRow === element ? null : element;
    this.cdr.markForCheck();
  }
}
