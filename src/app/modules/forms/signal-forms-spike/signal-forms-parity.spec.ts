import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnFormFieldHarness, TnFormListHarness, TnFormListItemHarness, TnIconTesting,
  TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import {
  defer, of, Subject, throwError,
} from 'rxjs';
import {
  provideTnFormFieldDismissibleErrors, provideTnFormFieldErrors,
} from 'app/core/providers/tn-form-field-errors.provider';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiErrorName, JsonRpcErrorCode } from 'app/enums/api.enum';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { TnFormControlHarness } from 'app/modules/forms/ix-forms/testing/tn-form-control.harness';
import {
  ReactiveSpikeFormComponent, SignalSpikeFormComponent, SpikeApi, SpikeFormValue,
} from 'app/modules/forms/signal-forms-spike/signal-forms-spike.fixtures';
import {
  FormSidePanelContainerComponent,
} from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ApiCallError } from 'app/services/errors/error.classes';

type SpikeForm = ReactiveSpikeFormComponent | SignalSpikeFormComponent;

const saveSelector = 'tn-button[tnSidePanelAction]';

function validationError(...extra: [string, string][]): ApiCallError {
  return new ApiCallError({
    code: JsonRpcErrorCode.CallError,
    message: 'Validation error',
    data: {
      error: 11,
      errname: ApiErrorName.Validation,
      extra: extra.map(([field, message]) => [field, message, 22]),
      trace: { class: 'ValidationErrors', formatted: '', repr: '' },
      reason: '',
    },
  } as ConstructorParameters<typeof ApiCallError>[0]);
}

function nextMacrotask(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve);
  });
}

function wirePayload(save$: jest.SpyInstance): unknown {
  return JSON.parse(JSON.stringify(save$.mock.lastCall?.[0]));
}

/**
 * NAS-145110. The behaviour contract of a form in this repo, as one suite run against the same form written
 * with Reactive Forms and with signal forms, through the real side-panel container, Save button, `<ix-form>`
 * and (for the reactive one) `FormErrorHandlerService`. The signal form carries the prototype bridge from
 * the fixtures; `signal-forms-compat.spec.ts` shows what happens without it.
 */
describe.each<[string, ComponentType<SpikeForm>]>([
  ['Reactive Forms', ReactiveSpikeFormComponent],
  ['signal forms', SignalSpikeFormComponent],
])('form behaviour contract: %s (NAS-145110)', (_, formType) => {
  let fixture: ComponentFixture<FormSidePanelContainerComponent>;
  let loader: HarnessLoader;
  let api: SpikeApi;

  const createContainer = createComponentFactory({
    component: FormSidePanelContainerComponent,
    detectChanges: false,
    providers: [
      mockAuth(),
      SpikeApi,
      provideTnFormFieldErrors(),
      provideTnFormFieldDismissibleErrors(),
      mockProvider(ErrorHandlerService),
      // setup-jest.ts mocks this globally. The reactive form needs the real one to exercise the real mapping.
      { provide: FormErrorHandlerService, useClass: FormErrorHandlerService },
      mockProvider(SnackbarService),
      mockProvider(UnsavedChangesService, { showConfirmDialog: () => of(true) }),
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
      ...TnIconTesting.jest.providers(),
    ],
  });

  async function open(inputs: Record<string, unknown> = {}): Promise<void> {
    fixture = createContainer().fixture;
    fixture.componentRef.setInput('portal', new ComponentPortal(formType));
    fixture.componentRef.setInput('formInputs', inputs);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  }

  beforeEach(() => {
    api = TestBed.inject(SpikeApi);
    Element.prototype.scrollIntoView = jest.fn();
  });

  const hostedForm = (): SpikeForm => fixture.debugElement.query(
    (node) => node.componentInstance instanceof formType,
  ).componentInstance as SpikeForm;

  const field = (label: string): Promise<TnFormFieldHarness> => loader.getHarness(TnFormFieldHarness.with({ label }));
  const input = (label: string): Promise<TnFormControlHarness> => {
    return loader.getHarness(TnFormControlHarness.with({ label }));
  };
  const firstInput = (): Promise<TnInputHarness> => loader.getHarness(TnInputHarness);
  const save = (): Promise<TnButtonHarness> => loader.getHarness(TnButtonHarness.with({ selector: saveSelector }));
  const isSaveEnabled = async (): Promise<boolean> => !(await (await save()).isDisabled());
  const selectProtocol = async (label: string): Promise<void> => {
    await (await loader.getHarness(TnSelectHarness)).selectOption(label);
  };
  const clickSave = async (): Promise<void> => {
    await (await save()).click();
    await fixture.whenStable();
  };
  const dataTests = (): string[] => Array.from(document.querySelectorAll('ix-form [data-test]'))
    .map((element) => element.getAttribute('data-test') as string)
    .filter((id) => /^(input|select|checkbox|button)-/.test(id))
    .sort((a, b) => a.localeCompare(b));

  describe('rendering', () => {
    it('shows the same defaults and labels', async () => {
      await open();
      expect(await (await input('Name')).getValue()).toBe('');
      expect(await (await loader.getHarness(TnSelectHarness)).getDisplayText()).toBe('HTTP');
      expect(await (await loader.getHarness(TnCheckboxHarness)).isChecked()).toBe(false);
      expect(await loader.getHarnessOrNull(TnFormFieldHarness.with({ label: 'Port' }))).toBeNull();
      expect(await (await field('Name')).isRequired()).toBe(true);
    });

    it('resolves the data-test selectors the E2E suite relies on', async () => {
      await open();
      await selectProtocol('HTTPS');
      await (await loader.getHarness(TnFormListHarness)).add();

      expect(dataTests()).toEqual(expect.arrayContaining([
        'checkbox-enabled', 'input-host', 'input-name', 'input-port', 'select-protocol',
      ]));
    });
  });

  describe('validation', () => {
    it('keeps Save disabled until the form is valid', async () => {
      await open();
      expect(await isSaveEnabled()).toBe(false);
      await (await input('Name')).setValue('abc');
      expect(await isSaveEnabled()).toBe(true);
    });

    it('shows the translated required message once the field is touched, not before', async () => {
      await open();
      const name = await field('Name');
      expect(await name.hasError()).toBe(false);

      await (await firstInput()).focus();
      await (await firstInput()).blur();

      expect(await name.getErrorMessage()).toBe('Field is required');
    });

    it('shows the translated min length message', async () => {
      await open();
      await (await input('Name')).setValue('ab');
      expect(await (await field('Name')).getErrorMessage()).toBe('The length of the field should be at least 3');
    });

    it('does not block Save while an async validator is still pending', async () => {
      const answer$ = new Subject<boolean>();
      jest.spyOn(api, 'isNameTaken').mockReturnValue(answer$);
      await open();

      // Not awaited: harness stabilisation would wait on the validator this test keeps in flight.
      const typed = (await firstInput()).setValue('abc');
      await nextMacrotask();
      fixture.detectChanges();

      expect(hostedForm().canSubmit()).toBe(true);
      answer$.next(false);
      answer$.complete();
      await typed;

      expect(await isSaveEnabled()).toBe(true);
    });

    it('blocks Save and shows the message when an async validator rejects', async () => {
      jest.spyOn(api, 'isNameTaken').mockReturnValue(of(true));
      await open();
      await (await input('Name')).setValue('abc');
      await fixture.whenStable();

      expect(await (await field('Name')).getErrorMessage()).toBe('This name is already in use.');
      expect(await isSaveEnabled()).toBe(false);
    });
  });

  describe('conditional fields', () => {
    beforeEach(async () => {
      await open();
      await (await input('Name')).setValue('abc');
    });

    it('a field that appears becomes required and blocks Save', async () => {
      expect(await isSaveEnabled()).toBe(true);
      await selectProtocol('HTTPS');
      expect(await isSaveEnabled()).toBe(false);
      await (await input('Port')).setValue('443');
      expect(await isSaveEnabled()).toBe(true);
    });

    it('a hidden required field stops blocking Save and stays out of the payload', async () => {
      const save$ = jest.spyOn(api, 'save');
      await selectProtocol('HTTPS');
      expect(await isSaveEnabled()).toBe(false);

      await selectProtocol('HTTP');
      expect(await isSaveEnabled()).toBe(true);
      await clickSave();

      expect(save$).toHaveBeenCalledWith({
        name: 'abc', protocol: 'http', enabled: false, aliases: [],
      });
    });

    it('keeps the value when a field is hidden and shown again', async () => {
      await selectProtocol('HTTPS');
      await (await input('Port')).setValue('443');
      await selectProtocol('HTTP');
      await selectProtocol('HTTPS');
      expect(String(await (await input('Port')).getValue())).toBe('443');
    });
  });

  describe('list rows', () => {
    const hostInputs = (): Promise<TnInputHarness[]> => loader.getAllHarnesses(TnInputHarness.with({
      ancestor: 'tn-form-list',
    }));

    beforeEach(async () => {
      await open();
      await (await input('Name')).setValue('abc');
    });

    it('an empty row blocks Save, filling it unblocks', async () => {
      await (await loader.getHarness(TnFormListHarness)).add();
      expect(await isSaveEnabled()).toBe(false);
      await (await hostInputs())[0].setValue('one');
      expect(await isSaveEnabled()).toBe(true);
    });

    it('removing a middle row keeps the other rows, their values and the payload right', async () => {
      const save$ = jest.spyOn(api, 'save');
      const list = await loader.getHarness(TnFormListHarness);
      await list.add();
      await list.add();
      await list.add();
      const rows = await hostInputs();
      await rows[0].setValue('one');
      await rows[1].setValue('two');
      await rows[2].setValue('three');

      const items = await loader.getAllHarnesses(TnFormListItemHarness);
      await items[1].remove();

      const remaining = await hostInputs();
      expect(await Promise.all(remaining.map((row) => row.getValue()))).toEqual(['one', 'three']);
      await clickSave();
      // Compared as the JSON the middleware receives: signal forms stamp rows with a symbol, see the compat spec.
      expect(wirePayload(save$)).toEqual(expect.objectContaining({ aliases: [{ host: 'one' }, { host: 'three' }] }));
      expect(hostedForm().hasUnsavedChanges()).toBe(true);
    });
  });

  describe('saving', () => {
    beforeEach(async () => {
      await open();
      await (await input('Name')).setValue('abc');
    });

    it('sends the payload, shows the snackbar and closes', async () => {
      const save$ = jest.spyOn(api, 'save');
      const closed = jest.fn();
      hostedForm().closed.subscribe(closed);

      await (await loader.getHarness(TnCheckboxHarness)).check();
      await selectProtocol('HTTPS');
      await (await input('Port')).setValue('443');
      await clickSave();

      expect(save$).toHaveBeenCalledWith({
        name: 'abc', protocol: 'https', port: 443, enabled: true, aliases: [],
      });
      expect(TestBed.inject(SnackbarService).success).toHaveBeenCalledWith('Saved');
      expect(closed).toHaveBeenCalledWith(true);
    });

    it('reports the form as saving, and blocks Save, while the request is in flight', async () => {
      const response$ = new Subject<unknown>();
      jest.spyOn(api, 'save').mockReturnValue(response$);

      await (await save()).click();

      expect(hostedForm().isSubmitting()).toBe(true);
      expect(hostedForm().canSubmit()).toBe(false);
      expect(await (await save()).getLabel()).toContain('Saving');
      response$.next(true);
    });
  });

  describe('API validation errors', () => {
    const rejectWith = (error: unknown): void => {
      jest.spyOn(api, 'save').mockReturnValue(throwError(() => error));
    };

    beforeEach(async () => {
      await open();
      await (await input('Name')).setValue('abc');
    });

    it('pins the message under the field and blocks Save', async () => {
      rejectWith(validationError(['app_create.name', 'Name was refused.']));
      await clickSave();

      expect(await (await field('Name')).getErrorMessage()).toBe('Name was refused.');
      expect(await isSaveEnabled()).toBe(false);
      expect(TestBed.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();
    });

    it('focuses the first failing field', async () => {
      rejectWith(validationError(['app_create.name', 'Name was refused.']));
      // Typing left focus on the field, which would make this pass with no focus handling at all.
      await (await firstInput()).blur();
      (document.activeElement as HTMLElement | null)?.blur();
      expect(document.activeElement?.getAttribute('data-test')).not.toBe('input-name');

      await clickSave();
      await nextMacrotask();

      expect(document.activeElement?.getAttribute('data-test')).toBe('input-name');
    });

    it('editing the flagged field clears its message', async () => {
      rejectWith(validationError(['app_create.name', 'Name was refused.']));
      await clickSave();

      await (await input('Name')).setValue('abcd');

      expect(await (await field('Name')).hasError()).toBe(false);
      expect(await isSaveEnabled()).toBe(true);
    });

    it('editing an unrelated field retires the verdict, so Force-style answers do not leave Save stuck', async () => {
      rejectWith(validationError(['app_create.name', 'Name was refused.']));
      await clickSave();

      await (await loader.getHarness(TnCheckboxHarness)).check();
      await fixture.whenStable();

      expect(await isSaveEnabled()).toBe(true);
    });

    it('the message can be dismissed', async () => {
      rejectWith(validationError(['app_create.name', 'Name was refused.']));
      await clickSave();
      const name = await field('Name');

      expect(await name.isErrorDismissible()).toBe(true);
      await name.dismissError();

      expect(await name.hasError()).toBe(false);
      expect(await isSaveEnabled()).toBe(true);
    });

    it('a field the form does not have falls back to the error modal', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation();
      rejectWith(validationError(['app_create.mystery', 'No such field.']));
      await clickSave();

      expect(TestBed.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });

    it('a non-validation failure goes to the error modal and leaves the form open', async () => {
      const closed = jest.fn();
      hostedForm().closed.subscribe(closed);
      rejectWith(new Error('Socket closed'));
      await clickSave();

      expect(TestBed.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledTimes(1);
      expect(closed).not.toHaveBeenCalled();
      expect(await isSaveEnabled()).toBe(true);
    });
  });

  describe('edit mode', () => {
    const config: SpikeFormValue = {
      name: 'stored', protocol: 'https', port: 8443, enabled: true, aliases: [{ host: 'one' }],
    };

    it('loads the record, stays pristine and allows Save without changes', async () => {
      jest.spyOn(api, 'load').mockReturnValue(of(config));
      await open({ isEdit: true });

      expect(await (await input('Name')).getValue()).toBe('stored');
      expect(String(await (await input('Port')).getValue())).toBe('8443');
      expect(await (await input('Host')).getValue()).toBe('one');
      expect(hostedForm().hasUnsavedChanges()).toBe(false);
      expect(await isSaveEnabled()).toBe(true);
    });

    it('flags unsaved changes as soon as the user edits', async () => {
      jest.spyOn(api, 'load').mockReturnValue(of(config));
      await open({ isEdit: true });
      await (await input('Name')).setValue('changed');
      expect(hostedForm().hasUnsavedChanges()).toBe(true);
    });

    it('blocks Save while the record loads', async () => {
      const load$ = new Subject<SpikeFormValue>();
      jest.spyOn(api, 'load').mockReturnValue(load$);
      await open({ isEdit: true });

      expect(await isSaveEnabled()).toBe(false);
      expect(hostedForm().isBusy()).toBe(true);

      load$.next(config);
      load$.complete();
      await fixture.whenStable();
      expect(await isSaveEnabled()).toBe(true);
    });

    it('blocks Save when the load fails and recovers on retry', async () => {
      const response$ = new Subject<SpikeFormValue>();
      let attempts = 0;
      // Cold like ApiService.call: retryLoad re-subscribes to the same observable rather than calling load() again.
      jest.spyOn(api, 'load').mockReturnValue(defer(() => {
        attempts += 1;
        return attempts === 1 ? throwError(() => new Error('Load failed')) : response$;
      }));
      await open({ isEdit: true });

      expect(hostedForm().hasLoadFailed()).toBe(true);
      expect(await isSaveEnabled()).toBe(false);
      expect(TestBed.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledTimes(1);

      await (await loader.getHarness(TnButtonHarness.with({ label: 'Retry' }))).click();
      expect(attempts).toBe(2);
      expect(hostedForm().hasLoadFailed()).toBe(false);
      expect(await isSaveEnabled()).toBe(false);

      response$.next(config);
      response$.complete();
      await fixture.whenStable();

      expect(hostedForm().hasLoadFailed()).toBe(false);
      expect(await (await input('Name')).getValue()).toBe('stored');
      expect(await isSaveEnabled()).toBe(true);
    });
  });
});
