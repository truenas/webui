import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { S3RecoverableBucket, S3RecoveredBucket } from 'app/interfaces/s3.interface';
import { User } from 'app/interfaces/user.interface';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxUserPickerHarness } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  S3BucketRecoverFormComponent,
} from 'app/pages/sharing/s3/s3-bucket-recover-form/s3-bucket-recover-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('S3BucketRecoverFormComponent', () => {
  let spectator: Spectator<S3BucketRecoverFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const recoverable = [
    { name: 'photos', dataset: 'tank/buckets/photos', owner: 'alice' },
    { name: 'backups', dataset: 'tank/buckets/backups', owner: 'bob' },
  ] as S3RecoverableBucket[];

  let recoverableBuckets: S3RecoverableBucket[];
  let recoverAnswer: S3RecoveredBucket[];
  let scope: string | undefined;

  const slideInRef: SlideInRef<string | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => scope),
  };

  const createComponent = createComponentFactory({
    component: S3BucketRecoverFormComponent,
    providers: [
      mockAuth(),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService),
      mockProvider(SlideInRef, slideInRef),
      mockApi([
        mockCall('user.query', [
          { username: 'alice', uid: 1000 },
          { username: 'bob', uid: 1001 },
          { username: 'carol', uid: 1002 },
        ] as User[]),
        mockCall('sharing.s3.recoverable_buckets', () => recoverableBuckets),
        mockCall('sharing.s3.recover', () => recoverAnswer),
      ]),
    ],
  });

  const bucketLoader = (name: string): Promise<HarnessLoader> => loader.getChildLoader(`section[aria-label="${name}"]`);
  const getRecoverButton = (): Promise<MatButtonHarness> => loader.getHarness(
    MatButtonHarness.with({ text: 'Recover' }),
  );

  const recovered = (dataset: string): S3RecoveredBucket => ({
    dataset,
    bucket: { id: 1, dataset } as S3RecoveredBucket['bucket'],
    error: null,
  });

  async function setUp(dataset?: string): Promise<void> {
    scope = dataset;
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    await spectator.fixture.whenStable();
  }

  beforeEach(() => {
    jest.clearAllMocks();
    recoverableBuckets = recoverable;
    recoverAnswer = recoverable.map((bucket) => recovered(bucket.dataset));
  });

  it('lists every recoverable bucket by name, ticked and prefilled from its backup', async () => {
    await setUp();

    const checkboxes = await loader.getAllHarnesses(IxCheckboxHarness);
    expect(await Promise.all(checkboxes.map((checkbox) => checkbox.getLabelText()))).toEqual(['backups', 'photos']);
    expect(await Promise.all(checkboxes.map((checkbox) => checkbox.getValue()))).toEqual([true, true]);

    const photos = await bucketLoader('photos');
    expect(spectator.query('section[aria-label="photos"]')).toHaveText('tank/buckets/photos');
    expect(await (await photos.getHarness(IxInputHarness)).getValue()).toBe('photos');
    expect(spectator.query('ix-warning')).toHaveText('A recovered bucket comes back exactly as it was configured');
    expect(await (await getRecoverButton()).isDisabled()).toBe(false);
  });

  it('recovers the ticked buckets as they were backed up and closes', async () => {
    await setUp();

    await (await getRecoverButton()).click();

    expect(api.call).toHaveBeenCalledWith('sharing.s3.recover', [[
      { dataset: 'tank/buckets/backups', name_override: null, owner_override: null },
      { dataset: 'tank/buckets/photos', name_override: null, owner_override: null },
    ]]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('2 buckets recovered');
    expect(slideInRef.close).toHaveBeenCalledWith({ response: true });
  });

  it('sends a new name and owner only for the bucket they were changed on', async () => {
    await setUp();

    const photos = await bucketLoader('photos');
    await (await photos.getHarness(IxInputHarness)).setValue('photos-restored');
    await (await photos.getHarness(IxUserPickerHarness)).setValue('carol');

    await (await getRecoverButton()).click();

    expect(api.call).toHaveBeenCalledWith('sharing.s3.recover', [[
      { dataset: 'tank/buckets/backups', name_override: null, owner_override: null },
      { dataset: 'tank/buckets/photos', name_override: 'photos-restored', owner_override: 'carol' },
    ]]);
  });

  it('leaves out an unticked bucket and disables Recover when none is ticked', async () => {
    await setUp();

    await (await loader.getHarness(IxCheckboxHarness.with({ label: 'backups' }))).setValue(false);
    await (await loader.getHarness(IxCheckboxHarness.with({ label: 'photos' }))).setValue(false);
    expect(await (await getRecoverButton()).isDisabled()).toBe(true);
    // Its fields go with it, so an invalid one left behind cannot hold Recover disabled.
    expect(await (await bucketLoader('backups')).hasHarness(IxInputHarness)).toBe(false);

    await (await loader.getHarness(IxCheckboxHarness.with({ label: 'photos' }))).setValue(true);
    await (await getRecoverButton()).click();

    expect(api.call).toHaveBeenCalledWith('sharing.s3.recover', [[
      { dataset: 'tank/buckets/photos', name_override: null, owner_override: null },
    ]]);
  });

  it('keeps a bucket that failed on screen with its reason and drops the one that was recovered', async () => {
    recoverAnswer = [
      { dataset: 'tank/buckets/backups', bucket: null, error: 'Another bucket already uses this name.' },
      recovered('tank/buckets/photos'),
    ];
    await setUp();

    await (await getRecoverButton()).click();

    expect(slideInRef.close).not.toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('1 bucket recovered');

    const checkboxes = await loader.getAllHarnesses(IxCheckboxHarness);
    expect(await Promise.all(checkboxes.map((checkbox) => checkbox.getLabelText()))).toEqual(['backups']);
    expect(spectator.query('section[aria-label="backups"] ix-warning')).toHaveText(
      'Another bucket already uses this name.',
    );
  });

  it('holds every row while the recovery is in flight and gives a failed one back for a retry', async () => {
    await setUp();
    const answer$ = new Subject<S3RecoveredBucket[]>();
    jest.mocked(api.call).mockReturnValueOnce(answer$);

    await (await getRecoverButton()).click();

    const backups = await bucketLoader('backups');
    expect(await (await backups.getHarness(IxInputHarness)).isDisabled()).toBe(true);
    expect(await (await loader.getHarness(IxCheckboxHarness.with({ label: 'backups' }))).isDisabled()).toBe(true);

    answer$.next([
      { dataset: 'tank/buckets/backups', bucket: null, error: 'Another bucket already uses this name.' },
      recovered('tank/buckets/photos'),
    ]);
    answer$.complete();

    expect(await (await backups.getHarness(IxInputHarness)).isDisabled()).toBe(false);
    expect(await (await loader.getHarness(IxCheckboxHarness.with({ label: 'backups' }))).isDisabled()).toBe(false);
    expect(await (await getRecoverButton()).isDisabled()).toBe(false);
  });

  it('lists only the bucket on the dataset it was opened for', async () => {
    await setUp('tank/buckets/photos');

    const checkboxes = await loader.getAllHarnesses(IxCheckboxHarness);
    expect(await Promise.all(checkboxes.map((checkbox) => checkbox.getLabelText()))).toEqual(['photos']);

    await (await getRecoverButton()).click();

    expect(api.call).toHaveBeenCalledWith('sharing.s3.recover', [[
      { dataset: 'tank/buckets/photos', name_override: null, owner_override: null },
    ]]);
  });

  it('says so when nothing can be recovered', async () => {
    recoverableBuckets = [];
    await setUp();

    expect(spectator.fixture.nativeElement).toHaveText('No recoverable buckets were found.');
    expect(await loader.hasHarness(IxCheckboxHarness)).toBe(false);
    expect(await (await getRecoverButton()).isDisabled()).toBe(true);
  });
});
