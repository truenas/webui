import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnButtonToggleComponent, TnButtonToggleGroupComponent,
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
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
 * submits it. Both side-panel wrappers ({@link NamespaceFormComponent}, which saves through
 * `<ix-form>`, and `AddSubsystemNamespaceComponent`, which collects changes in memory for the Add
 * Subsystem wizard) build the group with `createNamespaceForm` and drive submission themselves.
 *
 * Deliberately renders no `<form>` element and applies no `[formGroup]`, so it composes inside
 * either host without nesting a second form. Its controls reach the host's group through the
 * `viewProviders` alias below — `formControlName` injects `ControlContainer` with `@Host()`, which
 * stops at this component's view boundary, so re-providing it is what lets the host's
 * `FormGroupDirective` (on the `<form>` element, or on `<ix-form>`) be found.
 */
@Component({
  selector: 'ix-base-namespace-form',
  templateUrl: './base-namespace-form.component.html',
  styleUrl: './base-namespace-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
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

  // Optional so a host that forgets `[formGroup]` entirely reaches the check in `ngOnInit` with an
  // actionable message, instead of dying on a raw NullInjectorError before we can say anything.
  private controlContainer = inject(ControlContainer, { optional: true });

  /**
   * The group to render into — the host's `ControlContainer`, i.e. the very `FormGroupDirective`
   * the `formControlName`s below bind through (see the `viewProviders` alias above). Taking it
   * from there rather than as an input makes "the group I branch on" and "the group my controls
   * write to" the same object by construction: there is no second binding for a host to get wrong.
   *
   * Resolved once in `ngOnInit` rather than read through a getter — the template reads it on every
   * change-detection pass, and the host directive's `[formGroup]` is only bound during the
   * enclosing template's update pass, so it is still null while this component is constructed.
   */
  protected form: NamespaceFormGroup;

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

  ngOnInit(): void {
    this.form = this.resolveHostForm();

    const namespace = this.namespace();

    if (namespace) {
      // Only the two fields this form models for an existing namespace. Spreading the whole record
      // would also seed `filesize`, which the New File branch then shows pre-filled with the old
      // file's size next to a blank filename — and `toNamespaceChanges` reads `getRawValue()`.
      this.form.patchValue({
        device_path: namespace.device_path,
        device_type: namespace.device_type === NvmeOfNamespaceType.Zvol
          ? FormNamespaceType.Zvol
          : FormNamespaceType.ExistingFile,
      });
    }

    syncNewFileControls(this.form, this.form.controls.device_type.value);

    // Subscribed AFTER the prefill above so patching `device_type` on an existing namespace
    // doesn't immediately clear the path it was just given.
    this.form.controls.device_type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.form.patchValue({ device_path: '' });
        syncNewFileControls(this.form, type);
      });
  }

  /**
   * Probes a known control rather than just null-checking: the cast would otherwise wave through
   * any host group, and the failure would surface much later as `undefined.enable()` inside
   * `syncNewFileControls` — nowhere near the wiring mistake that caused it.
   */
  private resolveHostForm(): NamespaceFormGroup {
    const control = this.controlContainer?.control as NamespaceFormGroup | null;

    if (!control?.controls?.device_type) {
      throw new Error(
        'ix-base-namespace-form must be rendered inside a host [formGroup] built with createNamespaceForm().',
      );
    }

    return control;
  }
}
