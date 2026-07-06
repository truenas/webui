import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Observable, of, Subscription } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { InitShutdownScriptType, initShutdownScriptTypeLabels } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen, initShutdownScriptWhenLabels } from 'app/enums/init-shutdown-script-when.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextInitShutdown } from 'app/helptext/system/init-shutdown';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';

@Component({
  selector: 'ix-init-shutdown-form',
  templateUrl: './init-shutdown-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    IxExplorerComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
    ExplorerCreateDatasetComponent,
  ],
})
export class InitShutdownFormComponent extends SidePanelForm implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private filesystemService = inject(FilesystemService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemCronWrite];
  protected readonly InputType = InputType;

  get isNew(): boolean {
    return !this.editingScript;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Init/Shutdown Script')
      : this.translate.instant('Edit Init/Shutdown Script');
  }

  protected isFormLoading = signal(false);

  private subscriptions: Subscription[] = [];

  readonly form = this.fb.group({
    comment: [''],
    type: [InitShutdownScriptType.Command],
    command: ['', [Validators.required]],
    script: ['', [Validators.required]],
    when: new FormControl(null as InitShutdownScriptWhen | null, [Validators.required]),
    enabled: [true],
    timeout: [10],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  readonly isCommand$ = this.form.select((values) => values.type === InitShutdownScriptType.Command);

  readonly typeOptions$ = of(mapToOptions(initShutdownScriptTypeLabels, this.translate));
  readonly whenOptions$ = of(mapToOptions(initShutdownScriptWhenLabels, this.translate));

  readonly tooltips = {
    type: helptextInitShutdown.typeTooltip,
    command: helptextInitShutdown.commandTooltip,
    script: helptextInitShutdown.scriptTooltip,
    when: helptextInitShutdown.whenTooltip,
    timeout: helptextInitShutdown.timeoutTooltip,
  };

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  private editingScript: InitShutdownScript | undefined;

  /**
   * Row to edit when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to
   * carry data). Absent for Add, and unused in the legacy SlideIn host (which
   * supplies the row via `slideInRef.getData()`).
   */
  readonly editScript = input<InitShutdownScript | undefined>(undefined);

  constructor() {
    super();
    this.destroyRef.onDestroy(() => {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
    });
  }

  ngOnInit(): void {
    this.editingScript = this.slideInRef
      ? this.slideInRef.getData() as InitShutdownScript | undefined
      : this.editScript();

    this.subscriptions.push(
      this.form.controls.command.enabledWhile(this.isCommand$),
      this.form.controls.script.disabledWhile(this.isCommand$),
    );

    if (this.editingScript) {
      this.form.patchValue(this.editingScript);
    }
  }

  protected onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading.set(true);
    let request$: Observable<unknown>;
    if (this.editingScript) {
      request$ = this.api.call('initshutdownscript.update', [
        this.editingScript.id,
        values,
      ]);
    } else {
      request$ = this.api.call('initshutdownscript.create', [values]);
    }

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Init/Shutdown Script created'));
        } else {
          this.snackbar.success(this.translate.instant('Init/Shutdown Script updated'));
        }
        this.isFormLoading.set(false);
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
