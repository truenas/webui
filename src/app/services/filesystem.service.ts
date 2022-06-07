import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { TreeNode, ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/ix-explorer.component';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({ providedIn: 'root' })
export class FilesystemService {
  constructor(
    private ws: WebSocketService,
  ) {}

  /**
   * Returns a pre-configured node provider for files and directories.
   */
  getFilesystemNodeProvider(providerOptions?: {
    directoriesOnly?: boolean;
    showHiddenFiles?: boolean;
  }): TreeNodeProvider {
    const options = {
      directoriesOnly: false,
      showHiddenFiles: false,
      ...providerOptions,
    };

    return (node: TreeNode<ExplorerNodeData>) => {
      let typeFilter: [QueryFilter<FileRecord>?] = [];
      if (options.directoriesOnly) {
        typeFilter = [['type', '=', FileType.Directory]];
      }

      return this.ws.call(
        'filesystem.listdir',
        [node.data.path, typeFilter, { order_by: ['name'], limit: 1000 }],
      ).pipe(
        map((response) => {
          const children: ExplorerNodeData[] = [];
          response.forEach((file) => {
            if (file.type === FileType.Symlink || !file.hasOwnProperty('name')) {
              return;
            }

            if (!options.showHiddenFiles && file.name.startsWith('.')) {
              return;
            }

            children.push({
              path: file.path,
              name: file.name,
              hasChildren: file.type === FileType.Directory,
            });
          });

          return children;
        }),
      );
    };
  }
}
