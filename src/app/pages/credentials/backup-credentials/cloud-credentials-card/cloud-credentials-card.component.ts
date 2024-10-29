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
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
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
import { cloudCredentialsCardElements } from 'app/pages/credentials/backup-credentials/cloud-credentials-card/cloud-credentials-card.elements';
import { CloudCredentialFormInput, CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloud-credentials-card',
  templateUrl: './cloud-credentials-card.component.html',
  styleUrls: ['./cloud-credentials-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
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
export class CloudCredentialsCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.CloudSyncWrite];
  protected readonly searchableElements = cloudCredentialsCardElements;

  dataProvider: AsyncDataProvider<CloudSyncCredential>;
  providers = new Map<string, string>();
  credentials: CloudSyncCredential[] = [];
  columns = createTable<CloudSyncCredential>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Provider'),
      propertyName: 'provider',
      getValue: (row) => this.providers.get(row.provider) || row.provider,
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
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'cloud-cred-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Cloud Credential')],
  });

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    private chainedSlideinService: ChainedSlideInService,
    private dialog: DialogService,
    private cloudCredentialService: CloudCredentialService,
  ) {}

  ngOnInit(): void {
    const credentials$ = this.ws.call('cloudsync.credentials.query').pipe(
      tap((credentials) => this.credentials = credentials),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<CloudSyncCredential>(credentials$);
    this.setDefaultSort();
    this.getCredentials();

    this.getProviders();
  }

  getCredentials(): void {
    this.dataProvider.load();
  }

  getProviders(): void {
    this.cloudCredentialService.getProviders().pipe(untilDestroyed(this)).subscribe((providers) => {
      providers.forEach((provider) => this.providers.set(provider.name, provider.title));
    });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  doAdd(): void {
    const close$ = this.chainedSlideinService.open(CloudCredentialsFormComponent);
    close$.pipe(filter((response) => !!response.response), untilDestroyed(this)).subscribe(() => {
      this.getCredentials();
    });
  }

  doEdit(credential: CloudSyncCredential): void {
    const close$ = this.chainedSlideinService.open(
      CloudCredentialsFormComponent,
      false,
      {
        existingCredential: credential,
      } as CloudCredentialFormInput,
    );
    close$.pipe(filter((response) => !!response.response), untilDestroyed(this)).subscribe(() => {
      this.getCredentials();
    });
  }

  doDelete(credential: CloudSyncCredential): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Delete Cloud Credential'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', {
          name: credential.name,
        }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('cloudsync.credentials.delete', [credential.id])),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.getCredentials();
      });
  }
}
