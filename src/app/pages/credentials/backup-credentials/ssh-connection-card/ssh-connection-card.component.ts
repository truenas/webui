import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { switchMap, filter, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { sshConnectionsCardElements } from 'app/pages/credentials/backup-credentials/ssh-connection-card/ssh-connection-card.elements';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-ssh-connection-card',
  templateUrl: './ssh-connection-card.component.html',
  styleUrls: ['./ssh-connection-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SshConnectionCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.KeychainCredentialWrite];
  protected readonly searchableElements = sshConnectionsCardElements;

  dataProvider: AsyncDataProvider<KeychainSshCredentials>;
  credentials: KeychainSshCredentials[] = [];
  columns = createTable<KeychainSshCredentials>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'ssh-con-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('SSH Connection')],
  });

  constructor(
    private ws: WebSocketService,
    private chainedSlideInService: ChainedSlideInService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    private dialog: DialogService,
    private keychainCredentialService: KeychainCredentialService,
  ) {}

  ngOnInit(): void {
    const credentials$ = this.keychainCredentialService.getSshConnections().pipe(
      tap((credentials) => this.credentials = credentials),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<KeychainSshCredentials>(credentials$);
    this.setDefaultSort();
    this.getCredentials();
  }

  getCredentials(): void {
    this.dataProvider.load();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  doAdd(): void {
    const closer$ = this.chainedSlideInService.open(SshConnectionFormComponent);
    closer$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCredentials());
  }

  doEdit(credential: KeychainSshCredentials): void {
    const closer$ = this.chainedSlideInService.open(SshConnectionFormComponent, false, credential);
    closer$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCredentials());
  }

  doDelete(credential: KeychainSshCredentials): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Delete SSH Connection'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> SSH Connection?', {
          name: credential.name,
        }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('keychaincredential.delete', [credential.id])),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.getCredentials();
      });
  }
}
