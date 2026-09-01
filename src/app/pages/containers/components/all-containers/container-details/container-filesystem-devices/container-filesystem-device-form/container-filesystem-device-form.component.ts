import {
  ChangeDetectionStrategy, Component, OnInit, inject, input,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import {
  Container,
  ContainerFilesystemDevice,
} from 'app/interfaces/container.interface';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import {
  IxFormHostForm,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  containerPathValidator,
  poolPathValidator,
} from 'app/pages/containers/utils/storage-device-validators';
import { FilesystemService } from 'app/services/filesystem.service';

@Component({
  selector: 'ix-container-filesystem-device-form',
  styleUrls: ['./container-filesystem-device-form.component.scss'],
  templateUrl: './container-filesystem-device-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    IxFormComponent,
    TnInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
  ],
})
export class ContainerFilesystemDeviceFormComponent extends IxFormHostForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private filesystem = inject(FilesystemService);

  /** The device being edited; absent when adding. Supplied by the `<tn-side-panel>` host. */
  readonly disk = input<ContainerFilesystemDevice | undefined>(undefined);
  /** The container the device belongs to. Supplied by the `<tn-side-panel>` host. */
  readonly container = input<Container | undefined>(undefined);

  /** Public because the `<tn-side-panel>` host reads it to gate its footer Save. */
  readonly requiredRoles = [Role.ContainerDeviceWrite];

  readonly fileProvider = this.filesystem.getFilesystemNodeProvider();

  protected form = this.formBuilder.nonNullable.group({
    source: ['', [Validators.required, poolPathValidator()]],
    target: ['', [Validators.required, containerPathValidator()]],
  });

  ngOnInit(): void {
    const disk = this.disk();

    if (disk) {
      this.form.patchValue({
        source: disk.source || '',
        target: disk.target || '',
      });
    }
  }

  protected handleSubmit = (): SubmitResult => {
    return {
      request$: this.prepareRequest(),
      successMessage: this.translate.instant('Filesystem Device was saved'),
    };
  };

  private prepareRequest(): Observable<unknown> {
    const formValue = this.form.getRawValue();

    const payload: ContainerFilesystemDevice = {
      dtype: ContainerDeviceType.Filesystem,
      source: formValue.source,
      target: formValue.target,
    };

    const existingDisk = this.disk();
    return existingDisk
      ? this.api.call('container.device.update', [existingDisk.id, {
          attributes: payload,
        }])
      : this.api.call('container.device.create', [{
          container: this.container().id,
          attributes: payload,
        }]);
  }
}
