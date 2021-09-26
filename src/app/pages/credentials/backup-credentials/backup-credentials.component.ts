import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { AppTableAction, AppTableConfig } from 'app/pages/common/entity/table/table.component';
import {
  WebSocketService, KeychainCredentialService, AppLoaderService,
  DialogService, ReplicationService, StorageService, CloudCredentialService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { CloudCredentialsFormComponent } from './forms/cloud-credentials-form.component';
import { SshConnectionsFormComponent } from './forms/ssh-connections-form.component';
import { SshKeypairsFormComponent } from './forms/ssh-keypairs-form.component';

@UntilDestroy()
@Component({
  selector: 'app-backup-credentials',
  templateUrl: './backup-credentials.component.html',
  providers: [KeychainCredentialService, ReplicationService, CloudCredentialService],
})
export class BackupCredentialsComponent implements OnInit {
  cards: { name: string; tableConf: AppTableConfig }[];

  // Components included in this dashboard
  protected sshConnections: SshConnectionsFormComponent;
  protected sshKeypairs: SshKeypairsFormComponent;
  protected cloudCredentials: CloudCredentialsFormComponent;
  protected providers: CloudsyncProvider[];

  constructor(private aroute: ActivatedRoute, private keychainCredentialService: KeychainCredentialService,
    private ws: WebSocketService, private loader: AppLoaderService, private dialogService: DialogService,
    private replicationService: ReplicationService, private storage: StorageService,
    private cloudCredentialsService: CloudCredentialService, private router: Router,
    private modalService: ModalService) {}

  ngOnInit(): void {
    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getCards();
    });
    this.refreshForms();
    this.modalService.refreshForm$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshForms();
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
            { name: T('Name'), prop: 'name' },
            { name: T('Provider'), prop: 'provider' },
          ],
          hideHeader: false,
          parent: this,
          add() {
            this.parent.modalService.open('slide-in-form', this.parent.cloudCredentials);
          },
          edit(row: CloudsyncCredential) {
            this.parent.modalService.open('slide-in-form', this.parent.cloudCredentials, row.id);
          },
          dataSourceHelper: this.cloudCredentialsDataSourceHelper.bind(this),
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
            { name: T('Name'), prop: 'name' },
          ],
          hideHeader: true,
          parent: this,
          add() {
            this.parent.modalService.open('slide-in-form', this.parent.sshConnections);
          },
          edit(row: KeychainCredential) {
            this.parent.modalService.open('slide-in-form', this.parent.sshConnections, row.id);
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
            { name: T('Name'), prop: 'name' },
          ],
          hideHeader: true,
          parent: this,
          add() {
            this.parent.modalService.open('slide-in-form', this.parent.sshKeypairs);
          },
          edit(row: KeychainCredential) {
            this.parent.modalService.open('slide-in-form', this.parent.sshKeypairs, row.id);
          },
        },
      },
    ];
  }

  cloudCredentialsDataSourceHelper(res: CloudsyncCredential[]): CloudsyncCredential[] {
    return res.map((item) => {
      if (this.providers) {
        const credentialProvider = this.providers.find((provider) => provider.name == item.provider);
        if (credentialProvider) {
          item.provider = credentialProvider.title;
        }
      }
      return item;
    });
  }

  sshConnectionsDataSourceHelper(res: KeychainCredential[]): KeychainCredential[] {
    return res.filter((item) => item.type === KeychainCredentialType.SshCredentials);
  }

  sshKeyPairsDataSourceHelper(res: KeychainCredential[]): KeychainCredential[] {
    return res.filter((item) => item.type === KeychainCredentialType.SshKeyPair);
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
          const blob = new Blob([key as any], { type: 'text/plain' });
          this.storage.downloadBlob(blob, filename);
        }
        event.stopPropagation(); // eslint-disable-line no-restricted-globals
      },
    }];
  }

  refreshForms(): void {
    this.sshConnections = new SshConnectionsFormComponent(this.aroute, this.keychainCredentialService,
      this.ws, this.loader, this.dialogService, this.replicationService, this.modalService);
    this.sshKeypairs = new SshKeypairsFormComponent(this.aroute, this.ws, this.loader,
      this.dialogService, this.storage, this.modalService);
    this.cloudCredentials = new CloudCredentialsFormComponent(this.router, this.aroute, this.ws,
      this.cloudCredentialsService, this.dialogService, this.replicationService, this.modalService);
  }
}
