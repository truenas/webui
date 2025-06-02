import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { datasetsRootNode, zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  IxButtonGroupComponent,
} from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/namespace-form/namespace-changes.interface';
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
  selector: 'ix-namespace-dialog',
  templateUrl: './namespace-form.component.html',
  styleUrl: './namespace-form.component.scss',
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
  ],
})
export class NamespaceFormComponent implements OnInit {
  protected readonly zvolsRootNode = [zvolsRootNode];
  protected readonly zvolProvider = this.filesystemService.getFilesystemNodeProvider({
    zvolsOnly: true,
  });

  protected readonly datasetsRootNode = [datasetsRootNode];
  protected readonly directoryProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  protected readonly fileProvider = this.filesystemService.getFilesystemNodeProvider();

  private existingNamespace = signal<NvmeOfNamespace | null>(null);

  protected isNew = computed(() => !this.existingNamespace());

  protected form = this.formBuilder.group({
    device_type: [FormNamespaceType.Zvol],
    device_path: [''],
    filename: [''],
    filesize: [null as number | null],
  });

  protected readonly FormNamespaceType = FormNamespaceType;

  protected typeOptions$ = of(translateOptions(this.translate, typeOptions));

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private translate: TranslateService,
    private filesystemService: FilesystemService,
    public slideInRef: SlideInRef<NvmeOfNamespace | undefined, NamespaceChanges>,
    protected formatter: IxFormatterService,
  ) {
    this.clearPathOnTypeChanges();
  }

  ngOnInit(): void {
    const existingNamespace = this.slideInRef.getData();

    if (existingNamespace) {
      this.existingNamespace.set(existingNamespace);

      this.form.patchValue({
        ...existingNamespace,
        device_type: existingNamespace.device_type === NvmeOfNamespaceType.Zvol
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
      case FormNamespaceType.NewFile:
        path = `${value.device_path}/${value.filename}`;
        break;
      default:
        path = value.device_path;
        break;
    }

    this.slideInRef.close({
      response: {
        device_path: path,
        device_type: value.device_type === FormNamespaceType.Zvol ? NvmeOfNamespaceType.Zvol : NvmeOfNamespaceType.File,
        filesize: value.device_type === FormNamespaceType.NewFile ? value.filesize : undefined,
      },
      error: null,
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
