import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { switchMap, filter, tap } from 'rxjs';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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
  dataProvider: AsyncDataProvider<CloudsyncCredential>;
  providers = new Map<string, string>();
  credentials: CloudsyncCredential[] = [];
  columns = createTable<CloudsyncCredential>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Provider'),
      propertyName: 'provider',
      getValue: (row) => this.providers.get(row.provider) || row.provider,
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ]);

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    private dialog: DialogService,
    private cloudCredentialService: CloudCredentialService,
  ) {}

  ngOnInit(): void {
    const credentials$ = this.ws.call('cloudsync.credentials.query').pipe(
      tap((credentials) => this.credentials = credentials),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<CloudsyncCredential>(credentials$);
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
    const slideInRef = this.slideInService.open(CloudCredentialsFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCredentials();
    });
  }

  doEdit(credential: CloudsyncCredential): void {
    const slideInRef = this.slideInService.open(CloudCredentialsFormComponent, { data: credential });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCredentials();
    });
  }

  doDelete(credential: CloudsyncCredential): void {
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
