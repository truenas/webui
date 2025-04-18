import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { AdvancedConfigUpdate } from 'app/interfaces/advanced-config.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import {
  EditableSaveOnEnterDirective,
} from 'app/modules/forms/editable/editable-save-on-enter/editable-save-on-enter.directive';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-demo',
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.scss',
  standalone: true,
  imports: [
    FormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    ReactiveFormsModule,
    MatCard,
    EditableComponent,
    IxTextareaComponent,
    MatButton,
    TestDirective,
    FormActionsComponent,
    DetailsTableComponent,
    DetailsItemComponent,
    TranslateModule,
    IxCheckboxComponent,
    EditableSaveOnEnterDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoComponent {
  form = this.formBuilder.group({
    motd: [''],
    serialconsole: [false],
    serialport: ['', this.validators.withMessage(Validators.pattern(/tty.*/), 'Correct value is ttyS0')],
    boot_scrub: [5],
  });

  constructor(
    private api: ApiService,
    private validators: IxValidatorsService,
    private formBuilder: NonNullableFormBuilder,
    private formErrorHandler: FormErrorHandlerService,
    private loader: LoaderService,
    private snackbar: SnackbarService,
  ) {}

  save(): void {
    this.makeRequest(this.form.getRawValue());
  }

  saveWithError(): void {
    this.makeRequest({
      boot_scrub: ' 🍄 🍄 🍄 ' as unknown as number,
    });
  }

  makeExternalChange(): void {
    this.form.patchValue({
      motd: 'External change',
    });
  }

  private makeRequest(payload: AdvancedConfigUpdate): void {
    this.api.call('system.advanced.update', [payload]).pipe(
      this.loader.withLoader(),
      untilDestroyed(this),
    )
      .subscribe({
        next: () => {
          this.snackbar.success('Form saved');
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
