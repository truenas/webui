import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, Subscription } from 'rxjs';
import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import helptext from 'app/helptext/system/init-shutdown';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  templateUrl: './init-shutdown-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitShutdownFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingScript;
  }
  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Init/Shutdown Script')
      : this.translate.instant('Edit Init/Shutdown Script');
  }

  isFormLoading = false;

  subscriptions: Subscription[] = [];

  readonly form = this.fb.group({
    comment: [''],
    type: [InitShutdownScriptType.Command],
    command: ['', [Validators.required]],
    script: ['', [Validators.required]],
    when: [null as InitShutdownScriptWhen, [Validators.required]],
    enabled: [true],
    timeout: [10],
  });

  readonly isCommand$ = this.form.select((values) => values.type === InitShutdownScriptType.Command);

  readonly typeOptions$ = of([
    { label: this.translate.instant('Command'), value: InitShutdownScriptType.Command },
    { label: this.translate.instant('Script'), value: InitShutdownScriptType.Script },
  ]);

  readonly whenOptions$ = of([
    { label: this.translate.instant('Pre Init'), value: InitShutdownScriptWhen.PreInit },
    { label: this.translate.instant('Post Init'), value: InitShutdownScriptWhen.PostInit },
    { label: this.translate.instant('Shutdown'), value: InitShutdownScriptWhen.Shutdown },
  ]);

  readonly tooltips = {
    comment: helptext.ini_description_tooltip,
    type: helptext.ini_type_tooltip,
    command: helptext.ini_command_tooltip,
    script: helptext.ini_script_tooltip,
    when: helptext.ini_when_tooltip,
    enabled: helptext.ini_enabled_tooltip,
    timeout: helptext.ini_timeout_tooltip,
  };

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private filesystemService: FilesystemService,
    private slideInRef: IxSlideInRef<InitShutdownFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingScript: InitShutdownScript,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.form.controls.command.enabledWhile(this.isCommand$),
      this.form.controls.script.disabledWhile(this.isCommand$),
    );

    if (this.editingScript) {
      this.setScriptForEdit();
    }
  }

  setScriptForEdit(): void {
    this.form.patchValue(this.editingScript);
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('initshutdownscript.create', [values]);
    } else {
      request$ = this.ws.call('initshutdownscript.update', [
        this.editingScript.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Init/Shutdown Script created'));
        } else {
          this.snackbar.success(this.translate.instant('Init/Shutdown Script updated'));
        }
        this.isFormLoading = false;
        this.slideInRef.close(true);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
