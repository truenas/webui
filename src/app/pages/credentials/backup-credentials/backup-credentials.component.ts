import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { AppTableAction } from 'app/pages/common/entity/table/table.component';
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
  cards: any;

  // Components included in this dashboard
  protected sshConnections: SshConnectionsFormComponent;
  protected sshKeypairs: SshKeypairsFormComponent;
  protected cloudCredentials: CloudCredentialsFormComponent;
  protected providers: any[];

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
      (res) => {
        this.providers = res;
        this.getCards();
      },
    );
  }

  getCards(): void {
    this.cards = [
      {
        name: 'cloudCredentials',
        flex: 40,
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
          edit(row: any) {
            this.parent.modalService.open('slide-in-form', this.parent.cloudCredentials, row.id);
          },
          dataSourceHelper: this.cloudCredentialsDataSourceHelper.bind(this),
        },
      }, {
        name: 'sshConnections',
        flex: 30,
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
          edit(row: any) {
            this.parent.modalService.open('slide-in-form', this.parent.sshConnections, row.id);
          },
        },
      }, {
        name: 'sshKeypairs',
        flex: 30,
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
          edit(row: any) {
            this.parent.modalService.open('slide-in-form', this.parent.sshKeypairs, row.id);
          },
        },
      },
    ];
  }

  cloudCredentialsDataSourceHelper(res: any[]): any[] {
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

  sshConnectionsDataSourceHelper(res: any[]): any[] {
    return res.filter((item) => item.type === KeychainCredentialType.SshCredentials);
  }

  sshKeyPairsDataSourceHelper(res: any[]): any[] {
    return res.filter((item) => item.type === KeychainCredentialType.SshKeyPair);
  }

  sshKeyPairActions(): AppTableAction[] {
    return [{
      icon: 'save_alt',
      name: 'download',
      onClick: (rowinner: any) => {
        const name = rowinner.name;
        for (const key_type in rowinner.attributes) {
          const key = rowinner.attributes[key_type];
          const filename = name + '_' + key_type + '_rsa';
          const blob = new Blob([key], { type: 'text/plain' });
          this.storage.downloadBlob(blob, filename);
        }
        event.stopPropagation();
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
