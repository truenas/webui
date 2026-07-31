import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, isDevMode } from '@angular/core';
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

  /**
   * The host's `ControlContainer` — the same `FormGroupDirective` the `formControlName`s below
   * bind through. Read only to assert it agrees with {@link form}; see {@link assertSameGroup}.
   */
  private hostControlContainer = inject(ControlContainer, { optional: true });

  /**
   * The group to render into — built by the host with `createNamespaceForm`.
   *
   * Must be the SAME instance the host's `FormGroupDirective` carries: the `formControlName`s
   * below bind through that directive (see the `viewProviders` alias above), while this input is
   * what the template's `@switch` and this class's enable/disable read. Kept as an explicit input
   * rather than `inject(ControlContainer).control` because both hosts must own the group anyway —
   * `<ix-form>` takes it as a required input — so an implicit source would hide, not remove, the
   * coupling. {@link assertSameGroup} makes a mismatch loud in dev instead of silent.
   */
  readonly form = input.required<NamespaceFormGroup>();

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
    this.assertSameGroup();

    const namespace = this.namespace();

    if (namespace) {
      this.form().patchValue({
        ...namespace,
        device_type: namespace.device_type === NvmeOfNamespaceType.Zvol
          ? FormNamespaceType.Zvol
          : FormNamespaceType.ExistingFile,
      });
    }

    syncNewFileControls(this.form(), this.form().controls.device_type.value);

    // Subscribed AFTER the prefill above so patching `device_type` on an existing namespace
    // doesn't immediately clear the path it was just given.
    this.form().controls.device_type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        this.form().patchValue({ device_path: '' });
        syncNewFileControls(this.form(), type);
      });
  }

  /**
   * Fails loudly in dev when `[form]` and the host's `[formGroup]` are different instances.
   * Left silent otherwise the symptom is baffling: controls write into one group while the
   * `@switch` branches on another, so picking a device type appears to do nothing.
   */
  private assertSameGroup(): void {
    if (!isDevMode() || !this.hostControlContainer) {
      return;
    }

    if (this.hostControlContainer.control !== this.form()) {
      console.error(
        'ix-base-namespace-form: [form] is not the same FormGroup as the host\'s [formGroup]. '
        + 'Controls will render into one group while the device-type switch reads another. '
        + 'Pass the instance built by createNamespaceForm() to both.',
      );
    }
  }
}
