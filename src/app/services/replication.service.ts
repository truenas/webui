import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { SshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { ListdirChild } from 'app/interfaces/listdir-child.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { ReplicationFormComponent } from 'app/pages/data-protection/replication/replication-form/replication-form.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from './ws.service';

@Injectable()
export class ReplicationService {
  constructor(
    protected ws: WebSocketService,
    private dialogService: DialogService,
  ) { }

  genSshKeypair(): Promise<SshKeyPair> {
    return this.ws.call('keychaincredential.generate_ssh_key_pair').toPromise();
  }

  getRemoteDataset(
    transport: TransportMode,
    sshCredentials: number,
    parentComponent: ReplicationFormComponent | ReplicationWizardComponent,
  ): Promise<ListdirChild[]> {
    const queryParams: [transport: TransportMode, credentials?: number] = [transport];
    if (transport !== TransportMode.Local) {
      queryParams.push(sshCredentials);
    }
    return this.ws.call('replication.list_datasets', queryParams).pipe(
      map((res) => {
        const nodes: ListdirChild[] = [];
        res.forEach((dataset) => {
          const pathArr = dataset.split('/');
          if (pathArr.length === 1) {
            const node: ListdirChild = {
              name: dataset,
              subTitle: pathArr[0],
              hasChildren: false,
              children: [],
            };
            nodes.push(node);
          } else {
            let parent = _.find(nodes, { name: pathArr[0] });
            let i = 1;
            while (_.find(parent.children, { subTitle: pathArr[i] })) {
              parent = _.find(parent.children, { subTitle: pathArr[i++] });
            }
            const node: ListdirChild = {
              name: dataset,
              subTitle: pathArr[i],
              hasChildren: false,
              children: [],
            };
            parent.children.push(node);
            parent.hasChildren = true;
          }
        });
        return nodes;
      }),
      catchError((err) => {
        new EntityUtils().handleWsError(parentComponent, err, this.dialogService);
        return throwError(err);
      }),
    ).toPromise();
  }

  getReplicationTasks(): Observable<ReplicationTask[]> {
    return this.ws.call('replication.query');
  }

  generateEncryptionHexKey(length: number): string {
    const characters = '0123456789abcdef';
    let res = '';
    for (let i = 0; i < length; i++) {
      res += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return res;
  }
}
