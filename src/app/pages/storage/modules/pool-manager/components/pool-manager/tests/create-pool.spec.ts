import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
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
import { WebSocketService } from 'app/services/ws.service';

describe('PoolManagerComponent – create pool', () => {
  let spectator: Spectator<PoolManagerComponent>;
  let wizard: PoolManagerHarness;
  const createComponent = createComponentFactory({
    component: PoolManagerComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      MatStepperModule,
      FileSizePipe,
      MapValuePipe,
      CastPipe,
    ],
    declarations: [
      ...commonDeclarations,
    ],
    providers: [
      ...commonProviders,
      mockWebSocket([
        mockCall('pool.validate_name', true),
        mockCall('disk.details', {
          used: [
            {
              devname: 'ada0',
              size: 10 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id1',
                drive_bay_number: 1,
              },
              exported_zpool: 'oldpool',
            },
            {
              devname: 'ada2',
              size: 10 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id1',
                drive_bay_number: 2,
              },
              exported_zpool: 'oldpool',
            },
            {
              devname: 'ada3',
              size: 10 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id1',
                drive_bay_number: 3,
              },
              exported_zpool: 'oldpool',
            },
            {
              devname: 'sda0',
              size: 20 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id4',
                drive_bay_number: 0,
              },
            },
            {
              devname: 'sda3',
              size: 20 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: '2',
                drive_bay_number: 0,
              },
            },
            {
              devname: 'sda4',
              size: 10 * GiB,
              type: DiskType.Hdd,
              enclosure: {
                id: 'id3',
                drive_bay_number: 1,
              },
              exported_zpool: 'anotherpool',
            },
          ] as DetailsDisk[],
          unused: [
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
              devname: 'sda5',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda6',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
            {
              devname: 'sda7',
              size: 20 * GiB,
              type: DiskType.Hdd,
            },
          ] as DetailsDisk[],
        }),
        mockCall('enclosure2.query', [] as Enclosure[]),
        mockCall('pool.query', []),
        mockCall('pool.dataset.encryption_algorithm_choices', {}),
        mockJob('pool.create', fakeSuccessfulJob()),
      ]),
      mockProvider(PoolWizardNameValidationService, {
        validatePoolName: () => of(null),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    wizard = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, PoolManagerHarness);
  });

  it('creates a pool', async () => {
    await wizard.fillStep({
      Name: 'pool1',
    });
    await wizard.clickNext();

    // Data
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    // Log
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });

    // Spare
    await wizard.clickNext();
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });

    // Cache
    await wizard.clickNext();
    await wizard.fillStep({
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
    });

    // Metadata
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    // Dedup
    await wizard.clickNext();
    await wizard.fillStep({
      Layout: 'Stripe',
      'Disk Size': '20 GiB (HDD)',
      Width: '1',
      'Number of VDEVs': '1',
    });

    const reviewView = await wizard.getReviewWizardStep();
    expect(await reviewView.getConfigurationItems()).toEqual({
      Cache: '1 × 20 GiB (HDD)',
      Data: '1 × STRIPE | 1 × 20 GiB (HDD)',
      Dedup: '1 × STRIPE | 1 × 20 GiB (HDD)',
      Log: '1 × STRIPE | 1 × 20 GiB (HDD)',
      Spare: '1 × 20 GiB (HDD)',
      Metadata: '1 × STRIPE | 1 × 20 GiB (HDD)',
    });
    expect(await reviewView.getWarnings()).toEqual([
      'A stripe log VDEV may result in data loss if it fails combined with a power outage.',
    ]);
    expect(await reviewView.getErrors()).toEqual([
      'A stripe data VDEV is highly discouraged and will result in data loss if it fails',
      'A stripe dedup VDEV is highly discouraged and will result in data loss if it fails',
      'A stripe metadata VDEV is highly discouraged and will result in data loss if it fails',
    ]);
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    await (await wizard.getCreatePoolButton()).click();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
      'pool.create',
      [{
        name: 'pool1',
        topology: {
          cache: [{
            disks: ['sda3'],
            type: 'STRIPE',
          }],
          data: [{
            disks: ['sda0'],
            type: 'STRIPE',
          }],
          dedup: [{
            disks: ['sda1'],
            type: 'STRIPE',
          }],
          log: [{
            disks: ['sda2'],
            type: 'STRIPE',
          }],
          spares: ['sda5'],
          special: [{
            disks: ['sda6'],
            type: 'STRIPE',
          }],
        },
        allow_duplicate_serials: false,
        encryption: false,
      }],
    );
    expect(router.navigate).toHaveBeenCalledWith(['/storage']);
  });
});
