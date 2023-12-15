import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { FileAttribute } from 'app/enums/file-attribute.enum';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
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
    includeSnapshots?: boolean;
  }): TreeNodeProvider {
    const options = {
      directoriesOnly: false,
      showHiddenFiles: false,
      includeSnapshots: true,
      ...providerOptions,
    };

    return (node: TreeNode<ExplorerNodeData>) => {
      const typeFilter: [QueryFilter<FileRecord>?] = [];
      if (options.directoriesOnly) {
        typeFilter.push(['type', '=', FileType.Directory]);
      }

      if (!options.includeSnapshots) {
        typeFilter.push(['is_ctldir', '=', false]);
      }

      return this.ws.call(
        'filesystem.listdir',
        [node.data.path, typeFilter, { order_by: ['name'], limit: 1000 }],
      ).pipe(
        map((files) => {
          const children: ExplorerNodeData[] = [];
          files.forEach((file) => {
            if (file.type === FileType.Symlink || !file.hasOwnProperty('name')) {
              return;
            }

            if (!options.showHiddenFiles && file.name.startsWith('.')) {
              return;
            }

            children.push({
              path: file.path,
              name: file.name,
              isMountpoint: file.attributes.includes(FileAttribute.MountRoot),
              isLock: file.attributes.includes(FileAttribute.Immutable),
              type: file.type === FileType.Directory ? ExplorerNodeType.Directory : ExplorerNodeType.File,
              hasChildren: file.type === FileType.Directory,
            });
          });

          return children;
        }),
      );
    };
  }
}
