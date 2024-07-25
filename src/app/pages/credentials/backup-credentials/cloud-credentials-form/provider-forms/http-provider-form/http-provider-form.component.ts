import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  selector: 'ix-http-provider-form',
  templateUrl: './http-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  form = this.formBuilder.group({
    url: ['', Validators.required],
  });

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }
  constructor(
    public formatter: IxFormatterService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }
}
