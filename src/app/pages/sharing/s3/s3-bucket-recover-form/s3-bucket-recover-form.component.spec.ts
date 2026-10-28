import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnBannerHarness, TnCheckboxHarness, TnInputHarness,
} from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  mockTypedApi, mockTypedCall, mockTypedQuery,
} from 'app/core/testing/utils/mock-typed-api.utils';
import { S3RecoverableBucket, S3RecoveredBucket } from 'app/interfaces/s3.interface';
import { IxUserComboboxHarness } from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  S3BucketRecoverFormComponent,
} from 'app/pages/sharing/s3/s3-bucket-recover-form/s3-bucket-recover-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('S3BucketRecoverFormComponent', () => {
  let spectator: Spectator<S3BucketRecoverFormComponent>;
  let loader: HarnessLoader;
  let api: TypedApiService;
  let closed: jest.Mock;

  const recoverable = [
    { name: 'photos', dataset: 'tank/buckets/photos', owner: 'alice' },
    { name: 'backups', dataset: 'tank/buckets/backups', owner: 'bob' },
  ] as S3RecoverableBucket[];

  let recoverableBuckets: S3RecoverableBucket[];
  let recoverAnswer: S3RecoveredBucket[];

  const createComponent = createComponentFactory({
    component: S3BucketRecoverFormComponent,
    providers: [
      mockAuth(),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService),
      mockTypedApi([
        mockTypedQuery('user.query', [
          { username: 'alice', uid: 1000 },
          { username: 'bob', uid: 1001 },
          { username: 'carol', uid: 1002 },
        ] as WebUiQueryEntity<'user.query'>[]),
        mockTypedCall('sharing.s3.recoverable_buckets', () => recoverableBuckets),
        mockTypedCall('sharing.s3.recover', () => recoverAnswer),
      ]),
    ],
  });

  const bucketLoader = (name: string): Promise<HarnessLoader> => loader.getChildLoader(`section[aria-label="${name}"]`);

  const recovered = (dataset: string): S3RecoveredBucket => ({
    dataset,
    bucket: { id: 1, dataset } as S3RecoveredBucket['bucket'],
    error: null,
  });

  async function setUp(): Promise<void> {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(TypedApiService);
    closed = jest.fn();
    spectator.component.closed.subscribe(closed);
    await spectator.fixture.whenStable();
  }

  beforeEach(() => {
    recoverableBuckets = recoverable;
    recoverAnswer = recoverable.map((bucket) => recovered(bucket.dataset));
  });

  it('lists every recoverable bucket by name, ticked and prefilled from its backup', async () => {
    await setUp();

    const checkboxes = await loader.getAllHarnesses(TnCheckboxHarness);
    expect(await Promise.all(checkboxes.map((checkbox) => checkbox.getLabelText()))).toEqual(['backups', 'photos']);
    expect(await Promise.all(checkboxes.map((checkbox) => checkbox.isChecked()))).toEqual([true, true]);

    const photos = await bucketLoader('photos');
    expect(spectator.query('section[aria-label="photos"]')).toHaveText('tank/buckets/photos');
    expect(await (await photos.getHarness(TnInputHarness)).getValue()).toBe('photos');

    expect(await loader.getHarness(TnBannerHarness)).toBeTruthy();
    expect(spectator.component.canSubmit()).toBe(true);
  });

  it('recovers the ticked buckets as they were backed up and closes', async () => {
    await setUp();

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenCalledWith('sharing.s3.recover', [[
      { dataset: 'tank/buckets/backups', name_override: null, owner_override: null },
      { dataset: 'tank/buckets/photos', name_override: null, owner_override: null },
    ]]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('2 buckets recovered');
    expect(closed).toHaveBeenCalledWith(true);
  });

  it('sends a new name and owner only for the bucket they were changed on', async () => {
    await setUp();

    const photos = await bucketLoader('photos');
    await (await photos.getHarness(TnInputHarness)).setValue('photos-restored');
    const owner = await photos.getHarness(IxUserComboboxHarness);
    await owner.focus();
    await owner.selectOption('carol');

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenCalledWith('sharing.s3.recover', [[
      { dataset: 'tank/buckets/backups', name_override: null, owner_override: null },
      { dataset: 'tank/buckets/photos', name_override: 'photos-restored', owner_override: 'carol' },
    ]]);
  });

  it('leaves out an unticked bucket and disables Recover when none is ticked', async () => {
    await setUp();

    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'backups' }))).uncheck();
    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'photos' }))).uncheck();
    expect(spectator.component.canSubmit()).toBe(false);
    // Its fields go with it, so an invalid one left behind cannot hold Recover disabled.
    expect(await (await bucketLoader('backups')).hasHarness(TnInputHarness)).toBe(false);

    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'photos' }))).check();
    expect(spectator.component.canSubmit()).toBe(true);

    spectator.component.submit();
    await spectator.fixture.whenStable();

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

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(closed).not.toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('1 bucket recovered');

    const checkboxes = await loader.getAllHarnesses(TnCheckboxHarness);
    expect(await Promise.all(checkboxes.map((checkbox) => checkbox.getLabelText()))).toEqual(['backups']);
    const error = await (await bucketLoader('backups')).getHarness(TnBannerHarness);
    expect(await error.getText()).toContain('Another bucket already uses this name.');
    // Nothing left is unsaved, so closing to sort out the clash elsewhere does not ask to discard anything.
    expect(spectator.component.hasUnsavedChanges()).toBe(false);
  });

  it('says so when nothing can be recovered', async () => {
    recoverableBuckets = [];
    await setUp();

    expect(spectator.fixture.nativeElement).toHaveText('No recoverable buckets were found.');
    expect(await loader.hasHarness(TnCheckboxHarness)).toBe(false);
    expect(spectator.component.canSubmit()).toBe(false);
  });
});
