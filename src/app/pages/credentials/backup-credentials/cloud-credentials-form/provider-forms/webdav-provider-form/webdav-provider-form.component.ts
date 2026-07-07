import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent, InputType,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { SomeProviderAttributes } from 'app/interfaces/cloudsync-credential.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  selector: 'ix-webdav-provider-form',
  templateUrl: './webdav-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    AsyncPipe,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
  ],
})
export class WebdavProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  protected readonly InputType = InputType;

  formatter = inject(IxFormatterService);
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.group({
    url: ['', Validators.required],
    vendor: ['NEXTCLOUD'],
    user: ['', Validators.required],
    pass: ['', Validators.required],
  });

  vendors$ = of([
    {
      label: 'NEXTCLOUD',
      value: 'NEXTCLOUD',
    },
    {
      label: 'OWNCLOUD',
      value: 'OWNCLOUD',
    },
    {
      label: 'SHAREPOINT',
      value: 'SHAREPOINT',
    },
    {
      label: this.translate.instant('OTHER'),
      value: 'OTHER',
    },
  ]);

  override getSubmitAttributes(): SomeProviderAttributes {
    const attributes = super.getSubmitAttributes();
    const url = attributes.url;
    return {
      ...attributes,
      ...(typeof url === 'string' ? { url: this.formatter.stringAsUrlParsing(url) } : {}),
    };
  }

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }
}
