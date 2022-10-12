import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { AclType } from 'app/enums/acl-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { Acl } from 'app/interfaces/acl.interface';
import { GroupComboboxProvider } from 'app/modules/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import {
  SelectPresetModalComponent,
} from 'app/pages/datasets/modules/permissions/components/select-preset-modal/select-preset-modal.component';
import {
  StripAclModalComponent, StripAclModalData,
} from 'app/pages/datasets/modules/permissions/components/strip-acl-modal/strip-acl-modal.component';
import {
  SelectPresetModalConfig,
} from 'app/pages/datasets/modules/permissions/interfaces/select-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
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
    applyOwner: [false],
    applyGroup: [false],
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
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private userService: UserService,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.datasetPath = this.route.snapshot.params['datasetId'];
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

          this.ownerFormGroup.patchValue({
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
    this.matDialog.open(StripAclModalComponent, {
      data: {
        path: this.fullDatasetPath,
      } as StripAclModalData,
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((wasStripped) => {
        if (wasStripped) {
          return;
        }

        this.router.navigate(['/datasets', this.datasetPath]);
      });
  }

  onSavePressed(): void {
    this.store.saveAcl({
      recursive: !!(this.saveParameters.get('recursive').value),
      traverse: !!(this.saveParameters.get('recursive').value && this.saveParameters.get('traverse').value),
      owner: this.ownerFormGroup.get('owner').value,
      ownerGroup: this.ownerFormGroup.get('ownerGroup').value,
      applyOwner: this.ownerFormGroup.get('applyOwner').value,
      applyGroup: this.ownerFormGroup.get('applyGroup').value,
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
      this.store.loadHomeSharePreset();
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
