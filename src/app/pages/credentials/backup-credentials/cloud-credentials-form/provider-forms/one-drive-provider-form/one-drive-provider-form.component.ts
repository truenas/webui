import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { OneDriveType } from 'app/enums/cloudsync-provider.enum';
import {
  CloudSyncOneDriveDrive,
} from 'app/interfaces/cloudsync-credential.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-one-drive-provider-form',
  templateUrl: './one-drive-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxFieldsetComponent,
    IxInputComponent,
    TranslateModule,
    ReactiveFormsModule,
    IxSelectComponent,
    OauthProviderComponent,
  ],
})
export class OneDriveProviderFormComponent extends BaseProviderFormComponent implements OnInit, AfterViewInit {
  @ViewChild(OauthProviderComponent, { static: true }) oauthComponent: OauthProviderComponent;

  form = this.formBuilder.group({
    token: ['', Validators.required],
    drives: [''],
    drive_type: [OneDriveType.Personal],
    drive_id: ['', Validators.required],
  });

  readonly driveTypes$ = of([
    {
      label: 'PERSONAL',
      value: OneDriveType.Personal,
    },
    {
      label: 'BUSINESS',
      value: OneDriveType.Business,
    },
    {
      label: 'DOCUMENT_LIBRARY',
      value: OneDriveType.DocumentLibrary,
    },
  ]);

  drives$ = of<Option[]>([]);

  private drives: CloudSyncOneDriveDrive[] = [];

  constructor(
    private errorHandler: ErrorHandlerService,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setupDriveSelect();
  }

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      this.oauthComponent.form.patchValue(values);
    });
  }

  onOauthAuthenticated(attributes: Record<string, unknown>): void {
    this.form.patchValue(attributes);
    this.loadDrives();
  }

  override getSubmitAttributes(): OauthProviderComponent['form']['value'] & this['form']['value'] {
    const { drives, ...oneDriveValues } = this.form.value;
    return {
      ...this.oauthComponent?.form?.value,
      ...oneDriveValues,
    };
  }

  private setupDriveSelect(): void {
    this.form.controls.drives.valueChanges.pipe(untilDestroyed(this)).subscribe((driveId) => {
      const selectedDrive = this.drives.find((drive) => drive.drive_id === driveId);
      if (!selectedDrive) {
        return;
      }

      this.form.patchValue({
        drive_type: selectedDrive.drive_type,
        drive_id: selectedDrive.drive_id,
      });
    });
  }

  private loadDrives(): void {
    // This triggers loading indicator on the select.
    this.drives$ = of();

    this.api.call('cloudsync.onedrive_list_drives', [{
      client_id: this.oauthComponent.form.value.client_id,
      client_secret: this.oauthComponent.form.value.client_secret,
      token: this.form.value.token,
    }])
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((drives) => {
        this.drives = drives;
        this.drives$ = of(
          drives.map((drive) => {
            let label = [
              drive.name,
              drive.description,
            ].filter(Boolean).join(' - ');

            if (!label) {
              label = `${drive.drive_type} - ${drive.drive_id}`;
            }

            return { label, value: drive.drive_id };
          }),
        );

        this.cdr.detectChanges();
      });
  }
}
