import {
  ChangeDetectionStrategy, Component, OnInit, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { OneDriveType } from 'app/enums/cloudsync-provider.enum';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncOneDriveDrive } from 'app/interfaces/cloudsync-credential.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-one-drive-provider-form',
  templateUrl: './one-drive-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OneDriveProviderFormComponent extends BaseProviderFormComponent implements OnInit {
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

  drives$: Observable<Option[]> = of([]);

  private drives: CloudsyncOneDriveDrive[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private dialogService: DialogService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.setupDriveSelect();
  }

  onOauthAuthenticated(attributes: Record<string, unknown>): void {
    this.form.patchValue(attributes);
    this.loadDrives();
  }

  getSubmitAttributes(): OauthProviderComponent['form']['value'] & this['form']['value'] {
    const { drives, ...oneDriveValues } = this.form.value;
    return {
      ...this.oauthComponent.form.value,
      ...oneDriveValues,
    };
  }

  setValues(values: CloudCredential['attributes']): void {
    this.form.patchValue(values);
    this.oauthComponent.form.patchValue(values);
  }

  private setupDriveSelect(): void {
    this.form.controls.drives.valueChanges.pipe(untilDestroyed(this)).subscribe((driveId) => {
      const drive = this.drives.find((drive) => drive.drive_id === driveId);
      if (!drive) {
        return;
      }

      this.form.patchValue({
        drive_type: drive.drive_type,
        drive_id: drive.drive_id,
      });
    });
  }

  private loadDrives(): void {
    this.ws.call('cloudsync.onedrive_list_drives', [{
      client_id: this.oauthComponent.form.value.client_id,
      client_secret: this.oauthComponent.form.value.client_secret,
      token: this.form.value.token,
    }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (drives) => {
          this.drives = drives;
          this.drives$ = of(
            drives.map((drive) => ({
              label: `${drive.drive_type} - ${drive.drive_id}`,
              value: drive.drive_id,
            })),
          );
        },
        error: (error) => {
          new EntityUtils().handleWsError(null, error, this.dialogService);
        },
      });
  }
}
