import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DatasetSource } from 'app/enums/dataset.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';

describe('ReplicationWhatAndWhereComponent', () => {
  let spectator: Spectator<ReplicationWhatAndWhereComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: ReplicationWhatAndWhereComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      'Source Location': 'On this System',
      'Destination Location': 'On this System',
    });

    await form.fillForm({
      Recursive: true,
      'Replicate Custom Snapshots': true,
      Encryption: true,
      Source: ['pool1/', 'pool2/'],
      Destination: 'pool3/',
    });

    await form.fillForm({
      'Encryption Key Format': 'HEX',
    });
  });

  it('returns fields when getPayload() is called', () => {
    expect(spectator.component.getPayload()).toEqual({
      exist_replication: null,
      source_datasets_from: DatasetSource.Local,
      target_dataset_from: DatasetSource.Local,
      source_datasets: ['pool1/', 'pool2/'],
      target_dataset: 'pool3/',
      custom_snapshots: true,
      recursive: true,
      schema_or_regex: SnapshotNamingOption.NamingSchema,
      naming_schema: 'auto-%Y-%m-%d_%H-%M',
      encryption: true,
      encryption_key_format: EncryptionKeyFormat.Hex,
      encryption_key_generate: true,
      encryption_key_location_truenasdb: true,
      name: 'pool1/,pool2/ - pool3/',
    });
  });

  it('returns summary when getSummary() is called', () => {
    expect(spectator.component.getSummary()).toEqual([
      { label: 'Source', value: 'pool1/,pool2/' },
      { label: 'Destination', value: 'pool3/' },
    ]);
  });
});
