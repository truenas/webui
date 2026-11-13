/* eslint-disable max-classes-per-file, @angular-eslint/component-max-inline-declarations */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  ChangeDetectionStrategy, Component, signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { createComponentFactory, mockProvider, SpectatorFactory } from '@ngneat/spectator/jest';
import {
  TnAutocompleteHarness, TnDialog, TnSelectHarness, TnSlideToggleHarness,
} from '@truenas/ui-components';
import { config, of } from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { KeychainCredential } from 'app/interfaces/keychain-credential.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCodeEditorComponent } from 'app/modules/forms/controls/ix-code-editor/ix-code-editor.component';
import { IxCodeEditorHarness } from 'app/modules/forms/controls/ix-code-editor/ix-code-editor.harness';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import {
  IxIpInputWithNetmaskHarness,
} from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.harness';
import {
  SshCredentialsSelectComponent,
} from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import {
  UnusedDiskSelectComponent,
} from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import {
  IxUserComboboxComponent,
} from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-user-combobox.component';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { IxUserComboboxHarness } from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { OrderedListboxComponent } from 'app/modules/lists/ordered-list/ordered-list.component';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { SchedulerHarness } from 'app/modules/scheduler/components/scheduler/scheduler.harness';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilterSelectListComponent } from 'app/pages/apps/components/filter-select-list/filter-select-list.component';
import { FilterSelectListHarness } from 'app/pages/apps/components/filter-select-list/filter-select-list.harness';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';
import { NetworkService } from 'app/services/network.service';
import { PrincipalOption, UserDirectoryService } from 'app/services/user-directory.service';

/**
 * NAS-145112. The webui's own composite ControlValueAccessors bound with signal forms' `[formField]`
 * instead of `formControlName`. Each control is rendered twice with the same field name — once per
 * binding — so the `data-test` ids can be compared. A `gap:` test pins a current break; a flipped
 * assertion means the gap closed. Companion to `signal-forms-spike/signal-forms-compat.spec.ts`.
 */

function testIds(fixture: ComponentFixture<unknown>): (string | null)[] {
  return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('[data-test]'))
    .map((element) => element.getAttribute('data-test'));
}

async function render<T>(
  createComponent: SpectatorFactory<T>,
): Promise<{ fixture: ComponentFixture<T>; host: T; loader: HarnessLoader }> {
  const { fixture } = createComponent();
  await fixture.whenStable();
  return { fixture, host: fixture.componentInstance, loader: TestbedHarnessEnvironment.loader(fixture) };
}

/** Renders the `formControlName` and the `[formField]` host side by side and returns what each stamps. */
async function compareTestIds<R, S>(
  createReactive: SpectatorFactory<R>,
  createSignal: SpectatorFactory<S>,
): Promise<{ reactive: (string | null)[]; signalForms: (string | null)[] }> {
  const reactive = await render(createReactive);
  const signalForms = await render(createSignal);
  return { reactive: testIds(reactive.fixture), signalForms: testIds(signalForms.fixture) };
}

// ── 1. ix-code-editor ──

@Component({
  selector: 'ix-signal-code-editor',
  template: '<ix-code-editor testId="config" [formField]="fields.config" [language]="language"></ix-code-editor>',
  imports: [FormField, IxCodeEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalCodeEditorHostComponent {
  readonly language = CodeEditorLanguage.Json;
  readonly model = signal({ config: '{"a": 1}' });
  readonly fields = form(this.model);
}

@Component({
  selector: 'ix-reactive-code-editor',
  template: `
    <form [formGroup]="group">
      <ix-code-editor testId="config" formControlName="config" [language]="language"></ix-code-editor>
    </form>
  `,
  imports: [ReactiveFormsModule, IxCodeEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveCodeEditorHostComponent {
  readonly language = CodeEditorLanguage.Json;
  readonly group = new FormGroup({ config: new FormControl('{"a": 1}') });
}

// ── 2. ix-ip-input-with-netmask ──

@Component({
  selector: 'ix-signal-ip-input',
  template: '<ix-ip-input-with-netmask [formField]="fields.address"></ix-ip-input-with-netmask>',
  imports: [FormField, IxIpInputWithNetmaskComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalIpInputHostComponent {
  readonly model = signal({ address: '10.1.2.3/24' });
  readonly fields = form(this.model);
}

@Component({
  selector: 'ix-reactive-ip-input',
  template: `
    <form [formGroup]="group">
      <ix-ip-input-with-netmask formControlName="address"></ix-ip-input-with-netmask>
    </form>
  `,
  imports: [ReactiveFormsModule, IxIpInputWithNetmaskComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveIpInputHostComponent {
  readonly group = new FormGroup({ address: new FormControl('10.1.2.3/24') });
}

// ── 3. ix-ordered-listbox ──

const nicOptions: Option[] = [
  { label: 'eth0', value: 'eth0' },
  { label: 'eth1', value: 'eth1' },
  { label: 'eth2', value: 'eth2' },
];

@Component({
  selector: 'ix-signal-ordered-list',
  template: '<ix-ordered-listbox [formField]="fields.lag_ports" [options]="options$"></ix-ordered-listbox>',
  imports: [FormField, OrderedListboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalOrderedListHostComponent {
  readonly options$ = of(nicOptions);
  readonly model = signal({ lag_ports: ['eth2'] as (string | number)[] });
  readonly fields = form(this.model);
}

@Component({
  selector: 'ix-reactive-ordered-list',
  template: `
    <form [formGroup]="group">
      <ix-ordered-listbox formControlName="lag_ports" [options]="options$"></ix-ordered-listbox>
    </form>
  `,
  imports: [ReactiveFormsModule, OrderedListboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveOrderedListHostComponent {
  readonly options$ = of(nicOptions);
  readonly group = new FormGroup({ lag_ports: new FormControl(['eth2']) });
}

// ── 4. ix-scheduler ──

@Component({
  selector: 'ix-signal-scheduler',
  template: '<ix-scheduler label="Schedule" [formField]="fields.schedule"></ix-scheduler>',
  imports: [FormField, SchedulerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalSchedulerHostComponent {
  readonly model = signal({ schedule: '0 0 * * *' });
  readonly fields = form(this.model);
}

@Component({
  selector: 'ix-reactive-scheduler',
  template: `
    <form [formGroup]="group">
      <ix-scheduler label="Schedule" formControlName="schedule"></ix-scheduler>
    </form>
  `,
  imports: [ReactiveFormsModule, SchedulerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveSchedulerHostComponent {
  readonly group = new FormGroup({ schedule: new FormControl('0 0 * * *') });
}

// ── 5. ix-filter-select-list ──

const filterOptions: Option[] = [
  { label: 'label1', value: 'value1' },
  { label: 'label2', value: 'value2' },
];

@Component({
  selector: 'ix-signal-filter-select-list',
  template: `
    <ix-filter-select-list
      label="Categories"
      [formField]="fields.categories"
      [options]="options"
      [multiple]="true"
    ></ix-filter-select-list>
  `,
  imports: [FormField, FilterSelectListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalFilterSelectListHostComponent {
  readonly options = filterOptions;
  readonly model = signal({ categories: ['value1', 'value2'] as (string | number | null)[] });
  readonly fields = form(this.model);
}

@Component({
  selector: 'ix-reactive-filter-select-list',
  template: `
    <form [formGroup]="group">
      <ix-filter-select-list
        label="Categories"
        formControlName="categories"
        [options]="options"
        [multiple]="true"
      ></ix-filter-select-list>
    </form>
  `,
  imports: [ReactiveFormsModule, FilterSelectListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveFilterSelectListHostComponent {
  readonly options = filterOptions;
  readonly group = new FormGroup({ categories: new FormControl(['value1', 'value2']) });
}

// ── 6. ix-unused-disk-select ──

@Component({
  selector: 'ix-signal-unused-disk-select',
  template: '<ix-unused-disk-select label="Disk" [formField]="fields.disk"></ix-unused-disk-select>',
  imports: [FormField, UnusedDiskSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalUnusedDiskHostComponent {
  readonly model = signal({ disk: 'da0' as string | null });
  readonly fields = form(this.model);
}

@Component({
  selector: 'ix-reactive-unused-disk-select',
  template: `
    <form [formGroup]="group">
      <ix-unused-disk-select label="Disk" formControlName="disk"></ix-unused-disk-select>
    </form>
  `,
  imports: [ReactiveFormsModule, UnusedDiskSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveUnusedDiskHostComponent {
  readonly group = new FormGroup({ disk: new FormControl<string | null>('da0') });
}

// ── 7. ix-ssh-credentials-select (IxSelectWithNewOption) ──

@Component({
  selector: 'ix-signal-ssh-credentials-select',
  template: '<ix-ssh-credentials-select label="SSH" [formField]="fields.credentials"></ix-ssh-credentials-select>',
  imports: [FormField, SshCredentialsSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalSshCredentialsHostComponent {
  readonly model = signal({ credentials: 1 as number | null });
  readonly fields = form(this.model);
}

@Component({
  selector: 'ix-reactive-ssh-credentials-select',
  template: `
    <form [formGroup]="group">
      <ix-ssh-credentials-select label="SSH" formControlName="credentials"></ix-ssh-credentials-select>
    </form>
  `,
  imports: [ReactiveFormsModule, SshCredentialsSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveSshCredentialsHostComponent {
  readonly group = new FormGroup({ credentials: new FormControl<number | null>(1) });
}

// ── 8. ix-user-combobox (DirectoryFieldBase) ──

@Component({
  selector: 'ix-signal-user-combobox',
  template: `
    <ix-user-combobox
      [formField]="fields.owner"
      [validateExistence]="false"
      [allowCreate]="true"
      [debounce]="0"
    ></ix-user-combobox>
  `,
  imports: [FormField, IxUserComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalUserComboboxHostComponent {
  readonly model = signal({ owner: 'root' as string | null });
  readonly fields = form(this.model);
}

@Component({
  selector: 'ix-signal-user-combobox-validated',
  template: '<ix-user-combobox [formField]="fields.owner" [debounce]="0"></ix-user-combobox>',
  imports: [FormField, IxUserComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalValidatedUserComboboxHostComponent {
  readonly model = signal({ owner: 'root' as string | null });
  readonly fields = form(this.model);
}

@Component({
  selector: 'ix-reactive-user-combobox',
  template: `
    <form [formGroup]="group">
      <ix-user-combobox formControlName="owner" [validateExistence]="false" [debounce]="0"></ix-user-combobox>
    </form>
  `,
  imports: [ReactiveFormsModule, IxUserComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveUserComboboxHostComponent {
  readonly group = new FormGroup({ owner: new FormControl<string | null>('root') });
}

describe('webui composite ControlValueAccessors under [formField] (NAS-145112)', () => {
  describe('ix-code-editor', () => {
    const createSignal = createComponentFactory({ component: SignalCodeEditorHostComponent });
    const createReactive = createComponentFactory({ component: ReactiveCodeEditorHostComponent });

    it('model → view: shows the initial value and a later model write', async () => {
      const { fixture, host, loader } = await render(createSignal);
      const editor = await loader.getHarness(IxCodeEditorHarness);
      expect(await editor.getValue()).toBe('{"a": 1}');

      host.model.set({ config: '{"c": 3}' });
      await fixture.whenStable();

      expect(await editor.getValue()).toBe('{"c": 3}');
      expect(host.fields.config().dirty()).toBe(false);
    });

    it('view → model: typing lands in the model and dirties the field', async () => {
      const { host, loader } = await render(createSignal);

      await (await loader.getHarness(IxCodeEditorHarness)).setValue('{"b": 2}');

      expect(host.model().config).toBe('{"b": 2}');
      expect(host.fields.config().dirty()).toBe(true);
    });

    it('data-test: same as formControlName (the id comes from the testId input, not the control name)', async () => {
      expect(await compareTestIds(createReactive, createSignal)).toEqual({
        reactive: ['code-editor-config'],
        signalForms: ['code-editor-config'],
      });
    });
  });

  describe('ix-ip-input-with-netmask', () => {
    const providers = [
      mockProvider(NetworkService, {
        getV4Netmasks: () => [{ label: '24', value: '24' }, { label: '16', value: '16' }] as Option[],
        getV6PrefixLength: () => [{ label: '64', value: '64' }] as Option[],
      }),
    ];
    const createSignal = createComponentFactory({ component: SignalIpInputHostComponent, providers });
    const createReactive = createComponentFactory({ component: ReactiveIpInputHostComponent, providers });

    it('model → view and view → model', async () => {
      const { host, loader } = await render(createSignal);
      const harness = await loader.getHarness(IxIpInputWithNetmaskHarness);
      expect(await harness.getValue()).toBe('10.1.2.3/24');

      await harness.setValue('10.0.0.1/16');

      expect(host.model().address).toBe('10.0.0.1/16');
      expect(host.fields.address().dirty()).toBe(true);
    });

    it('data-test: same as formControlName (injectControlName reads the signal field name)', async () => {
      expect(await compareTestIds(createReactive, createSignal)).toEqual({
        reactive: ['input-address', 'select-netmasks'],
        signalForms: ['input-address', 'select-netmasks'],
      });
    });

    it('gap: the registered-control host directive never registers the field with IxFormService', async () => {
      const formService = TestBed.inject(IxFormService);

      await render(createSignal);
      expect(formService.getControlNames()).toEqual([]);

      await render(createReactive);
      expect(formService.getControlNames()).toEqual(['address']);
    });
  });

  describe('ix-ordered-listbox', () => {
    const createSignal = createComponentFactory({ component: SignalOrderedListHostComponent });
    const createReactive = createComponentFactory({ component: ReactiveOrderedListHostComponent });

    it('model → view and view → model', async () => {
      const { host, loader } = await render(createSignal);
      const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);
      expect(await Promise.all(toggles.map((toggle) => toggle.getLabelText()))).toEqual(['eth2', 'eth0', 'eth1']);
      expect(await Promise.all(toggles.map((toggle) => toggle.isChecked()))).toEqual([true, false, false]);

      await toggles[1].check();

      expect(host.model().lag_ports).toEqual(['eth2', 'eth0']);
      expect(host.fields.lag_ports().dirty()).toBe(true);
    });

    it('data-test: same as formControlName (injectControlName reads the signal field name)', async () => {
      const ids = ['toggle-lag-ports-eth-2', 'toggle-lag-ports-eth-0', 'toggle-lag-ports-eth-1'];
      expect(await compareTestIds(createReactive, createSignal)).toEqual({ reactive: ids, signalForms: ids });
    });
  });

  describe('ix-scheduler', () => {
    const providers = [
      mockProvider(TnDialog),
      { provide: CrontabExplanationPipe, useValue: { transform: (crontab: string) => crontab } },
    ];
    const createSignal = createComponentFactory({ component: SignalSchedulerHostComponent, providers });
    const createReactive = createComponentFactory({ component: ReactiveSchedulerHostComponent, providers });

    it('model → view and view → model', async () => {
      const { host, loader } = await render(createSignal);
      const scheduler = await loader.getHarness(SchedulerHarness);
      expect(await scheduler.getValue()).toMatch(/^Daily/);

      await (await scheduler.getSelectHarness()).selectOption(/^Hourly/);

      expect(host.model().schedule).toBe('0 * * * *');
      expect(host.fields.schedule().dirty()).toBe(true);
    });

    it('data-test: same as formControlName (injectControlName reads the signal field name)', async () => {
      expect(await compareTestIds(createReactive, createSignal)).toEqual({
        reactive: ['select-schedule-presets'],
        signalForms: ['select-schedule-presets'],
      });
    });
  });

  describe('ix-filter-select-list', () => {
    const createSignal = createComponentFactory({ component: SignalFilterSelectListHostComponent });
    const createReactive = createComponentFactory({ component: ReactiveFilterSelectListHostComponent });

    it('model → view and view → model', async () => {
      const { host, loader } = await render(createSignal);
      const list = await loader.getHarness(FilterSelectListHarness);
      // Both checked, and a click rather than setValue(): FilterSelectListHarness pairs items and icons by
      // index and probes `.item:nth-of-type(n)` though each item sits in its own <div>, so getValue() throws
      // and setValue() misreads any item past the first. Harness bugs, the same under formControlName.
      expect(await list.getValue()).toEqual(['label1', 'label2']);

      const [first] = await list.getItems();
      await first.click();

      expect(host.model().categories).toEqual(['value2']);
      expect(host.fields.categories().dirty()).toBe(true);
    });

    it('data-test: same as formControlName', async () => {
      expect(await compareTestIds(createReactive, createSignal)).toEqual({
        reactive: ['text-filter-select-list-label', 'option-value1', 'option-value2'],
        signalForms: ['text-filter-select-list-label', 'option-value1', 'option-value2'],
      });
    });
  });

  describe('ix-unused-disk-select', () => {
    const providers = [
      mockProvider(ApiService, {
        call: () => of({
          unused: [
            { name: 'da0', devname: 'da0', size: 2 * TiB },
            { name: 'da1', devname: 'da1', size: 4 * TiB },
          ] as DetailsDisk[],
          used: [] as DetailsDisk[],
        }),
      }),
      mockProvider(DialogService),
    ];
    const createSignal = createComponentFactory({ component: SignalUnusedDiskHostComponent, providers });
    const createReactive = createComponentFactory({ component: ReactiveUnusedDiskHostComponent, providers });

    it('model → view and view → model', async () => {
      const { host, loader } = await render(createSignal);
      const autocomplete = await loader.getHarness(TnAutocompleteHarness);
      expect((await autocomplete.getInputValue()).trim()).toBe('da0 (2 TiB)');

      await autocomplete.selectOption('da1 (4 TiB)');

      expect(host.model().disk).toBe('da1');
      expect(host.fields.disk().dirty()).toBe(true);
    });

    it('data-test: same as formControlName', async () => {
      expect(await compareTestIds(createReactive, createSignal)).toEqual({
        reactive: ['autocomplete-unused-disk'],
        signalForms: ['autocomplete-unused-disk'],
      });
    });
  });

  describe('ix-ssh-credentials-select (IxSelectWithNewOption)', () => {
    const providers = [
      mockProvider(KeychainCredentialService, {
        getSshConnections: () => of([{ id: 1, name: 'work-nas' }, { id: 2, name: 'backup-nas' }] as KeychainCredential[]),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success({ id: 3 } as KeychainCredential)),
      }),
    ];
    const createSignal = createComponentFactory({ component: SignalSshCredentialsHostComponent, providers });
    const createReactive = createComponentFactory({ component: ReactiveSshCredentialsHostComponent, providers });

    it('model → view and view → model', async () => {
      const { host, loader } = await render(createSignal);
      const select = await loader.getHarness(TnSelectHarness);
      expect(await select.getDisplayText()).toBe('work-nas');

      await select.selectOption('backup-nas');

      expect(host.model().credentials).toBe(2);
      expect(host.fields.credentials().dirty()).toBe(true);
    });

    it('after Add New, the created record lands in the model', async () => {
      const { host, loader } = await render(createSignal);

      await (await loader.getHarness(TnSelectHarness)).selectOption('Add New');

      expect(host.model().credentials).toBe(3);
    });

    it('data-test: same as formControlName', async () => {
      expect(await compareTestIds(createReactive, createSignal)).toEqual({
        reactive: ['select-ssh-credentials'],
        signalForms: ['select-ssh-credentials'],
      });
    });
  });

  describe('ix-user-combobox (DirectoryFieldBase)', () => {
    const directory = {
      pageSize: 50,
      queryUsers: (search: string) => of(['root', 'operator']
        .filter((name) => name.startsWith(search))
        .map((name) => ({ label: ignoreTranslation(name), value: name }) as PrincipalOption)),
      userExists: () => of(true),
      createUser: () => of({ label: ignoreTranslation('newbie'), value: 'newbie' } as PrincipalOption),
    };
    const providers = [{ provide: UserDirectoryService, useValue: directory }];
    const createSignal = createComponentFactory({ component: SignalUserComboboxHostComponent, providers });
    const createValidated = createComponentFactory({
      component: SignalValidatedUserComboboxHostComponent,
      providers,
      detectChanges: false,
    });
    const createReactive = createComponentFactory({ component: ReactiveUserComboboxHostComponent, providers });

    it('model → view and view → model, with validateExistence off', async () => {
      const { host, loader } = await render(createSignal);
      const owner = await loader.getHarness(IxUserComboboxHarness);
      expect(await owner.getInputValue()).toBe('root');

      await owner.focus();
      await owner.selectOption('operator');

      expect(host.model().owner).toBe('operator');
      expect(host.fields.owner().dirty()).toBe(true);
    });

    // The default `validateExistence: true` calls add/removeAsyncValidators on `ngControl.control`,
    // which InteropNgControl does not have; writeValueAndNotify (the Add New path) calls setValue/markAsDirty.
    it('gap: with validateExistence on (the default) it throws on render and again on destroy', () => {
      const spectator = createValidated();
      expect(() => spectator.detectChanges()).toThrow('control.addAsyncValidators is not a function');
      expect(() => spectator.fixture.destroy()).toThrow('control.removeAsyncValidators is not a function');
    });

    it('gap: Add New throws, since writeValueAndNotify calls ngControl.control.setValue', async () => {
      const onUnhandledError = jest.fn();
      config.onUnhandledError = onUnhandledError;
      const { host, loader } = await render(createSignal);
      const owner = await loader.getHarness(IxUserComboboxHarness);

      try {
        await owner.focus();
        await owner.selectOption('Add New');
        // RxJS reports an error thrown in `next` on a later macrotask.
        await new Promise((resolve) => {
          setTimeout(resolve);
        });
      } finally {
        config.onUnhandledError = null;
      }

      expect(onUnhandledError).toHaveBeenCalledWith(new TypeError('control.setValue is not a function'));
      expect(host.model().owner).toBe('root');
    });

    it('data-test: same as formControlName (controlTestId falls back to the signal field name)', async () => {
      expect(await compareTestIds(createReactive, createSignal)).toEqual({
        reactive: ['autocomplete-owner'],
        signalForms: ['autocomplete-owner'],
      });
    });
  });
});
