import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { AclType, DefaultAclType } from 'app/enums/acl-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { Acl } from 'app/interfaces/acl.interface';
import { GroupComboboxProvider } from 'app/modules/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { SelectPresetModalComponent } from 'app/pages/storage/volumes/permissions/components/select-preset-modal/select-preset-modal.component';
import { SelectPresetModalConfig } from 'app/pages/storage/volumes/permissions/interfaces/select-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/storage/volumes/permissions/stores/dataset-acl-editor.store';
import { DialogService, UserService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: 'dataset-acl-editor.component.html',
  styleUrls: ['./dataset-acl-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetAclEditorComponent implements OnInit {
  datasetPath: string;
  fullDatasetPath: string;
  isLoading: boolean;
  acl: Acl;
  selectedAceIndex: number;
  acesWithError: number[];

  saveParameters = this.formBuilder.group({
    recursive: [false],
    traverse: [false],
  });

  ownerFormGroup = this.formBuilder.group({
    owner: ['', Validators.required],
    ownerGroup: ['', Validators.required],
  });

  get isNfsAcl(): boolean {
    return this.acl.acltype === AclType.Nfs4;
  }

  get isHomeShare(): boolean {
    return Boolean(this.route.snapshot.queryParams['homeShare']);
  }

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly groupProvider = new GroupComboboxProvider(this.userService);
  readonly helptext = helptext;

  constructor(
    private store: DatasetAclEditorStore,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private userService: UserService,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.datasetPath = this.route.snapshot.params['path'];
    this.fullDatasetPath = `/mnt/${this.datasetPath}`;
    this.store.loadAcl(this.fullDatasetPath);

    this.store.state$
      .pipe(untilDestroyed(this))
      .subscribe((state) => {
        const isFirstLoad = !this.acl && state.acl;
        this.isLoading = state.isLoading;
        this.acl = state.acl;
        this.selectedAceIndex = state.selectedAceIndex;
        this.acesWithError = state.acesWithError;

        if (isFirstLoad) {
          this.onFirstLoad();

          this.ownerFormGroup.setValue({
            owner: state.stat.user,
            ownerGroup: state.stat.group,
          });
        }

        this.cdr.markForCheck();
      });

    this.saveParameters.get('recursive').valueChanges.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.dialogService.confirm({
        title: helptext.dataset_acl_recursive_dialog_warning,
        message: helptext.dataset_acl_recursive_dialog_warning_message,
      }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
        if (confirmed) {
          return;
        }

        this.saveParameters.patchValue({ recursive: false });
      });
    });
  }

  onAddItemPressed(): void {
    this.store.addAce();
  }

  onStripAclPressed(): void {
    this.store.stripAcl();
  }

  onSavePressed(): void {
    this.store.saveAcl({
      recursive: !!(this.saveParameters.get('recursive').value),
      traverse: !!(this.saveParameters.get('recursive').value && this.saveParameters.get('traverse').value),
      owner: this.ownerFormGroup.get('owner').value,
      ownerGroup: this.ownerFormGroup.get('ownerGroup').value,
    });
  }

  onUsePresetPressed(): void {
    this.matDialog.open(SelectPresetModalComponent, {
      data: {
        allowCustom: false,
        datasetPath: this.fullDatasetPath,
      } as SelectPresetModalConfig,
    });
  }

  private onFirstLoad(): void {
    if (this.isHomeShare) {
      this.store.usePreset(this.isNfsAcl ? DefaultAclType.Nfs4Home : DefaultAclType.PosixHome);
    } else {
      this.showPresetModalIfNeeded();
    }
  }

  /**
   * Prompt for empty acl, user navigating from trivial form
   */
  private showPresetModalIfNeeded(): void {
    const needModal = !this.acl.acl.length || this.acl.trivial;

    if (!needModal) {
      return;
    }

    this.matDialog.open(SelectPresetModalComponent, {
      data: {
        allowCustom: true,
        datasetPath: this.fullDatasetPath,
      } as SelectPresetModalConfig,
    });
  }
}
