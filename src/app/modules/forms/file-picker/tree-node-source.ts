import {
  FilePickerCallbacks, FilePickerSource, FileSystemItem, tnIconMarker,
} from '@truenas/ui-components';
import { firstValueFrom } from 'rxjs';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { zvolPath } from 'app/helpers/storage.helper';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { TreeNodeProvider } from 'app/modules/forms/file-picker/tree-node-provider.interface';

/**
 * Adapts a {@link TreeNodeProvider} (middleware filesystem/dataset listings) and its root nodes
 * to a `tn-file-picker` `[source]`. Build one with the `filePickerSource` pipe.
 *
 * Paths come in two spaces:
 * - provider space — what providers, root nodes and the form value use. Usually absolute
 *   (`/mnt/tank`), but some providers (replication datasets, pool.filesystem_choices) work with
 *   relative dataset names under an empty root (`tank/child`).
 * - picker space — what `tn-file-picker` browses with, always slash-rooted. Relative names get a
 *   leading slash (`/tank/child`); `valueRoot: '/'` maps them back for the form value.
 */
export class TreeNodeSource implements FilePickerSource {
  readonly callbacks: FilePickerCallbacks = {
    getChildren: (path) => this.loadChildren(path),
  };

  readonly rootPath: string;
  readonly startPath: string;
  readonly valueRoot: string | undefined;

  /** True when the provider works with relative dataset names (see class docs). */
  readonly usesRelativePaths: boolean;

  /**
   * Every node served to the picker, indexed by its picker-space path. Used to serve children
   * for providers that return a pre-built nested tree.
   */
  private nodesByPath = new Map<string, ExplorerNodeData>();

  constructor(
    /** Unset while a host is still resolving its provider: every listing is then empty. */
    private provider: TreeNodeProvider | undefined,
    private rootNodes: ExplorerNodeData[],
    private toErrorMessage: (error: unknown) => string | undefined,
  ) {
    this.usesRelativePaths = !(rootNodes[0]?.path ?? '/').startsWith('/');

    // The static single roots (`[datasetsRootNode]` → /mnt, `[zvolsRootNode]` → /dev/zvol)
    // become the picker root directly: browsing starts inside them and cannot navigate above
    // them. Everything else — multiple roots, relative roots, and dynamic single roots like
    // smb's per-pool nodes (whose count varies per system, so rooting inside one would make the
    // same form behave differently across systems) — falls back to `/`, with the top-level
    // listing synthesized from the root nodes (see `loadChildren`). Only browsing is confined:
    // typed paths are committed verbatim (`allowFreeText`).
    const isStaticRoot = rootNodes.length === 1 && [mntPath, zvolPath].includes(rootNodes[0].path);
    this.rootPath = isStaticRoot ? rootNodes[0].path : '/';
    this.startPath = this.rootPath;
    this.valueRoot = this.usesRelativePaths ? '/' : undefined;

    this.indexNodes(rootNodes);
  }

  toPickerPath(path: string): string {
    if (this.usesRelativePaths && path && !path.startsWith('/')) {
      return `/${path}`;
    }
    return path;
  }

  fromPickerPath(path: string): string {
    if (this.usesRelativePaths && path.startsWith('/')) {
      return path.slice(1);
    }
    return path;
  }

  /**
   * Creation flows report an absolute mountpoint even when the source works with relative
   * dataset names — map one into picker space.
   */
  mountpointToPickerPath(mountpoint: string): string {
    const path = this.usesRelativePaths ? mountpoint.replace(/^\/mnt\/?/, '') : mountpoint;
    return this.toPickerPath(path);
  }

  private async loadChildren(pickerPath: string): Promise<FileSystemItem[]> {
    if (!this.provider) {
      return [];
    }

    if (pickerPath === '/') {
      // Top level = the root nodes themselves. Roots with an empty or `/` path mean "list the
      // filesystem root through the provider" instead (providers special-case that path).
      const roots = this.rootNodes.filter((root) => root.path && root.path !== '/');
      if (roots.length) {
        return roots.map((node) => this.toFileItem(node));
      }
    }

    const requestedPath = this.fromPickerPath(pickerPath);
    const requestedNode = {
      data: {
        path: requestedPath,
        name: requestedPath.split('/').findLast((segment) => segment.length > 0) ?? requestedPath,
        type: ExplorerNodeType.Directory,
        hasChildren: true,
      },
    } as TreeNode<ExplorerNodeData>;

    let nodes: ExplorerNodeData[];
    try {
      nodes = await firstValueFrom(this.provider(requestedNode));
    } catch (error: unknown) {
      // The picker shows the message of a rejected listing above the listing, and falls back
      // to a generic one for anything that is not an Error.
      const message = this.toErrorMessage(error);
      throw message ? new Error(message) : error;
    }

    this.indexNodes(nodes);
    return this.resolveChildren(requestedPath, nodes).map((node) => this.toFileItem(node));
  }

  private indexNodes(nodes: ExplorerNodeData[]): void {
    for (const node of nodes) {
      this.nodesByPath.set(this.toPickerPath(node.path), node);
      if (node.children?.length) {
        this.indexNodes(node.children);
      }
    }
  }

  /**
   * Most providers return the children of the requested directory, but some
   * (e.g. `DatasetService.getDatasetNodeProvider`) ignore the requested node and return their
   * whole tree with nested `children` on every call. When nothing in the response is under the
   * requested path, serve the nested children indexed from the response instead.
   */
  private resolveChildren(requestedPath: string, response: ExplorerNodeData[]): ExplorerNodeData[] {
    const isUnderRequested = (path: string): boolean => {
      if (!requestedPath || requestedPath === '/') {
        return path !== requestedPath;
      }
      return path.startsWith(`${requestedPath}/`);
    };

    if (response.some((node) => isUnderRequested(node.path))) {
      return response;
    }

    const cached = this.nodesByPath.get(this.toPickerPath(requestedPath));
    // An empty `children` array is a leaf in the pre-built tree, not a missing listing.
    if (cached?.children) {
      return cached.children;
    }
    return response;
  }

  private toFileItem(node: ExplorerNodeData): FileSystemItem {
    let type: FileSystemItem['type'];
    let icon: string | undefined;

    switch (node.type) {
      case ExplorerNodeType.File:
        type = 'file';
        break;
      case ExplorerNodeType.Symlink:
        // Zvol block devices are exposed as symlinks under /dev/zvol.
        if (node.path.startsWith(zvolPath)) {
          type = 'zvol';
        } else {
          type = 'file';
          icon = tnIconMarker('database', 'mdi');
        }
        break;
      default:
        type = node.isMountpoint ? 'dataset' : 'folder';
        if (node.isLock) {
          icon = tnIconMarker('folder-lock', 'mdi');
        }
        break;
    }

    return {
      path: this.toPickerPath(node.path),
      name: node.name,
      type,
      ...(icon ? { icon } : {}),
    };
  }
}
