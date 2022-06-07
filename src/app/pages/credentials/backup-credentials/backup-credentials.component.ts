import { Component, OnInit } from '@angular/core';
import { Navigation, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
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
  SshConnectionFormComponent,
} from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import {
  KeychainCredentialService, ReplicationService, StorageService, CloudCredentialService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';
import { CloudCredentialsFormComponent } from './forms/cloud-credentials-form.component';

@UntilDestroy()
@Component({
  selector: 'app-backup-credentials',
  templateUrl: './backup-credentials.component.html',
  providers: [KeychainCredentialService, ReplicationService, CloudCredentialService],
})
export class BackupCredentialsComponent implements OnInit {
  cards: { name: string; tableConf: AppTableConfig }[];

  private navigation: Navigation;
  protected providers: CloudsyncProvider[];

  constructor(
    private router: Router,
    private storage: StorageService,
    private cloudCredentialsService: CloudCredentialService,
    private modalService: ModalService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
  ) {
    this.navigation = this.router.getCurrentNavigation();
  }

  ngOnInit(): void {
    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getCards();
    });

    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getCards();
    });

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
            { name: this.translate.instant('Provider'), prop: 'provider' },
          ],
          hideHeader: false,
          parent: this,
          add: () => {
            this.modalService.openInSlideIn(CloudCredentialsFormComponent);
          },
          edit: (row: CloudsyncCredential) => {
            this.modalService.openInSlideIn(CloudCredentialsFormComponent, row.id);
          },
          dataSourceHelper: this.cloudCredentialsDataSourceHelper.bind(this),
          afterGetData: () => {
            const state = this.navigation.extras.state as { editCredential: string; id: string };
            if (state && state.editCredential) {
              if (state.editCredential === 'cloudcredentials') {
                this.modalService.openInSlideIn(CloudCredentialsFormComponent, state.id);
              }
            }
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
            this.slideInService.open(SshConnectionFormComponent);
          },
          edit: (row: KeychainSshCredentials) => {
            const form = this.slideInService.open(SshConnectionFormComponent);
            form.setConnectionForEdit(row);
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
            this.slideInService.open(SshKeypairFormComponent);
          },
          edit: (row: KeychainSshKeyPair) => {
            const modal = this.slideInService.open(SshKeypairFormComponent);
            modal.setKeypairForEditing(row);
          },
        },
      },
    ];
  }

  cloudCredentialsDataSourceHelper(res: CloudsyncCredential[]): CloudsyncCredential[] {
    return res.map((item) => {
      if (this.providers) {
        const credentialProvider = this.providers.find((provider) => provider.name === item.provider);
        if (credentialProvider) {
          item.provider = credentialProvider.title;
        }
      }
      return item;
    });
  }

  sshConnectionsDataSourceHelper(res: KeychainCredential[]): KeychainSshCredentials[] {
    return res.filter((item) => {
      return item.type === KeychainCredentialType.SshCredentials;
    }) as KeychainSshCredentials[];
  }

  sshKeyPairsDataSourceHelper(res: KeychainCredential[]): KeychainSshKeyPair[] {
    return res.filter((item) => {
      return item.type === KeychainCredentialType.SshKeyPair;
    }) as KeychainSshKeyPair[];
  }

  sshKeyPairActions(): AppTableAction<KeychainCredential>[] {
    return [{
      icon: 'save_alt',
      name: 'download',
      onClick: (rowinner: KeychainCredential) => {
        const name = rowinner.name;
        for (const keyType in rowinner.attributes) {
          const key = rowinner.attributes[keyType as keyof KeychainCredential['attributes']];
          const filename = name + '_' + keyType + '_rsa';
          const blob = new Blob([key as BlobPart], { type: 'text/plain' });
          this.storage.downloadBlob(blob, filename);
        }
      },
    }];
  }
}
