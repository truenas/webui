import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import {
  PermissionsItemComponent,
} from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/datasets/modules/permissions/interfaces/permission-item.interface';

describe('PermissionsItemComponent', () => {
  const createComponent = createComponentFactory({
    component: PermissionsItemComponent,
  });

  it('shows icon, name and permission string for permission item.', async () => {
    const spectator = createComponent({
      props: {
        item: {
          name: 'Group – johns',
          description: 'Read | Execute',
          type: PermissionsItemType.Group,
        } as PermissionItem,
      },
    });

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const icon = await loader.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('account-multiple');
    expect(spectator.query('.name')).toHaveExactText('Group – johns');
    expect(spectator.query('.permissions')).toHaveExactText('Read | Execute');
  });
});
