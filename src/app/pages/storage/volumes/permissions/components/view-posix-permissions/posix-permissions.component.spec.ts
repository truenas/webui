import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import { PosixAcl } from 'app/interfaces/acl.interface';
import { PermissionsItemComponent } from 'app/pages/storage/volumes/permissions/components/permissions-item/permissions-item.component';
import { PosixPermissionsComponent } from 'app/pages/storage/volumes/permissions/components/view-posix-permissions/posix-permissions.component';

describe('PosixPermissionsComponent', () => {
  let spectator: Spectator<PosixPermissionsComponent>;
  const createComponent = createComponentFactory({
    component: PosixPermissionsComponent,
    declarations: [
      PermissionsItemComponent,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        acl: {
          acl: [
            {
              tag: PosixAclTag.User,
              who: 'john',
              perms: {
                [PosixPermission.Read]: false,
                [PosixPermission.Write]: false,
                [PosixPermission.Execute]: true,
              },
            },
            {
              tag: PosixAclTag.Mask,
              perms: {
                [PosixPermission.Read]: true,
                [PosixPermission.Write]: true,
                [PosixPermission.Execute]: true,
              },
            },
          ],
        } as PosixAcl,
      },
    });
  });

  it('shows a list of POSIX permissions', () => {
    const permissions = spectator.queryAll('ix-permissions-item');

    expect(permissions[0]).toHaveText('User – john');
    expect(permissions[0]).toHaveText('Execute');

    expect(permissions[1]).toHaveText('Mask');
    expect(permissions[1]).toHaveText('Read | Write | Execute');
  });
});
