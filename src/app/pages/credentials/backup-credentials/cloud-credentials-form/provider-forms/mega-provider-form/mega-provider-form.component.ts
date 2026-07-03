import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  selector: 'ix-mega-provider-form',
  templateUrl: './mega-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
  ],
})
export class MegaProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  protected readonly InputType = InputType;

  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.group({
    user: ['', Validators.required],
    pass: ['', Validators.required],
  });

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }
}
