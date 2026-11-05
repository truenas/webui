import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { AclType } from 'app/enums/acl-type.enum';
import { NfsAclTag, NfsBasicFlag, NfsBasicPermission } from 'app/enums/nfs-acl.enum';
import { PosixAclTag } from 'app/enums/posix-acl.enum';
import { Acl, NfsAclItem, PosixAclItem } from 'app/interfaces/acl.interface';
import {
  AclEditorListComponent,
} from 'app/pages/datasets/modules/permissions/components/acl-editor-list/acl-editor-list.component';
import {
  PermissionsItemComponent,
} from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';

const posixAce = (tag: PosixAclTag, who: string | null = null): PosixAclItem => ({
  tag,
  who,
  id: -1,
  default: false,
  perms: { READ: true, WRITE: false, EXECUTE: false },
} as PosixAclItem);

const nfsAce = (tag: NfsAclTag, who: string | null = null): NfsAclItem => ({
  tag,
  who,
  id: -1,
  type: 'ALLOW',
  perms: { BASIC: NfsBasicPermission.FullControl },
  flags: { BASIC: NfsBasicFlag.Inherit },
} as NfsAclItem);

const posixAcl = (acl: PosixAclItem[]): Acl => ({ acltype: AclType.Posix1e, acl } as Acl);
const nfsAcl = (acl: NfsAclItem[]): Acl => ({ acltype: AclType.Nfs4, acl } as Acl);

describe('AclEditorListComponent', () => {
  let spectator: Spectator<AclEditorListComponent>;

  const createComponent = createComponentFactory({
    component: AclEditorListComponent,
    declarations: [
      MockComponent(PermissionsItemComponent),
    ],
    providers: [
      mockProvider(DatasetAclEditorStore, {
        removeAce: jest.fn(),
        selectAce: jest.fn(),
      }),
    ],
  });

  function setup(acl: Acl, props: Record<string, unknown> = {}): void {
    spectator = createComponent({
      props: {
        acl,
        selectedAceIndex: 0,
        acesWithError: [],
        owner: 'john',
        ownerGroup: 'staff',
        ...props,
      },
    });
  }

  const itemNames = (): string[] => {
    return spectator.queryAll(PermissionsItemComponent).map((item) => String(item.item.name));
  };

  it('shows an empty message when the list has no entries', () => {
    setup(posixAcl([]));

    expect(spectator.query('.empty-message')).toHaveText('The list is empty.');
    expect(spectator.queryAll('.ace')).toHaveLength(0);
  });

  it('names POSIX owner entries after the current owner and group', () => {
    setup(posixAcl([
      posixAce(PosixAclTag.UserObject),
      posixAce(PosixAclTag.GroupObject),
      posixAce(PosixAclTag.User, 'mary'),
      posixAce(PosixAclTag.Other),
    ]));

    expect(itemNames()).toEqual(['User Obj – john', 'Group Obj – staff', 'User – mary', 'Other']);
  });

  it('names NFS owner@ and group@ entries after the current owner and group', () => {
    setup(nfsAcl([
      nfsAce(NfsAclTag.Owner),
      nfsAce(NfsAclTag.Group),
      nfsAce(NfsAclTag.User, 'mary'),
      nfsAce(NfsAclTag.Everyone),
    ]));

    expect(itemNames()).toEqual(['owner@ - john', 'group@ - staff', 'User - mary', 'everyone@']);
  });

  it('renames owner entries when the owner inputs change', () => {
    setup(posixAcl([posixAce(PosixAclTag.UserObject), posixAce(PosixAclTag.GroupObject)]));

    spectator.setInput({ owner: 'root', ownerGroup: 'wheel' });

    expect(itemNames()).toEqual(['User Obj – root', 'Group Obj – wheel']);
  });

  it('rebuilds the list when the acl input changes', () => {
    setup(posixAcl([posixAce(PosixAclTag.UserObject)]));

    spectator.setInput('acl', posixAcl([posixAce(PosixAclTag.UserObject), posixAce(PosixAclTag.Other)]));

    expect(itemNames()).toEqual(['User Obj – john', 'Other']);
  });

  it('highlights the selected entry and the entries with errors', () => {
    setup(posixAcl([posixAce(PosixAclTag.UserObject), posixAce(PosixAclTag.Other)]), {
      selectedAceIndex: 1,
      acesWithError: [0],
    });

    const aces = spectator.queryAll('.ace');
    expect(aces[0]).not.toHaveClass('ace-selected');
    expect(aces[0]).toHaveClass('fn-theme-red');
    expect(aces[0].querySelector('.warning')).toExist();
    expect(aces[1]).toHaveClass('ace-selected');
    expect(aces[1]).not.toHaveClass('fn-theme-red');
  });

  it('keeps the last required POSIX entries from being removed', () => {
    setup(posixAcl([
      posixAce(PosixAclTag.UserObject),
      posixAce(PosixAclTag.GroupObject),
      posixAce(PosixAclTag.Other),
      posixAce(PosixAclTag.User, 'mary'),
    ]));

    const removable = spectator.queryAll('.ace').map((ace) => !!ace.querySelector('.remove'));
    expect(removable).toEqual([false, false, false, true]);
  });

  it('allows removing a POSIX entry when another entry of the same kind remains', () => {
    setup(posixAcl([
      posixAce(PosixAclTag.UserObject),
      posixAce(PosixAclTag.UserObject),
      posixAce(PosixAclTag.GroupObject),
      posixAce(PosixAclTag.Other),
    ]));

    const removable = spectator.queryAll('.ace').map((ace) => !!ace.querySelector('.remove'));
    expect(removable).toEqual([true, true, false, false]);
  });

  it('allows removing any NFS entry and removes it from the store', () => {
    setup(nfsAcl([nfsAce(NfsAclTag.Owner), nfsAce(NfsAclTag.Everyone)]));

    expect(spectator.queryAll('.remove')).toHaveLength(2);

    spectator.click(spectator.queryAll('.remove')[1]);

    expect(spectator.inject(DatasetAclEditorStore).removeAce).toHaveBeenCalledWith(1);
  });

  it('removes an entry with errors when its warning icon is clicked', () => {
    setup(nfsAcl([nfsAce(NfsAclTag.Owner)]), { acesWithError: [0] });

    spectator.click('.warning');

    expect(spectator.inject(DatasetAclEditorStore).removeAce).toHaveBeenCalledWith(0);
  });

  it('selects an entry when it is clicked', () => {
    jest.useFakeTimers();
    setup(nfsAcl([nfsAce(NfsAclTag.Owner), nfsAce(NfsAclTag.Everyone)]));
    const store = spectator.inject(DatasetAclEditorStore);

    spectator.click(spectator.queryAll('.ace')[1]);
    expect(store.selectAce).toHaveBeenCalledWith(null);

    jest.runAllTimers();
    expect(store.selectAce).toHaveBeenLastCalledWith(1);
    jest.useRealTimers();
  });
});
