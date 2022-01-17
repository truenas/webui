import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { AclType, DefaultAclType } from 'app/enums/acl-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { Acl } from 'app/interfaces/acl.interface';
import { FormCheckboxConfig, FormComboboxConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { SelectPresetModalComponent } from 'app/pages/storage/volumes/permissions/components/select-preset-modal/select-preset-modal.component';
import { SelectPresetModalConfig } from 'app/pages/storage/volumes/permissions/interfaces/select-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/storage/volumes/permissions/stores/dataset-acl-editor.store';
import { getFormUserGroupLoaders } from 'app/pages/storage/volumes/permissions/utils/get-form-user-group-loaders.utils';
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

  saveParameters = new FormGroup({
    recursive: new FormControl(),
    traverse: new FormControl(),
  });

  ownerFormGroup = new FormGroup({
    owner: new FormControl(),
    ownerGroup: new FormControl(),
  });

  readonly recursiveFieldConfig: FormCheckboxConfig = {
    type: 'checkbox',
    name: 'recursive',
    placeholder: helptext.dataset_acl_recursive_placeholder,
    tooltip: helptext.dataset_acl_recursive_tooltip,
    value: false,
  };
  readonly traverseFieldConfig: FormCheckboxConfig = {
    type: 'checkbox',
    name: 'traverse',
    placeholder: helptext.dataset_acl_traverse_placeholder,
    tooltip: helptext.dataset_acl_traverse_tooltip,
    value: false,
  };

  readonly ownerFieldConfig: FormComboboxConfig = {
    type: 'combobox',
    name: 'owner',
    options: [],
    inlineFields: true,
    searchOptions: [],
    parent: this,
    updateLocal: true,
  };

  readonly ownerGroupFieldConfig: FormComboboxConfig = {
    type: 'combobox',
    name: 'ownerGroup',
    options: [],
    searchOptions: [],
    parent: this,
    updateLocal: true,
  };

  get isNfsAcl(): boolean {
    return this.acl.acltype === AclType.Nfs4;
  }

  get isHomeShare(): boolean {
    return Boolean(this.route.snapshot.queryParams['homeShare']);
  }

  constructor(
    private store: DatasetAclEditorStore,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private userService: UserService,
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

    const userGroupLoaders = getFormUserGroupLoaders(this.userService);
    this.ownerFieldConfig.updater = userGroupLoaders.updateUserSearchOptions;
    this.ownerFieldConfig.loadMoreOptions = userGroupLoaders.loadMoreUserOptions;
    this.ownerGroupFieldConfig.updater = userGroupLoaders.updateGroupSearchOptions;
    this.ownerGroupFieldConfig.loadMoreOptions = userGroupLoaders.loadMoreGroupOptions;

    this.userService.userQueryDsCache().pipe(untilDestroyed(this)).subscribe((users) => {
      const userOptions = users.map((user) => ({ label: user.username, value: user.username }));
      this.ownerFieldConfig.options = userOptions;
    });

    this.userService.groupQueryDsCache().pipe(untilDestroyed(this)).subscribe((groups) => {
      const groupOptions = groups.map((group) => ({ label: group.group, value: group.group }));
      this.ownerGroupFieldConfig.options = groupOptions;
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
