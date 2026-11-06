import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { Validators, ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent, TnFilePickerComponent,
} from '@truenas/ui-components';
import {
  distinctUntilChanged, map, of, startWith, Subscription,
} from 'rxjs';
import { InitShutdownScriptType, initShutdownScriptTypeLabels } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen, initShutdownScriptWhenLabels } from 'app/enums/init-shutdown-script-when.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextInitShutdown } from 'app/helptext/system/init-shutdown';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { CreateDatasetActionPipe } from 'app/modules/forms/file-picker/create-dataset-action.pipe';
import { FilePickerSourcePipe } from 'app/modules/forms/file-picker/file-picker-source.pipe';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';

@Component({
  selector: 'ix-init-shutdown-form',
  templateUrl: './init-shutdown-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnFilePickerComponent,
    FilePickerSourcePipe,
    CreateDatasetActionPipe,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class InitShutdownFormComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemCronWrite];
  protected readonly InputType = InputType;

  get isNew(): boolean {
    return !this.editingScript;
  }

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

  readonly isCommand$ = this.form.valueChanges.pipe(
    startWith(null),
    map(() => this.form.controls.type.value === InitShutdownScriptType.Command),
    distinctUntilChanged(),
  );

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

  /** Row to edit, supplied by the `<tn-side-panel>` host. Absent for Add. */
  readonly editScript = input<InitShutdownScript | undefined>(undefined);

  constructor() {
    super();
    this.destroyRef.onDestroy(() => {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
    });
  }

  ngOnInit(): void {
    this.editingScript = this.editScript();

    // Wired before `<ix-form>` patches `editData` in its own (later) ngOnInit, so an edited
    // script's type immediately disables whichever of command/script it doesn't use.
    this.subscriptions.push(
      this.isCommand$.subscribe((isCommand) => {
        if (isCommand) {
          this.form.controls.command.enable();
          this.form.controls.script.disable();
        } else {
          this.form.controls.command.disable();
          this.form.controls.script.enable();
        }
      }),
    );
  }

  protected handleSubmit = (event: FormSubmitEvent): SubmitResult => {
    // `form.value`, not the event's `allValues`: `command` and `script` disable each other by type,
    // and only the enabled one belongs in the payload.
    const values = this.form.value as Required<typeof this.form.value>;
    const editingScript = this.editingScript;

    return {
      request$: editingScript
        ? this.api.call('initshutdownscript.update', [editingScript.id, values])
        : this.api.call('initshutdownscript.create', [values]),
      successMessage: event.isEdit
        ? this.translate.instant('Init/Shutdown Script updated')
        : this.translate.instant('Init/Shutdown Script created'),
    };
  };
}
