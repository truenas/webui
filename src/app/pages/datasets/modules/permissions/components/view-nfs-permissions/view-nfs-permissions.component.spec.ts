import { CdkAccordionModule } from '@angular/cdk/accordion';
import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { AclType } from 'app/enums/acl-type.enum';
import {
  NfsAclTag, NfsAclType, NfsBasicFlag, NfsBasicPermission, NfsAdvancedPermission, NfsAdvancedFlag,
} from 'app/enums/nfs-acl.enum';
import { NfsAcl } from 'app/interfaces/acl.interface';
import {
  PermissionsItemComponent,
} from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import {
  ViewNfsPermissionsComponent,
} from 'app/pages/datasets/modules/permissions/components/view-nfs-permissions/view-nfs-permissions.component';

describe('ViewNfsPermissionsComponent', () => {
  let spectator: Spectator<ViewNfsPermissionsComponent>;
  const createComponent = createComponentFactory({
    component: ViewNfsPermissionsComponent,
    imports: [
      PermissionsItemComponent,
      CdkAccordionModule,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        acl: {
          trivial: false,
          acltype: AclType.Nfs4,
          acl: [
            {
              type: NfsAclType.Allow,
              who: 'John',
              tag: NfsAclTag.User,
              perms: {
                BASIC: NfsBasicPermission.Modify,
              },
              flags: {
                BASIC: NfsBasicFlag.Inherit,
              },
            },
            {
              type: NfsAclType.Deny,
              who: 'Sarah',
              tag: NfsAclTag.User,
              perms: {
                [NfsAdvancedPermission.Delete]: true,
                [NfsAdvancedPermission.DeleteChild]: true,
                [NfsAdvancedPermission.Synchronize]: true,
              },
              flags: {
                [NfsAdvancedFlag.DirectoryInherit]: true,
                [NfsAdvancedFlag.FileInherit]: true,
              },
            },
          ],
        } as NfsAcl,
      },
    });
  });

  it('shows a list of NFS aces', () => {
    const permissions = spectator.queryAll('ix-permissions-item');

    expect(permissions).toHaveLength(2);
    expect(permissions[0]).toHaveText('User - John');
    expect(permissions[0]).toHaveText('Allow | Modify');
    expect(permissions[1]).toHaveText('User - Sarah');
    expect(permissions[1]).toHaveText('Deny | Special');
  });

  it('allows to click on one of the aces to see more details for basic permissions', () => {
    spectator.click(byText('User - John'));

    const permissions = spectator.query(byText('Permissions Basic'))
      .parentElement.querySelectorAll('.details-item');
    const flags = spectator.query(byText('Flags Basic'))
      .parentElement.querySelectorAll('.details-item');

    expect(permissions).toHaveLength(1);
    expect(flags).toHaveLength(1);
    expect(permissions[0]).toHaveText('Modify');
    expect(flags[0]).toHaveText('Inherit');
  });

  it('allows to click on one of the aces to see more details for advanced permissions', () => {
    spectator.click(byText('User - Sarah'));

    const permissions = spectator.query(byText('Permissions Advanced'))
      .parentElement.querySelectorAll('.details-item');
    const flags = spectator.query(byText('Flags Advanced'))
      .parentElement.querySelectorAll('.details-item');

    expect(permissions).toHaveLength(3);
    expect(flags).toHaveLength(2);
    expect(permissions[0]).toHaveText('Delete');
    expect(permissions[1]).toHaveText('Delete Child');
    expect(permissions[2]).toHaveText('Synchronize');
    expect(flags[0]).toHaveText('Directory Inherit');
    expect(flags[1]).toHaveText('File Inherit');
  });
});
