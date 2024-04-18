import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { CoreComponents } from 'app/core/core-components.module';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  PoolManagerComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';
import {
  commonDeclarations,
  commonProviders,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager/tests/common.utils';
import {
  PoolManagerHarness,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager/tests/pool-manager.harness';
import { PoolWizardNameValidationService } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/pool-wizard-name-validation.service';
import { DialogService } from 'app/services/dialog.service';

describe('PoolManagerComponent – creating dRAID pool', () => {
  let spectator: Spectator<PoolManagerComponent>;
  let wizard: PoolManagerHarness;
  const createComponent = createComponentFactory({
    component: PoolManagerComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      MatStepperModule,
      CoreComponents,
    ],
    declarations: [
      ...commonDeclarations,
    ],
    providers: [
      ...commonProviders,
      mockWebsocket([
        mockCall('pool.validate_name', true),
        mockCall('disk.get_unused', [
          {
            devname: 'ada0',
            size: 10 * GiB,
            type: DiskType.Hdd,
            enclosure: {
              number: 1,
              slot: 1,
            },
            exported_zpool: 'oldpool',
          },
          {
            devname: 'ada2',
            size: 10 * GiB,
            type: DiskType.Hdd,
            enclosure: {
              number: 1,
              slot: 2,
            },
            exported_zpool: 'oldpool',
          },
          {
            devname: 'ada3',
            size: 10 * GiB,
            type: DiskType.Hdd,
            enclosure: {
              number: 1,
              slot: 3,
            },
            exported_zpool: 'oldpool',
          },
          {
            devname: 'sda0',
            size: 20 * GiB,
            type: DiskType.Hdd,
            enclosure: {
              number: 4,
              slot: 0,
            },
          },
          {
            devname: 'sda1',
            size: 20 * GiB,
            type: DiskType.Hdd,
          },
          {
            devname: 'sda2',
            size: 20 * GiB,
            type: DiskType.Hdd,
          },
          {
            devname: 'sda3',
            size: 20 * GiB,
            type: DiskType.Hdd,
            enclosure: {
              number: 2,
              slot: 0,
            },
          },
          {
            devname: 'sda4',
            size: 10 * GiB,
            type: DiskType.Hdd,
            enclosure: {
              number: 3,
              slot: 1,
            },
            exported_zpool: 'anotherpool',
          },
        ] as UnusedDisk[]),
        mockCall('enclosure.query', [] as Enclosure[]),
        mockCall('pool.query', []),
        mockCall('pool.dataset.encryption_algorithm_choices', {}),
      ]),
      mockProvider(PoolWizardNameValidationService, {
        validatePoolName: () => of(null),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => {
          return {
            ...mockEntityJobComponentRef,
            componentInstance: {
              ...mockEntityJobComponentRef.componentInstance,
              success: of(),
            },
            afterClosed: () => of(undefined),
          };
        }),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
  });

  it('creates dRAID1 Pool', async () => {
    await wizard.fillStep({
      Name: 'dRAID',
    });

    await wizard.clickNext();
    await wizard.clickNext();

    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Data');

    await wizard.fillStep({
      Layout: 'dRAID1',
    });

    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      'Data Devices': '2',
      'Distributed Hot Spares': '1',
      Children: '4',
      'Number of VDEVs': '1',
    });

    expect(await wizard.getConfigurationPreviewSummary()).toMatchObject({
      'Data:': '1 × DRAID1 | 4 × 20 GiB (HDD)',
    });

    const stepper = await wizard.getStepper();
    await stepper.selectStep({ label: 'Review' });

    expect(await (await wizard.getActiveStep()).getLabel()).toBe('Review');

    await wizard.clickCreatePoolButton();

    const dialog = spectator.inject(MatDialog);

    expect(dialog.open).toHaveBeenCalledWith(EntityJobComponent, {
      disableClose: true,
      data: {
        title: 'Create Pool',
      },
    });

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith('pool.create', [{
      name: 'dRAID',
      allow_duplicate_serials: false,
      encryption: false,
      topology: {
        data: [
          {
            disks: ['sda3', 'sda0', 'sda1', 'sda2'],
            type: CreateVdevLayout.Draid1,
            draid_data_disks: 2,
            draid_spare_disks: 1,
          },
        ],
        cache: [],
        dedup: [],
        spares: [],
        log: [],
        special: [],
      },
    }]);
  });
});
