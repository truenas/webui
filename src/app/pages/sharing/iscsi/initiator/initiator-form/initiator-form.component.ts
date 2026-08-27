import { ChangeDetectionStrategy, Component, computed, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCardAction,
  TnCardComponent,
  TnCheckboxComponent,
  TnFormFieldComponent,
  TnIconButtonComponent,
  TnInputComponent,
  TnProgressBarComponent,
} from '@truenas/ui-components';
import { unionBy } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { translated } from 'app/helpers/translated.helper';
import { helptextIscsi } from 'app/helptext/sharing';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { CanComponentDeactivate } from 'app/modules/unsaved-changes/unsaved-form.guard';
import { ApiService } from 'app/modules/websocket/api.service';
import { initiatorFormElements } from 'app/pages/sharing/iscsi/initiator/initiator-form/initiator-form.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface InitiatorItem {
  id: string;
  name: string;
}

/** The persisted half of the page's state — what a save writes, and what leaving would discard. */
interface InitiatorSnapshot {
  comment: string;
  all: boolean;
  initiators: string[];
}

@Component({
  selector: 'ix-initiator-form',
  templateUrl: './initiator-form.component.html',
  styleUrls: ['./initiator-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    UiSearchDirective,
    TnProgressBarComponent,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnInputComponent,
    TnButtonComponent,
    TnIconButtonComponent,
    TranslateModule,
    DualListBoxComponent,
  ],
})
export class InitiatorFormComponent implements OnInit, CanComponentDeactivate {
  private api = inject(ApiService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);
  private unsavedChangesService = inject(UnsavedChangesService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = initiatorFormElements;

  protected isFormLoading = signal(false);
  pk: number;

  form = this.fb.nonNullable.group({
    all: [false],
    comment: [''],
    new_initiator: [''],
  });

  /**
   * The state the page settled on, re-taken after a successful save so leaving isn't questioned.
   * Null until the initial load finishes — nothing typed before that could be a real edit.
   */
  private readonly savedState = signal<InitiatorSnapshot | null>(null);

  connectedInitiators = signal([] as IscsiGlobalSession[]);
  customInitiators = signal([] as InitiatorItem[]);
  selectedInitiators = signal([] as InitiatorItem[]);

  allInitiators = computed(() => {
    return this.connectedInitiators().map((item) => ({
      id: item.initiator,
      name: `${item.initiator} (${item.initiator_addr})`,
    })).concat(this.customInitiators());
  });

  get isAllowAll(): boolean {
    return this.form.getRawValue().all;
  }

  readonly helptext = helptextIscsi;
  protected readonly requiredRoles = [
    Role.SharingIscsiInitiatorWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  private readonly hasInitiatorWrite = toSignal(
    this.authService.hasRole(this.requiredRoles),
    { initialValue: false },
  );

  // `FormGroup.status` isn't reactive, so the declarative action's `disabled` can't read
  // `form.invalid` directly — a computed would never re-run for it under OnPush.
  private readonly formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status },
  );

  /**
   * Card footer actions. Returning `undefined` for Save is what gates it on the write role: the
   * declarative config has no structural-directive hook, so this replaces `*ixRequiresRoles` —
   * but not like for like. `*ixRequiresRoles` rendered the button inside
   * `MissingAccessWrapperComponent`, which kept Save visible-but-disabled with a tooltip saying
   * why; a read-only user now gets a footer with only Cancel and no explanation. The trade is
   * deliberate, and `group-members.component.ts` makes the same one.
   *
   * `translated()`, not `computed()`: these read `translate.instant()`, which resolves against
   * whatever catalog is loaded when the signal is first read. Language changes are live here
   * (`LanguageService.setLanguage()` calls `translate.use()` with no reload), so a plain
   * `computed` would leave the footer in the previous language — `secondaryAction` has no other
   * dependency at all and would never recompute.
   */
  protected readonly primaryAction = translated<TnCardAction | undefined>((translate) => {
    if (!this.hasInitiatorWrite()) {
      return undefined;
    }
    return {
      label: translate.instant('Save'),
      handler: () => this.onSubmit(),
      disabled: this.isFormLoading() || this.formStatus() === 'INVALID',
      testId: 'save',
    };
  });

  protected readonly secondaryAction = translated<TnCardAction>((translate) => ({
    label: translate.instant('Cancel'),
    handler: () => this.onCancel(),
    testId: 'cancel',
  }));

  ngOnInit(): void {
    this.isFormLoading.set(true);
    this.activatedRoute.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params.pk) {
        this.pk = parseInt(params.pk as string, 10);
        this.setForm();
      } else {
        this.isFormLoading.set(false);
        this.captureSavedState();
      }
    });

    this.getConnectedInitiators();
  }

  canDeactivate(): Observable<boolean> {
    return this.hasUnsavedChanges() ? this.unsavedChangesService.showConfirmDialog() : of(true);
  }

  protected onCancel(): void {
    this.router.navigate(['/', 'sharing', 'iscsi', 'initiators']);
  }

  /**
   * Snapshots what is on screen now. Reads the UI, not the save payload — with "Allow All" on,
   * the payload drops the initiators, and comparing against that emptied list would make every
   * post-save navigation look like a discard.
   */
  private captureSavedState(): void {
    const { comment, all } = this.form.getRawValue();

    this.savedState.set({
      comment,
      all,
      initiators: this.selectedInitiators().map((item) => item.id),
    });
  }

  private hasUnsavedChanges(): boolean {
    const saved = this.savedState();

    if (!saved) {
      return false;
    }

    const { comment, all } = this.form.getRawValue();

    if (comment !== saved.comment || all !== saved.all) {
      return true;
    }

    // Allowed initiators are a set: moving one out of the picker and back leaves the same
    // people in a different order, and that is not a change worth asking about. `new_initiator`
    // is scratch space for the Add button, so what is left sitting in it is not an edit either.
    const currentIds = this.selectedInitiators().map((item) => item.id);

    return currentIds.length !== saved.initiators.length
      || currentIds.some((id) => !saved.initiators.includes(id));
  }

  protected onSubmit(): void {
    const payload = {
      comment: this.form.getRawValue().comment,
      initiators: this.isAllowAll ? [] : this.selectedInitiators().map((item) => item.id),
    };

    let request;
    if (this.pk === undefined) {
      request = this.api.call('iscsi.initiator.create', [payload]);
    } else {
      request = this.api.call('iscsi.initiator.update', [this.pk, payload]);
    }

    this.isFormLoading.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        // Re-baseline before navigating away, or the deactivate guard questions our own save.
        this.captureSavedState();
        this.onCancel();
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected getConnectedInitiators(): void {
    this.api.call('iscsi.global.sessions').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sessions) => {
        this.connectedInitiators.set(unionBy(sessions, (item) => item.initiator && item.initiator_addr));
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected onAddInitiator(): void {
    const newInitiator = this.form.value.new_initiator;
    if (newInitiator) {
      if (!this.allInitiators().find((item) => item.id === newInitiator)) {
        this.customInitiators.set([...this.customInitiators(), { id: newInitiator, name: newInitiator }]);
        this.selectedInitiators.set([...this.selectedInitiators(), { id: newInitiator, name: newInitiator }]);
      }
      this.form.controls.new_initiator.setValue('');
    }
  }

  private setForm(): void {
    this.api.call('iscsi.initiator.query', [[['id', '=', this.pk]]])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (initiators) => {
          if (initiators.length) {
            const initiator = initiators[0];
            this.form.controls.comment.setValue(initiator.comment);
            this.form.controls.all.setValue(initiator.initiators.length === 0);
            this.customInitiators.set(initiator.initiators.map((item) => ({ id: item, name: item })));
            this.selectedInitiators.set(initiator.initiators.map((item) => ({ id: item, name: item })));
          }
          this.isFormLoading.set(false);
          this.captureSavedState();
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
