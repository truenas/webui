import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { datasetsRootNode, zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { Role } from 'app/enums/role.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { Option } from 'app/interfaces/option.interface';
import {
  IxButtonGroupComponent,
} from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import {
  ExplorerCreateZvolComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-zvol/explorer-create-zvol.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
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

@Component({
  selector: 'ix-base-namespace-form',
  templateUrl: './base-namespace-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxExplorerComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxFieldsetComponent,
    IxButtonGroupComponent,
    IxInputComponent,
    IxFormComponent,
    ExplorerCreateZvolComponent,
  ],
})
export class BaseNamespaceFormComponent implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  protected formatter = inject(IxFormatterService);
  private destroyRef = inject(DestroyRef);

  namespace = input<NvmeOfNamespace>();

  /**
   * Submit callback supplied by each parent. The base computes the
   * `NamespaceChanges` payload from the form, then hands it off — parents
   * decide between a synthetic close (subsystem-wizard flow) or an API call
   * (subsystem-details flow). Required so the wrapper's submitHandler can
   * never be wired up to a no-op by accident.
   */
  submitHandler = input.required<(changes: NamespaceChanges) => SubmitResult>();

  /**
   * Passthrough to `<ix-form>`. Parents that close with a payload (no API
   * call, no "Saved!" semantics) set this to true so the wrapper skips the
   * default success snackbar.
   */
  suppressSuccessSnackbar = input(false);

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

  protected handleSubmit = (): SubmitResult => {
    return this.submitHandler()(this.computeChanges());
  };

  private computeChanges(): NamespaceChanges {
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

    return {
      device_path: path,
      device_type: value.device_type === FormNamespaceType.Zvol ? NvmeOfNamespaceType.Zvol : NvmeOfNamespaceType.File,
      filesize: value.device_type === FormNamespaceType.NewFile ? value.filesize : undefined,
    };
  }

  private clearPathOnTypeChanges(): void {
    this.form.controls.device_type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.patchValue({ device_path: '' });
      });
  }
}
