import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { zvolPath } from 'app/helpers/storage.helper';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';

export const slashRootNode: ExplorerNodeData = {
  path: '/',
  name: '/',
  hasChildren: true,
  type: ExplorerNodeType.Directory,
  isProvidedRoot: true,
};

export const emptyRootNode: ExplorerNodeData = {
  path: '',
  name: '',
  isProvidedRoot: true,
  hasChildren: true,
  type: ExplorerNodeType.Directory,
};

export const rootZvolNode = {
  path: zvolPath,
  name: zvolPath,
  hasChildren: true,
  isProvidedRoot: true,
  type: ExplorerNodeType.Directory,
} as ExplorerNodeData;

export const rootDatasetNode = {
  path: mntPath,
  isProvidedRoot: true,
  name: mntPath,
  hasChildren: true,
  type: ExplorerNodeType.Directory,
};
