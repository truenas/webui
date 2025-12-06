import { ChangeDetectionStrategy, Component, computed, input, OnChanges, OnInit, output, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { datasetsRootNode, zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { Role } from 'app/enums/role.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  IxButtonGroupComponent,
} from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import {
  ExplorerCreateZvolComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-zvol/explorer-create-zvol.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import { FilesystemService } from 'app/services/filesystem.service';

enum FormNamespaceType {
  Zvol = 'Zvol',
  NewFile = 'NewFile',
  ExistingFile = 'ExistingFile',
}

const typeOptions: Option[] = [
  {
    label: 'Zvol',
    value: FormNamespaceType.Zvol,
  },
  {
    label: T('Existing File'),
    value: FormNamespaceType.ExistingFile,
  },
  {
    label: T('New File'),
    value: FormNamespaceType.NewFile,
  },
];

@UntilDestroy()
@Component({
  selector: 'ix-base-namespace-form',
  templateUrl: './base-namespace-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxExplorerComponent,
    ReactiveFormsModule,
    TranslateModule,
    MatButton,
    TestDirective,
    FormActionsComponent,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    IxFieldsetComponent,
    IxButtonGroupComponent,
    IxInputComponent,
    ExplorerCreateZvolComponent,
    RequiresRolesDirective,
  ],
})
export class BaseNamespaceFormComponent implements OnInit, OnChanges {
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  protected formatter = inject(IxFormatterService);
  private formErrorHandler = inject(FormErrorHandlerService);

  namespace = input<NvmeOfNamespace>();
  error = input<unknown>(null);

  submitted = output<NamespaceChanges>();

  protected readonly zvolsRootNode = [zvolsRootNode];
  protected readonly zvolProvider = this.filesystemService.getFilesystemNodeProvider({
    zvolsOnly: true,
  });

  protected readonly datasetsRootNode = [datasetsRootNode];
  protected readonly directoryProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  protected readonly fileProvider = this.filesystemService.getFilesystemNodeProvider();

  protected isNew = computed(() => !this.namespace());

  protected form = this.formBuilder.group({
    device_type: [FormNamespaceType.Zvol],
    device_path: ['', Validators.required],
    filename: [''],
    filesize: [null as number | null],
  });

  protected readonly FormNamespaceType = FormNamespaceType;

  protected typeOptions$ = of(translateOptions(this.translate, typeOptions));

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  constructor() {
    this.clearPathOnTypeChanges();
  }

  ngOnChanges(changes: IxSimpleChanges<BaseNamespaceFormComponent>): void {
    if (changes.error && changes.error.currentValue) {
      this.formErrorHandler.handleValidationErrors(this.error(), this.form);
    }
  }

  ngOnInit(): void {
    if (this.namespace()) {
      this.form.patchValue({
        ...this.namespace(),
        device_type: this.namespace().device_type === NvmeOfNamespaceType.Zvol
          ? FormNamespaceType.Zvol
          : FormNamespaceType.ExistingFile,
      });
    }
  }

  protected onSubmit(): void {
    const value = this.form.value;
    let path = '';

    switch (value.device_type) {
      case FormNamespaceType.Zvol:
        path = value.device_path.replace('/dev/zvol/', 'zvol/');
        break;
      case FormNamespaceType.NewFile: {
        const directory = value.device_path.replace(/\/$/, '');
        path = `${directory}/${value.filename}`;
        break;
      }
      default:
        path = value.device_path;
        break;
    }

    this.submitted.emit({
      device_path: path,
      device_type: value.device_type === FormNamespaceType.Zvol ? NvmeOfNamespaceType.Zvol : NvmeOfNamespaceType.File,
      filesize: value.device_type === FormNamespaceType.NewFile ? value.filesize : undefined,
    });
  }

  private clearPathOnTypeChanges(): void {
    this.form.controls.device_type.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.form.patchValue({ device_path: '' });
      });
  }
}
