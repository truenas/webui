import { Component, OnInit } from '@angular/core';
import { Navigation, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import {
  KeychainCredential,
  KeychainSshCredentials,
  KeychainSshKeyPair,
} from 'app/interfaces/keychain-credential.interface';
import { AppTableAction, AppTableConfig } from 'app/modules/entity/table/table.component';
import {
  CloudCredentialsFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import {
  SshConnectionFormComponent,
} from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import {
  KeychainCredentialService, ReplicationService, StorageService, CloudCredentialService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './backup-credentials.component.html',
  providers: [KeychainCredentialService, ReplicationService, CloudCredentialService],
})
export class BackupCredentialsComponent implements OnInit {
  cards: { name: string; tableConf: AppTableConfig }[];

  private navigation: Navigation;
  protected providers: CloudsyncProvider[];
  private isFirstCredentialsLoad = true;

  constructor(
    private router: Router,
    private storage: StorageService,
    private cloudCredentialsService: CloudCredentialService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
  ) {
    this.navigation = this.router.getCurrentNavigation();
  }

  ngOnInit(): void {
    this.cloudCredentialsService.getProviders().pipe(untilDestroyed(this)).subscribe(
      (providers) => {
        this.providers = providers;
        this.getCards();
      },
    );
  }

  getCards(): void {
    this.cards = [
      {
        name: 'cloudCredentials',
        tableConf: {
          title: 'Cloud Credentials',
          queryCall: 'cloudsync.credentials.query',
          deleteCall: 'cloudsync.credentials.delete',
          name: 'cloudCreds',
          columns: [
            { name: this.translate.instant('Name'), prop: 'name' },
            { name: this.translate.instant('Provider'), prop: 'providerTitle' },
          ],
          hideHeader: false,
          parent: this,
          add: () => {
            const slideInRef = this.slideInService.open(CloudCredentialsFormComponent);
            slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCards());
          },
          edit: (credential: CloudsyncCredential) => {
            const slideInRef = this.slideInService.open(CloudCredentialsFormComponent, { data: credential });
            slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCards());
          },
          dataSourceHelper: this.cloudCredentialsDataSourceHelper.bind(this),
          afterGetData: (credentials: CloudsyncCredential[]) => {
            const state = this.navigation.extras.state as { editCredential: string; id: string };
            if (!state || state.editCredential !== 'cloudcredentials' || !this.isFirstCredentialsLoad) {
              return;
            }

            const credentialToEdit = credentials.find((credential) => credential.id === Number(state.id));
            if (!credentialToEdit) {
              return;
            }

            const slideInRef = this.slideInService.open(CloudCredentialsFormComponent, { data: credentialToEdit });
            slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCards());
            this.isFirstCredentialsLoad = false;
          },
        },
      }, {
        name: 'sshConnections',
        tableConf: {
          title: 'SSH Connections',
          queryCall: 'keychaincredential.query',
          deleteCall: 'keychaincredential.delete',
          name: 'sshConnections',
          dataSourceHelper: this.sshConnectionsDataSourceHelper,
          columns: [
            { name: this.translate.instant('Name'), prop: 'name' },
          ],
          hideHeader: true,
          parent: this,
          add: () => {
            const slideInRef = this.slideInService.open(SshConnectionFormComponent);
            slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCards());
          },
          edit: (row: KeychainSshCredentials) => {
            const slideInRef = this.slideInService.open(SshConnectionFormComponent, { data: row });
            slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCards());
          },
        },
      }, {
        name: 'sshKeypairs',
        tableConf: {
          title: 'SSH Keypairs',
          queryCall: 'keychaincredential.query',
          deleteCall: 'keychaincredential.delete',
          name: 'sshKeypairs',
          getActions: this.sshKeyPairActions.bind(this),
          dataSourceHelper: this.sshKeyPairsDataSourceHelper,
          columns: [
            { name: this.translate.instant('Name'), prop: 'name' },
          ],
          hideHeader: true,
          parent: this,
          add: () => {
            const slideInRef = this.slideInService.open(SshKeypairFormComponent);
            slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCards());
          },
          edit: (row: KeychainSshKeyPair) => {
            const slideInRef = this.slideInService.open(SshKeypairFormComponent, { data: row });
            slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCards());
          },
        },
      },
    ];
  }

  cloudCredentialsDataSourceHelper(
    credentials: CloudsyncCredential[],
  ): (CloudsyncCredential & { providerTitle?: string })[] {
    return credentials.map((credential) => {
      if (this.providers) {
        const credentialProvider = this.providers.find((provider) => provider.name === credential.provider);
        if (credentialProvider) {
          return {
            ...credential,
            providerTitle: credentialProvider.title,
          };
        }
      }
      return credential;
    });
  }

  sshConnectionsDataSourceHelper(credentials: KeychainCredential[]): KeychainSshCredentials[] {
    return credentials.filter((credential) => {
      return credential.type === KeychainCredentialType.SshCredentials;
    }) as KeychainSshCredentials[];
  }

  sshKeyPairsDataSourceHelper(credentials: KeychainCredential[]): KeychainSshKeyPair[] {
    return credentials.filter((credential) => {
      return credential.type === KeychainCredentialType.SshKeyPair;
    }) as KeychainSshKeyPair[];
  }

  sshKeyPairActions(): AppTableAction<KeychainCredential>[] {
    return [{
      icon: 'save_alt',
      name: 'download',
      onClick: (rowinner: KeychainCredential) => {
        const name = rowinner.name;
        Object.keys(rowinner.attributes).forEach((keyType) => {
          const key = rowinner.attributes[keyType as keyof KeychainCredential['attributes']];
          const filename = name + '_' + keyType + '_rsa';
          const blob = new Blob([key as BlobPart], { type: 'text/plain' });
          this.storage.downloadBlob(blob, filename);
        });
      },
    }];
  }
}
