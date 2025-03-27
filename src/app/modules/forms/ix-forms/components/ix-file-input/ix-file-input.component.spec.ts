import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { MiB } from 'app/constants/bytes.constant';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxFileInputHarness } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';

describe('IxFileInputComponent', () => {
  let spectator: SpectatorHost<IxFileInputComponent>;
  const formControl = new FormControl<File[]>([]);
  let harness: IxFileInputHarness;
  const createHost = createHostFactory({
    component: IxFileInputComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createHost(`
      <ix-file-input
        [formControl]="formControl"
        [acceptedFiles]="acceptedFiles"
        [label]="label"
        [multiple]="multiple"
        [required]="required"
        [tooltip]="tooltip"
      >{{ buttonText }}</ix-file-input>`, {
      hostProps: {
        formControl,
        acceptedFiles: '*.*',
        label: 'File',
        multiple: true,
        buttonText: 'Choose File',
        required: false,
        tooltip: '',
      },
    });

    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    harness = await loader.getHarness(IxFileInputHarness);
  });

  describe('rendering', () => {
    it('renders label and passes properties to it', () => {
      spectator.setHostInput('label', 'SSH Key');
      spectator.setHostInput('required', true);
      spectator.setHostInput('tooltip', 'Upload SSH Key');

      const label = spectator.query(IxLabelComponent)!;
      expect(label).toExist();
      expect(label.label()).toBe('SSH Key');
      expect(label.required()).toBe(true);
      expect(label.tooltip()).toBe('Upload SSH Key');
    });

    it('renders file input', () => {
      const input = spectator.query('input[type="file"]')!;
      expect(input).toExist();
      expect(input).toHaveAttribute('accept', '*.*');
      expect(input).toHaveAttribute('multiple');
    });

    it('shows custom button text when it is provided as ng-content', () => {
      spectator.setHostInput('buttonText', 'Upload Files');

      const button = spectator.query('.input-container label')!;
      expect(button).toExist();
      expect(button).toHaveText('Upload Files');
    });

    it('shows a list of selected files next to the input', async () => {
      const files = [fakeFile('test1.jpg'), fakeFile('test2.jpg', 2 * MiB)];
      await harness.setValue(files);
      spectator.detectComponentChanges();

      const fileLines = spectator.queryAll('.file');
      expect(fileLines).toHaveLength(2);
      expect(fileLines[0]).toContainText('test1.jpg');
      expect(fileLines[0]).toContainText('1 KiB');
      expect(fileLines[1]).toContainText('test2.jpg');
      expect(fileLines[1]).toContainText('2 MiB');
    });

    it('removes a file when it is removed from the file list', async () => {
      const files = [fakeFile('test1.jpg'), fakeFile('test2.jpg', 2 * MiB)];
      await harness.setValue(files);
      spectator.detectComponentChanges();

      spectator.click('.file-action');

      const fileLines = spectator.queryAll('.file');
      expect(fileLines).toHaveLength(1);
      expect(fileLines[0]).toContainText('test2.jpg');

      expect(formControl.value).toEqual([files[1]]);
    });
  });

  describe('form control', () => {
    it('shows value provided in form control', () => {
      const file1 = fakeFile('test.jpg');
      formControl.setValue([file1]);
      spectator.detectComponentChanges();

      const fileLines = spectator.queryAll('.file');
      expect(fileLines).toHaveLength(1);
      expect(fileLines[0]).toContainText('test.jpg');
      expect(fileLines[0]).toContainText('1 KiB');
    });

    it('updates form control when file input is changed', async () => {
      const file1 = fakeFile('test1.jpg');

      await harness.setValue([file1]);

      expect(formControl.value).toEqual([file1]);
    });

    it('clears input value if formControl value is emptied', async () => {
      const file1 = fakeFile('test1.jpg');

      await harness.setValue([file1]);

      formControl.setValue([]);

      expect(spectator.query('input[type="file"]')).toHaveValue('');
    });
  });
});
