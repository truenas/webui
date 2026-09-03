/* eslint-disable max-classes-per-file, angular-file-naming/component-filename-suffix --
   a stub directory and the host component that renders the four pickers, both local to
   this spec and never shipped. */
import { OverlayContainer } from '@angular/cdk/overlay';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { TnFormFieldComponent } from '@truenas/ui-components';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import {
  IxGroupChipsComponent,
} from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-group-chips.component';
import {
  IxGroupComboboxComponent,
} from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-group-combobox.component';
import {
  IxUserChipsComponent,
} from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-user-chips.component';
import {
  IxUserComboboxComponent,
} from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-user-combobox.component';
import {
  IxGroupChipsHarness, IxUserChipsHarness, IxUserComboboxHarness,
} from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import {
  DirectoryQueryOptions, PrincipalOption, UserDirectoryService,
} from 'app/services/user-directory.service';

/**
 * The four user/group pickers, against a stub directory.
 *
 * These replaced five near-identical wrappers built on `ix-combobox` /
 * `ix-chips`, so what matters here is the contract those wrappers carried: the
 * value reaches a form control through two levels of `ControlValueAccessor`, a
 * typed name that does not exist is rejected, and an edit form does not open
 * already showing errors for values it just loaded.
 *
 * TrueNAS query shaping is not covered here — that lives in
 * `UserDirectoryService` and is covered by its own spec.
 */

const users = ['root', 'operator', 'admin'];
const groups = ['wheel', 'builtin_administrators'];

const toOptions = (names: string[]): PrincipalOption[] => names.map((name) => ({
  label: ignoreTranslation(name),
  value: name,
}));

class StubDirectory {
  readonly pageSize = 50;

  /** Every `directoryOptions` bag a field passed through. */
  seenOptions: DirectoryQueryOptions[] = [];

  /** Swappable, so a spec can make a lookup fail. */
  queryUsersImpl: (search: string) => Observable<PrincipalOption[]> = (search) => of(
    toOptions(users.filter((name) => name.startsWith(search))),
  );

  createUserImpl: () => Observable<PrincipalOption | null> = () => of(null);

  queryUsers(search: string, page: number, options: DirectoryQueryOptions): Observable<PrincipalOption[]> {
    this.seenOptions.push(options);
    return this.queryUsersImpl(search);
  }

  queryGroups(search: string, page: number, options: DirectoryQueryOptions): Observable<PrincipalOption[]> {
    this.seenOptions.push(options);
    return of(toOptions(groups.filter((name) => name.startsWith(search))));
  }

  userExists(username: string): Observable<boolean> {
    return of(users.includes(username));
  }

  groupExists(groupName: string): Observable<boolean> {
    return of(groups.includes(groupName));
  }

  createUser(options: DirectoryQueryOptions): Observable<PrincipalOption | null> {
    this.seenOptions.push(options);
    return this.createUserImpl();
  }
}

/** Interpolates the message templates the fields use, as ngx-translate would. */
const fakeTranslate = {
  instant: jest.fn((key: string, params?: Record<string, unknown>) => {
    return key.replaceAll(/\{(\w+)\}/g, (match, name: string) => (
      params && name in params ? String(params[name]) : match
    ));
  }),
};

@Component({
  selector: 'ix-directory-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxUserComboboxComponent,
    IxGroupComboboxComponent,
    IxUserChipsComponent,
    IxGroupChipsComponent,
    TnFormFieldComponent,
    ReactiveFormsModule,
  ],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations
  template: `
    <form [formGroup]="form">
      @if (showOwner()) {
        <tn-form-field label="Owner">
          <ix-user-combobox
            formControlName="owner"
            [allowCreate]="allowCreate()"
            [directoryOptions]="directoryOptions()"
            [extraOptions]="extraOptions()"
            [validateExistence]="validateOwner()"
            [debounce]="0"
          ></ix-user-combobox>
        </tn-form-field>
      }

      <tn-form-field label="Group">
        <ix-group-combobox formControlName="group" [debounce]="0"></ix-group-combobox>
      </tn-form-field>

      <tn-form-field label="Users">
        <ix-user-chips formControlName="userList" [extraOptions]="extraOptions()" [debounce]="0"></ix-user-chips>
      </tn-form-field>

      <tn-form-field label="Groups">
        <ix-group-chips formControlName="groupList" [debounce]="0"></ix-group-chips>
      </tn-form-field>
    </form>
  `,
})
class DirectoryHostComponent {
  form = new FormGroup({
    owner: new FormControl<string | null>(null),
    group: new FormControl<string | null>(null),
    userList: new FormControl<string[]>([]),
    groupList: new FormControl<string[]>([]),
  });

  get owner(): FormControl<string | null> { return this.form.controls.owner; }
  get groupList(): FormControl<string[] | null> { return this.form.controls.groupList; }

  allowCreate = signal(false);
  directoryOptions = signal<DirectoryQueryOptions>({});
  extraOptions = signal<PrincipalOption[]>([]);
  /** Lets a spec destroy the owner field while its control stays in the form. */
  showOwner = signal(true);
  validateOwner = signal(true);
}

describe('ix-user-* / ix-group-* directory pickers', () => {
  let fixture: ComponentFixture<DirectoryHostComponent>;
  let host: DirectoryHostComponent;
  let loader: HarnessLoader;
  let directory: StubDirectory;

  /** Let the zero-length validation timer and the stub's `of()` settle. */
  async function settle(): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    directory = new StubDirectory();

    await TestBed.configureTestingModule({
      imports: [DirectoryHostComponent],
      providers: [
        { provide: UserDirectoryService, useValue: directory },
        { provide: TranslateService, useValue: fakeTranslate },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectoryHostComponent);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
  });

  describe('value plumbing', () => {
    it('commits a picked user through both accessors to the form control', async () => {
      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();

      expect(await owner.getOptions()).toEqual(users);

      await owner.selectOption('operator');

      expect(host.owner.value).toBe('operator');
    });

    it('renders a value written before the inner control existed', async () => {
      // The forms layer hands a CVA its value while setting the directive up,
      // which is before the inner view is created — the buffered replay is what
      // keeps an edit form from opening blank.
      const owner = await loader.getHarness(IxUserComboboxHarness);

      expect(await owner.getInputValue()).toBe('');

      host.owner.setValue('root');
      await settle();

      expect(await owner.getInputValue()).toBe('root');
    });

    it('commits a typed custom value on blur', async () => {
      // The draft has to survive every change-detection pass between the
      // keystroke and the blur: the effect that registers the inner control
      // re-runs constantly, and replaying `writeValue` on each run would wipe
      // the text, leaving nothing to commit and a field that silently refuses
      // everything typed into it.
      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.setInputValue('typed-name');
      fixture.detectChanges();
      await owner.blur();
      await settle();

      expect(host.owner.value).toBe('typed-name');
      expect(await owner.getInputValue()).toBe('typed-name');
    });

    it('reflects the disabled state of the form control', async () => {
      const owner = await loader.getHarness(IxUserComboboxHarness);
      host.owner.disable();
      await settle();

      expect(await owner.isDisabled()).toBe(true);
    });

    it('commits chips to a list-valued control', async () => {
      const groupChips = await loader.getHarness(IxGroupChipsHarness);
      await groupChips.addChip('wheel');

      expect(host.groupList.value).toEqual(['wheel']);
    });
  });

  describe('test ids', () => {
    it('stamps the inner control from the bound control name', () => {
      // The inner control has no NgControl of its own — this field claimed it —
      // so without the base being resolved here and passed down, every
      // data-test on a user/group field would silently disappear.
      const input = fixture.nativeElement
        .querySelector('ix-user-combobox .tn-autocomplete__input') as HTMLElement;

      expect(input.getAttribute('data-testid')).toBe('autocomplete-owner');
    });
  });

  describe('[extraOptions]', () => {
    it('lists a pinned option ahead of the fetched page, without duplicating it', async () => {
      // A value already on the record, resolved to its name elsewhere: the
      // search cannot produce it, but the field still has to name it.
      host.extraOptions.set([
        { label: ignoreTranslation('archived-user'), value: 4242 },
        { label: ignoreTranslation('root'), value: 'root' },
      ]);
      fixture.detectChanges();

      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();

      expect(await owner.getOptions()).toEqual(['archived-user', 'root', 'operator', 'admin']);
    });

    it('upgrades a written id to its pinned name, and does not commit the id back as text', async () => {
      // The whole point of the input: a record holding an id renders it as a
      // name. The display starts as the raw id — nothing can resolve it before
      // the first page is fetched — and the first page only ever lands with the
      // panel OPEN, which is exactly when the field leaves its text alone. Left
      // un-upgraded, `allowCustomValue` then committed that text on blur and
      // the numeric id became the string "4242".
      host.extraOptions.set([{ label: ignoreTranslation('archived-user'), value: 4242 }]);
      host.owner.setValue(4242 as unknown as string);
      fixture.detectChanges();

      const owner = await loader.getHarness(IxUserComboboxHarness);
      expect(await owner.getInputValue()).toBe('4242');

      await owner.focus();
      await settle();
      expect(await owner.getInputValue()).toBe('archived-user');

      await owner.blur();
      await settle();

      expect(host.owner.value).toBe(4242);
    });

    it('names a chip for a value the chips field has never fetched', async () => {
      // The chips field resolves a chip's text from the options it has, and
      // with a `[dataSource]` those arrive no earlier than the first focus — so
      // an edit form rendered every pinned id raw until someone clicked it.
      host.extraOptions.set([{ label: ignoreTranslation('archived-user'), value: 4242 }]);
      host.form.controls.userList.setValue([4242 as unknown as string]);
      await settle();

      const userList = await loader.getHarness(IxUserChipsHarness);

      expect(await userList.getChips()).toEqual(['archived-user']);
    });

    it('lists a pinned option that arrives after the first page', async () => {
      // The documented use is "an id already on the record, resolved to its
      // display name elsewhere", and that resolution normally lands
      // asynchronously — after the panel has already fetched its first page.
      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      expect(await owner.getOptions()).toEqual(users);

      host.extraOptions.set([{ label: ignoreTranslation('archived-user'), value: 4242 }]);
      await settle();

      expect(await owner.getOptions()).toEqual(['archived-user', ...users]);
    });
  });

  describe('directoryOptions', () => {
    it('passes the bag through to the directory verbatim', async () => {
      host.directoryOptions.set({ localOnly: true, valueField: 'id' });
      fixture.detectChanges();

      await (await loader.getHarness(IxUserComboboxHarness)).focus();

      expect(directory.seenOptions).toContainEqual({ localOnly: true, valueField: 'id' });
    });

    it('re-queries when the bag changes, rather than waiting for a keystroke', async () => {
      // The source function reads the bag at call time, which keeps it from
      // being swapped out mid-search — but nothing calls it again on its own,
      // so the panel used to keep serving the previous narrowing's results and
      // a pick could commit a value the new one was meant to exclude.
      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      expect(await owner.getOptions()).toEqual(users);

      directory.queryUsersImpl = () => of(toOptions(['privileged']));
      host.directoryOptions.set({ localOnly: true });
      await settle();

      expect(directory.seenOptions).toContainEqual({ localOnly: true });
      expect(await owner.getOptions()).toEqual(['privileged']);
    });

    it('refetches on the next open when the bag changed while the field was closed', async () => {
      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.blur();
      await settle();

      directory.queryUsersImpl = () => of(toOptions(['privileged']));
      host.directoryOptions.set({ localOnly: true });
      await settle();

      await owner.focus();

      expect(await owner.getOptions()).toEqual(['privileged']);
    });
  });

  describe('existence validation', () => {
    it('does not flag a value the form was opened with', async () => {
      // Attaching the validator must not RUN it. A parent patches its form in
      // its own ngOnInit, which is before this field's — so an edit form opens
      // showing the loaded value plainly, not as an error. A fresh fixture,
      // because the shared one has already initialized its fields.
      const fresh = TestBed.createComponent(DirectoryHostComponent);
      fresh.componentInstance.form.controls.owner.setValue('does-not-exist');

      fresh.detectChanges();
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
      fresh.detectChanges();
      await fresh.whenStable();

      expect(fresh.componentInstance.form.controls.owner.errors).toBeNull();
    });

    it('rejects a typed user that the directory does not have', async () => {
      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.setInputValue('ghost');
      await owner.blur();
      await settle();

      expect(host.owner.errors?.userDoesNotExist).toEqual({
        message: 'User "ghost" does not exist',
      });
    });

    it('accepts a typed user that does exist', async () => {
      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.setInputValue('admin');
      await owner.blur();
      await settle();

      expect(host.owner.errors).toBeNull();
    });

    it('names every missing group in one message', async () => {
      const groupChips = await loader.getHarness(IxGroupChipsHarness);
      await groupChips.addChip('wheel');
      await groupChips.addChip('ghost-a');
      await groupChips.addChip('ghost-b');
      await settle();

      expect(host.groupList.errors?.groupsDoNotExist).toEqual({
        message: 'The following groups do not exist: ghost-a, ghost-b',
      });
    });

    it('settles a single-name check against a directory that never completes', async () => {
      // Angular composes async validators with `forkJoin`, which emits only
      // when its source COMPLETES — even when there is exactly one of them. A
      // `userExists` answering from a cache that never completes would park the
      // control in PENDING and any submit gated on validity would stay disabled
      // forever. The chips path was unaffected, which is what made this hard to
      // spot.
      jest.spyOn(directory, 'userExists').mockReturnValue(new BehaviorSubject(false));

      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.setInputValue('ghost');
      await owner.blur();
      await settle();

      expect(host.owner.status).not.toBe('PENDING');
      expect(host.owner.errors?.userDoesNotExist).toBeDefined();
    });

    it('honours [validateExistence] flipping on and off after init', async () => {
      // A signal input whose later values were ignored: attached once from
      // ngOnInit, `[validateExistence]="showAdvanced()"` starting false never
      // attached anything, and a typo passed validation for the life of the
      // form.
      host.validateOwner.set(false);
      fixture.detectChanges();

      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.setInputValue('ghost');
      await owner.blur();
      await settle();
      expect(host.owner.errors).toBeNull();

      host.validateOwner.set(true);
      fixture.detectChanges();
      host.owner.updateValueAndValidity();
      await settle();
      expect(host.owner.errors?.userDoesNotExist).toBeDefined();

      host.validateOwner.set(false);
      fixture.detectChanges();
      await settle();
      expect(host.owner.errors).toBeNull();
    });

    it('takes its validator off a control that outlives the field', async () => {
      // The control is the form's, not the field's: a field inside an @if (or a
      // stepper page) is destroyed and re-created while the control stays put.
      // Left attached, the validator from the destroyed instance keeps flagging
      // a value from a component nobody can see or correct — and the re-created
      // instance adds a second validator, so every pass runs N duplicate
      // directory lookups.
      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.setInputValue('ghost');
      await owner.blur();
      await settle();
      expect(host.owner.errors?.userDoesNotExist).toBeDefined();

      host.showOwner.set(false);
      await settle();

      expect(host.owner.errors).toBeNull();
      expect(host.owner.asyncValidator).toBeNull();
    });

    it('does not flag a name when the existence lookup itself fails', async () => {
      // A transport error is not evidence that a real user is wrong.
      jest.spyOn(directory, 'userExists').mockReturnValue(throwError(() => new Error('offline')));

      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.setInputValue('ghost');
      await owner.blur();
      await settle();

      expect(host.owner.errors).toBeNull();
    });
  });

  describe('[allowCreate]', () => {
    it('offers no create row by default', async () => {
      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();

      expect(await owner.getOptions()).toEqual(users);
    });

    it('pins the create row and selects whoever the flow returns', async () => {
      host.allowCreate.set(true);
      directory.createUserImpl = () => of({ label: ignoreTranslation('newbie'), value: 'newbie' });
      fixture.detectChanges();

      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();

      expect(await owner.getOptions()).toEqual(['Add New', ...users]);

      await owner.selectOption('Add New');
      await settle();

      expect(host.owner.value).toBe('newbie');
    });

    it('shows the created principal by name, not by the id it was given', async () => {
      // `writeValue` cannot know a label, so committing the value alone left an
      // id-valued field displaying the raw id until the user happened to search
      // for the user they had just created.
      host.allowCreate.set(true);
      directory.createUserImpl = () => of({ label: ignoreTranslation('newbie'), value: 1234 });
      fixture.detectChanges();

      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.selectOption('Add New');
      await settle();

      expect(host.owner.value).toBe(1234);
      expect(await owner.getInputValue()).toBe('newbie');
    });

    it('leaves the previous selection alone when the create flow is dismissed', async () => {
      host.allowCreate.set(true);
      directory.createUserImpl = () => of(null);
      fixture.detectChanges();

      const owner = await loader.getHarness(IxUserComboboxHarness);
      await owner.focus();
      await owner.selectOption('root');
      await settle();

      await owner.focus();
      await owner.selectOption('Add New');
      await settle();

      expect(host.owner.value).toBe('root');
      expect(await owner.getInputValue()).toBe('root');
    });
  });
});
