import { Observable, of, throwError } from 'rxjs';
import { datasetsRootNode, emptyRootNode, zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { TreeNodeSource } from 'app/modules/forms/file-picker/tree-node-source';

describe('TreeNodeSource', () => {
  const provider = jest.fn((): Observable<ExplorerNodeData[]> => of([]));
  const toErrorMessage = jest.fn((): string | undefined => 'Provider error');

  function createSource(rootNodes: ExplorerNodeData[]): TreeNodeSource {
    return new TreeNodeSource(provider, rootNodes, toErrorMessage);
  }

  function listing(source: TreeNodeSource, path: string): ReturnType<NonNullable<TreeNodeSource['callbacks']['getChildren']>> {
    return source.callbacks.getChildren!(path);
  }

  beforeEach(() => {
    provider.mockReset();
    provider.mockReturnValue(of<ExplorerNodeData[]>([]));
  });

  describe('roots', () => {
    it('confines the picker to a single static root', () => {
      expect(createSource([datasetsRootNode])).toMatchObject({ rootPath: mntPath, startPath: mntPath });
      expect(createSource([zvolsRootNode])).toMatchObject({ rootPath: '/dev/zvol', startPath: '/dev/zvol' });
    });

    it('falls back to / for a dynamic single root, listing it at the top level', async () => {
      const source = createSource([{
        hasChildren: true, name: 'dozer', path: '/mnt/dozer', type: ExplorerNodeType.Directory, isMountpoint: true,
      }]);

      expect(source.rootPath).toBe('/');
      expect(await listing(source, '/')).toEqual([{ path: '/mnt/dozer', name: 'dozer', type: 'dataset' }]);
      expect(provider).not.toHaveBeenCalled();
    });

    it('falls back to / and lists several roots at the top level', async () => {
      const source = createSource([
        {
          hasChildren: true, name: 'pool1', path: '/mnt/pool1', type: ExplorerNodeType.Directory, isMountpoint: true,
        },
        {
          hasChildren: true, name: 'pool2', path: '/mnt/pool2', type: ExplorerNodeType.Directory, isMountpoint: true,
        },
      ]);

      expect(source.rootPath).toBe('/');
      expect(await listing(source, '/')).toEqual([
        { path: '/mnt/pool1', name: 'pool1', type: 'dataset' },
        { path: '/mnt/pool2', name: 'pool2', type: 'dataset' },
      ]);
    });

    it('lists nothing while the provider is still unset', async () => {
      const source = new TreeNodeSource(undefined, [datasetsRootNode], toErrorMessage);

      expect(await listing(source, mntPath)).toEqual([]);
    });
  });

  describe('listing', () => {
    it('calls the provider with the requested path and maps nodes to file items', async () => {
      provider.mockReturnValue(of([
        {
          path: '/mnt/tank', name: 'tank', type: ExplorerNodeType.Directory, hasChildren: true, isMountpoint: true,
        },
        {
          path: '/mnt/dir', name: 'dir', type: ExplorerNodeType.Directory, hasChildren: true,
        },
        {
          path: '/mnt/locked', name: 'locked', type: ExplorerNodeType.Directory, hasChildren: false, isLock: true,
        },
        {
          path: '/mnt/file.txt', name: 'file.txt', type: ExplorerNodeType.File, hasChildren: false,
        },
      ]));

      const items = await listing(createSource([datasetsRootNode]), mntPath);

      expect(provider).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ path: mntPath }) }),
      );
      expect(items).toEqual([
        { path: '/mnt/tank', name: 'tank', type: 'dataset' },
        { path: '/mnt/dir', name: 'dir', type: 'folder' },
        {
          path: '/mnt/locked', name: 'locked', type: 'folder', icon: 'mdi-folder-lock',
        },
        { path: '/mnt/file.txt', name: 'file.txt', type: 'file' },
      ]);
    });

    it('maps symlinks under /dev/zvol to zvol items', async () => {
      provider.mockReturnValue(of([
        {
          path: '/dev/zvol/tank/vol1', name: 'vol1', type: ExplorerNodeType.Symlink, hasChildren: false,
        },
      ]));

      expect(await listing(createSource([zvolsRootNode]), '/dev/zvol/tank')).toEqual([
        { path: '/dev/zvol/tank/vol1', name: 'vol1', type: 'zvol' },
      ]);
    });

    it('rejects a failed listing with the parsed error message, for the picker to show', async () => {
      provider.mockReturnValue(throwError(() => new Error('ENOENT')));

      await expect(listing(createSource([datasetsRootNode]), mntPath)).rejects.toThrow('Provider error');
    });

    it('passes an unparseable failure through, for the picker to word generically', async () => {
      const failure = new Error('unexpected');
      provider.mockReturnValue(throwError(() => failure));
      toErrorMessage.mockReturnValueOnce(undefined);

      await expect(listing(createSource([datasetsRootNode]), mntPath)).rejects.toBe(failure);
    });
  });

  describe('relative dataset names', () => {
    let source: TreeNodeSource;

    beforeEach(() => {
      source = createSource([emptyRootNode]);
    });

    it('roots the picker at / and maps values against /', () => {
      expect(source).toMatchObject({ rootPath: '/', startPath: '/', valueRoot: '/' });
      expect(createSource([datasetsRootNode]).valueRoot).toBeUndefined();
    });

    it('lists the provider root and prefixes provider paths with a slash', async () => {
      provider.mockReturnValue(of([
        {
          path: 'tank', name: 'tank', type: ExplorerNodeType.Directory, hasChildren: true, isMountpoint: true,
        },
      ]));

      const items = await listing(source, '/');

      expect(provider).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ path: '' }) }),
      );
      expect(items).toEqual([{ path: '/tank', name: 'tank', type: 'dataset' }]);
    });

    it('serves nested children for providers that return their whole tree on every call', async () => {
      provider.mockReturnValue(of([
        {
          path: 'tank',
          name: 'tank',
          type: ExplorerNodeType.Directory,
          hasChildren: true,
          isMountpoint: true,
          children: [
            {
              path: 'tank/child', name: 'child', type: ExplorerNodeType.Directory, hasChildren: false, isMountpoint: true,
            },
          ],
        },
      ]));

      await listing(source, '/');

      expect(await listing(source, '/tank')).toEqual([{ path: '/tank/child', name: 'child', type: 'dataset' }]);
    });

    it('lists nothing inside a leaf of a whole-tree provider', async () => {
      provider.mockReturnValue(of([
        {
          path: 'tank', name: 'tank', type: ExplorerNodeType.Directory, hasChildren: false, isMountpoint: true, children: [],
        },
      ]));

      await listing(source, '/');

      expect(await listing(source, '/tank')).toEqual([]);
    });

    it('maps paths between provider and picker space', () => {
      expect(source.toPickerPath('tank/child')).toBe('/tank/child');
      expect(source.fromPickerPath('/tank/child')).toBe('tank/child');
      expect(source.mountpointToPickerPath('/mnt/tank/new')).toBe('/tank/new');
      expect(createSource([datasetsRootNode]).mountpointToPickerPath('/mnt/tank/new')).toBe('/mnt/tank/new');
    });
  });
});
