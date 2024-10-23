import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { find } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { isRootShare } from 'app/pages/sharing/utils/smb.utils';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({ providedIn: 'root' })
export class DatasetService {
  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
    private translate: TranslateService,
  ) {}

  getDatasetNodeProvider(): TreeNodeProvider {
    return () => {
      return this.ws.call('pool.filesystem_choices').pipe(
        map((filesystems) => {
          const nodes: ExplorerNodeData[] = [];
          filesystems.forEach((filesystem) => {
            const pathSegments = filesystem.split('/');
            if (pathSegments.length === 1) {
              nodes.push({
                name: filesystem,
                hasChildren: false,
                path: filesystem,
                type: ExplorerNodeType.Directory,
                children: [],
              });
              return;
            }

            let parent = find(nodes, { name: pathSegments[0] });
            let i = 1;
            while (find(parent.children, { name: pathSegments[i] })) {
              parent = find(parent.children, { name: pathSegments[i++] });
            }

            parent.children.push({
              name: pathSegments[pathSegments.length - 1],
              children: [],
              hasChildren: false,
              type: ExplorerNodeType.Directory,
              path: filesystem,
            });
            parent.hasChildren = true;
          });

          return nodes;
        }),
      );
    };
  }

  rootLevelDatasetWarning(path: string, message: string, skip = false): Observable<boolean> {
    return isRootShare(path) && !skip
      ? this.dialog.confirm({
        title: this.translate.instant('Warning'),
        message,
      })
      : of(true);
  }
}
