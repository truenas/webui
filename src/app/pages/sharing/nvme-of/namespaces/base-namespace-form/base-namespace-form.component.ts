import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnButtonToggleComponent, TnButtonToggleGroupComponent,
  TnFormFieldComponent, TnFormFieldErrorMessages, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { datasetsRootNode, zvolsRootNode } from 'app/constants/basic-root-nodes.constant';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { Option } from 'app/interfaces/option.interface';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import {
  ExplorerCreateZvolComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-zvol/explorer-create-zvol.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { translateOptions } from 'app/modules/translate/translate.helper';
import {
  FormNamespaceType, NamespaceFormGroup, syncNewFileControls,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-form.utils';
import { FilesystemService } from 'app/services/filesystem.service';

/** Backs the unique `aria-labelledby` target below, so two mounted instances can't collide. */
let typeToggleLabelIdCounter = 0;

function nextTypeToggleLabelId(): string {
  typeToggleLabelIdCounter += 1;
  return `namespace-device-type-label-${typeToggleLabelIdCounter}`;
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

/**
 * Renders the namespace controls into a form group its host owns — it neither builds the group nor
 * submits it. Both side-panel wrappers (one saving through `<ix-form>`, one collecting changes in
 * memory for the Add Subsystem wizard) build the group with `createNamespaceForm` and drive
 * submission themselves.
 *
 * The group arrives as the {@link group} input and is bound to a `[formGroup]` in this component's
 * own template, rather than inherited from the host's `ControlContainer` through projection — which
 * would put an invisible contract on every host (re-provide the container here, and keep a
 * `FormGroupDirective` on the host element).
 *
 * Renders no `<form>` element of its own, so it composes inside either host without nesting a
 * second form.
 */
@Component({
  selector: 'ix-base-namespace-form',
  templateUrl: './base-namespace-form.component.html',
  styleUrl: './base-namespace-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxExplorerComponent,
    ReactiveFormsModule,
    TranslateModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnButtonToggleGroupComponent,
    TnButtonToggleComponent,
    ExplorerCreateDatasetComponent,
    ExplorerCreateZvolComponent,
  ],
})
export class BaseNamespaceFormComponent implements OnInit {
  private translate = inject(TranslateService);
  private filesystemService = inject(FilesystemService);
  private destroyRef = inject(DestroyRef);

  /**
   * The group to render into, built by the host with `createNamespaceForm`. It backs both the
   * template's `[formGroup]` and the `device_type` branching below, so "the group I branch on" and
   * "the group my controls write to" are the same object by construction.
   *
   * Expected to be STABLE for the component's lifetime — `ngOnInit` reads it once to wire the
   * branch sync, so swapping the instance later would leave that wiring on the old group (New File
   * controls never re-enabled). Both hosts build it as a field initializer and never reassign it.
   */
  readonly group = input.required<NamespaceFormGroup>();

  /** Existing namespace to prefill from; absent in create mode. */
  readonly namespace = input<NvmeOfNamespace>();

  protected readonly zvolsRootNode = [zvolsRootNode];
  protected readonly zvolProvider = this.filesystemService.getFilesystemNodeProvider({
    zvolsOnly: true,
  });

  protected readonly datasetsRootNode = [datasetsRootNode];
  protected readonly directoryProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  protected readonly fileProvider = this.filesystemService.getFilesystemNodeProvider();

  protected readonly FormNamespaceType = FormNamespaceType;
  protected readonly InputType = InputType;
  protected readonly typeToggleLabelId = nextTypeToggleLabelId();

  protected typeOptions = translateOptions(this.translate, typeOptions);

  /**
   * The size floor `syncNewFileControls` puts on `filesize` is a byte count, so the app-wide
   * resolver would render it as "Minimum value is 1" next to an input that speaks in MiB.
   */
  protected readonly filesizeErrorMessages: TnFormFieldErrorMessages = {
    min: this.translate.instant(T('File size must be greater than 0.')),
  };

  ngOnInit(): void {
    const form = this.group();
    const namespace = this.namespace();

    if (namespace) {
      // Only the two fields this form models for an existing namespace. Spreading the whole record
      // would also seed `filesize`, which the New File branch then shows pre-filled with the old
      // file's size next to a blank filename — and `toNamespaceChanges` reads `getRawValue()`.
      form.patchValue({
        device_path: namespace.device_path,
        device_type: namespace.device_type === NvmeOfNamespaceType.Zvol
          ? FormNamespaceType.Zvol
          : FormNamespaceType.ExistingFile,
      });
    }

    syncNewFileControls(form, form.controls.device_type.value);

    // Subscribed AFTER the prefill above so patching `device_type` on an existing namespace
    // doesn't immediately clear the path it was just given.
    form.controls.device_type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        form.patchValue({ device_path: '' });
        syncNewFileControls(form, type);
      });
  }
}
