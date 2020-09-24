import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService, KeychainCredentialService, AppLoaderService, 
  DialogService, ReplicationService, StorageService, CloudCredentialService } from 'app/services';
import { ModalService } from '../../../services/modal.service';
import { SshConnectionsFormComponent } from './forms/ssh-connections-form.component';
import { SshKeypairsFormComponent } from './forms/ssh-keypairs-form.component';
import { CloudCredentialsFormComponent } from './forms/cloud-credentials-form.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-backup-credentials',
  templateUrl: './backup-credentials.component.html',
  providers: [KeychainCredentialService, ReplicationService, CloudCredentialService]
})
export class BackupCredentialsComponent implements OnInit, OnDestroy {
  cards: any;
  refreshTable: Subscription;

  // Components included in this dashboard
  protected sshConnections: SshConnectionsFormComponent;
  protected sshKeypairs: SshKeypairsFormComponent;
  protected cloudCredentials: CloudCredentialsFormComponent;


  constructor(private aroute: ActivatedRoute, private keychainCredentialService: KeychainCredentialService,
    private ws: WebSocketService, private loader: AppLoaderService, private dialogService: DialogService,
     private replicationService: ReplicationService, private storage: StorageService,
     private cloudCredentialsService: CloudCredentialService, private router: Router,
     private modalService: ModalService) {}

  ngOnInit(): void {
    this.getCards();
    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.getCards();
    })
    this.refreshForms();
    this.modalService.refreshForm$.subscribe(() => {
      this.refreshForms();
    });
  }

  getCards() {
    this.cards = [
      { name: 'cloudCredentials', flex: 40,
        tableConf: {
          title: 'Cloud Credentials',
          queryCall: 'cloudsync.credentials.query',
          deleteCall: 'cloudsync.credentials.delete',
          columns: [
            { name: 'Name', prop: 'name' },
            { name: 'Provider', prop: 'provider'}
          ],
          hideHeader: false,
          parent: this,
          add: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.cloudCredentials);
          },
          edit: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.cloudCredentials, row.id);
          }
        }
      },{ 
        name: 'sshConnections', flex: 30,
        tableConf: {
          title: 'SSH Connections',
          queryCall: 'keychaincredential.query',
          deleteCall: 'keychaincredential.delete',
          dataSourceHelper: this.sshConnectionsDataSourceHelper,
          columns: [
            { name: 'Name', prop: 'name' },
          ],
          hideHeader: false,
          parent: this,
          add: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.sshConnections);
          },
          edit: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.sshConnections, row.id);
          }
        }
      },{
        name: 'sshKeypairs', flex: 30,
        tableConf: {
          title: 'SSH Keypairs',
          queryCall: 'keychaincredential.query',
          deleteCall: 'keychaincredential.delete',
          dataSourceHelper: this.sshKeyPairsDataSourceHelper,
          columns: [
            { name: 'Name', prop: 'name' },
          ],
          hideHeader: false,
          parent: this,
          add: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.sshKeypairs);
          },
          edit: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.sshKeypairs, row.id);
          },
        }
      }
    ];
  }

  sshConnectionsDataSourceHelper(res) {
    return res.filter(item => item.type === 'SSH_CREDENTIALS');
  }

  sshKeyPairsDataSourceHelper(res) {
    return res.filter(item => item.type === 'SSH_KEY_PAIR');
  }

  refreshForms() {
    this.sshConnections = new SshConnectionsFormComponent(this.aroute,this.keychainCredentialService,
      this.ws,this.loader, this.dialogService, this.replicationService, this.modalService);
    this.sshKeypairs = new SshKeypairsFormComponent(this.aroute,this.ws,this.loader,
      this.dialogService,this.storage,this.modalService);
    this.cloudCredentials = new CloudCredentialsFormComponent(this.router, this.aroute,this.ws,
      this.cloudCredentialsService, this.dialogService, this.replicationService,this.modalService);
  }

  ngOnDestroy() {
    this.refreshTable.unsubscribe();
  }

}
