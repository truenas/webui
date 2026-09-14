import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SpectatorHost } from '@ngneat/spectator';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { SshCredentialsSelectComponent } from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

describe('SshCredentialsSelectComponent', () => {
  let spectator: SpectatorHost<SshCredentialsSelectComponent>;
  let loader: HarnessLoader;

  const host = `
    <form [formGroup]="form">
      <ix-ssh-credentials-select
        formControlName="credentials"
        [label]="label"
      ></ix-ssh-credentials-select>
    </form>
  `;

  const form = new FormGroup({ credentials: new FormControl<number | null>(null) });

  const mockConnections = [
    { id: 1, name: 'work-nas' },
    { id: 2, name: 'backup-nas' },
  ] as KeychainCredential[];

  const createHost = createHostFactory({
    component: SshCredentialsSelectComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(KeychainCredentialService, {
        getSshConnections: jest.fn(() => of(mockConnections)),
      }),
      mockProvider(FormSidePanelService, { open: jest.fn(() => SlideInResult.empty()) }),
    ],
  });

  function setupHost(providers: unknown[] = []): void {
    form.reset();
    spectator = createHost(host, {
      hostProps: { form, label: 'SSH Connection' },
      providers: providers as never[],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('offers every SSH connection alongside the prepended Add New option', async () => {
    setupHost();
    const select = await loader.getHarness(TnSelectHarness);
    await select.open();

    expect(await select.getOptions()).toEqual(['Add New', 'work-nas', 'backup-nas']);
  });

  it('writes the created connection id back to the host control after Add New', async () => {
    // getValueFromFormResponse maps the saved KeychainCredential to the id the host control holds.
    const formPanel = { open: jest.fn(() => SlideInResult.success({ id: 3 } as KeychainCredential)) };
    setupHost([mockProvider(FormSidePanelService, formPanel)]);

    const select = await loader.getHarness(TnSelectHarness);
    await select.selectOption('Add New');

    expect(formPanel.open).toHaveBeenCalled();
    expect(form.value).toEqual({ credentials: 3 });
  });

  it('restores the previous selection when the create form is cancelled', async () => {
    const formPanel = { open: jest.fn(() => SlideInResult.cancel()) };
    setupHost([mockProvider(FormSidePanelService, formPanel)]);
    form.controls.credentials.setValue(1);

    const select = await loader.getHarness(TnSelectHarness);
    await select.selectOption('Add New');

    expect(form.value).toEqual({ credentials: 1 });
  });
});
