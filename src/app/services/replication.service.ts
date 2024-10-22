import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { Role } from 'app/enums/role.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { WebSocketService } from 'app/services/api.service';
import { AuthService } from 'app/services/auth/auth.service';

@Injectable()
export class ReplicationService {
  constructor(
    protected ws: WebSocketService,
    private authService: AuthService,
  ) { }

  getTreeNodeProvider(providerOptions: {
    transport: TransportMode;
    sshCredential: number;
  }): TreeNodeProvider {
    let cachedDatasets: string[] = null;

    return (node: TreeNode<ExplorerNodeData>) => {
      const searchPath = node.data.path;
      const childDatasets$ = cachedDatasets
        ? of(cachedDatasets)
        : this.authService.hasRole([
          Role.ReplicationTaskWrite,
          Role.ReplicationTaskWritePull,
        ]).pipe(
          switchMap((hasRole) => {
            if (hasRole) {
              return this.ws.call(
                'replication.list_datasets',
                [providerOptions.transport, providerOptions.sshCredential],
              ).pipe(tap((datasets) => cachedDatasets = datasets));
            }
            return of([] as string[]);
          }),
        );

      return childDatasets$.pipe(map((datasets) => {
        return datasets
          .filter((dataset) => {
            const currentLevel = searchPath.split('/').length;
            const datasetLevel = dataset.split('/').length;
            if (!searchPath && datasetLevel === 1) {
              return true;
            }

            return dataset.startsWith(`${searchPath}/`) && datasetLevel === currentLevel + 1;
          })
          .map((dataset) => {
            return {
              path: dataset,
              name: dataset.split('/').pop(),
              type: ExplorerNodeType.Directory,
              hasChildren: cachedDatasets.some((cachedDataset) => {
                return cachedDataset.startsWith(`${dataset}/`) && cachedDataset !== dataset;
              }),
            };
          });
      }));
    };
  }

  getReplicationTasks(): Observable<ReplicationTask[]> {
    return this.ws.call('replication.query');
  }

  generateEncryptionHexKey(length: number): string {
    const characters = '0123456789abcdef';
    let encryptionKey = '';
    for (let i = 0; i < length; i++) {
      encryptionKey += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return encryptionKey;
  }
}
