import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { PermissionsItemComponent } from 'app/pages/storage-old/volumes/permissions/components/permissions-item/permissions-item.component';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/storage-old/volumes/permissions/interfaces/permission-item.interface';

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
    const ixIcon = await loader.getHarness(IxIconHarness);

    expect(await ixIcon.getName()).toBe('people');
    expect(spectator.query('.name')).toHaveExactText('Group – johns');
    expect(spectator.query('.permissions')).toHaveExactText('Read | Execute');
  });
});
