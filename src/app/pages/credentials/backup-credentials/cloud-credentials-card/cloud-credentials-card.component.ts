import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { switchMap, filter, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { cloudCredentialsCardElements } from 'app/pages/credentials/backup-credentials/cloud-credentials-card/cloud-credentials-card.elements';
import { CloudCredentialFormInput, CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloud-credentials-card',
  templateUrl: './cloud-credentials-card.component.html',
  styleUrls: ['./cloud-credentials-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
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
    private chainedSlideinService: IxChainedSlideInService,
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
