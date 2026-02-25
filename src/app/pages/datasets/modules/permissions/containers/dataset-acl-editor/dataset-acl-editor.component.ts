import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton, MatAnchor } from '@angular/material/button';
import { MatCard, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AclType } from 'app/enums/acl-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { Acl } from 'app/interfaces/acl.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxGroupComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-group-combobox/ix-group-combobox.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AclEditorListComponent } from 'app/pages/datasets/modules/permissions/components/acl-editor-list/acl-editor-list.component';
import { EditNfsAceComponent } from 'app/pages/datasets/modules/permissions/components/edit-nfs-ace/edit-nfs-ace.component';
import { EditPosixAceComponent } from 'app/pages/datasets/modules/permissions/components/edit-posix-ace/edit-posix-ace.component';
import {
  SaveAsPresetModalComponent,
} from 'app/pages/datasets/modules/permissions/components/save-as-preset-modal/save-as-preset-modal.component';
import {
  SelectPresetModalComponent,
} from 'app/pages/datasets/modules/permissions/components/select-preset-modal/select-preset-modal.component';
import {
  StripAclModalComponent, StripAclModalData,
} from 'app/pages/datasets/modules/permissions/components/strip-acl-modal/strip-acl-modal.component';
import { SaveAsPresetModalConfig } from 'app/pages/datasets/modules/permissions/interfaces/save-as-preset-modal-config.interface';
import {
  SelectPresetModalConfig,
} from 'app/pages/datasets/modules/permissions/interfaces/select-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { AclEditorSaveControlsComponent } from './acl-editor-save-controls/acl-editor-save-controls.component';

@Component({
  selector: 'ix-dataset-acl-editor',
  templateUrl: 'dataset-acl-editor.component.html',
  styleUrls: ['./dataset-acl-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatProgressSpinner,
    MatCardHeader,
    MatCardTitle,
    ReactiveFormsModule,
    IxUserComboboxComponent,
    IxGroupComboboxComponent,
    IxCheckboxComponent,
    AclEditorListComponent,
    MatButton,
    TestDirective,
    TnIconComponent,
    AclEditorSaveControlsComponent,
    MatAnchor,
    RouterLink,
    RequiresRolesDirective,
    EditNfsAceComponent,
    EditPosixAceComponent,
    TranslateModule,
    CastPipe,
  ],
})
export class DatasetAclEditorComponent implements OnInit {
  private store = inject(DatasetAclEditorStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private matDialog = inject(MatDialog);
  private formBuilder = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);

  datasetPath: string;
  isLoading: boolean;
  acl: Acl | null;
  selectedAceIndex: number;
  acesWithError: number[];

  ownerFormGroup = this.formBuilder.group({
    owner: ['', Validators.required],
    ownerGroup: ['', Validators.required],
    applyOwner: [false],
    applyGroup: [false],
  });

  get isNfsAcl(): boolean {
    return this.acl?.acltype === AclType.Nfs4;
  }

  get isHomeShare(): boolean {
    return Boolean(this.route.snapshot.queryParams['homeShare']);
  }

  readonly helptext = helptextAcl;

  protected readonly Role = Role;

  ngOnInit(): void {
    this.datasetPath = this.route.snapshot.queryParamMap.get('path');
    this.store.loadAcl(this.datasetPath);

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.store.setState((state) => ({ ...state, returnUrl }));

    this.store.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (this.acl === null && state.acl === null) {
          this.router.navigate(['/sharing']);
          return;
        }

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
  }

  onAddItemPressed(): void {
    this.store.addAce();
  }

  onStripAclPressed(): void {
    this.matDialog.open(StripAclModalComponent, {
      data: {
        path: this.datasetPath,
      } as StripAclModalData,
    })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((wasStripped) => {
        if (!wasStripped) {
          return;
        }

        const returnUrl = this.store.state().returnUrl;
        const returnRoute = returnUrl ? [returnUrl] : ['/datasets', this.datasetPath];
        this.router.navigate(returnRoute);
      });
  }

  onSavePreset(): void {
    this.matDialog.open(SaveAsPresetModalComponent, {
      data: {
        aclType: this.acl.acltype,
        datasetPath: this.datasetPath,
      } as SaveAsPresetModalConfig,
    });
  }

  onUsePresetPressed(): void {
    this.matDialog.open(SelectPresetModalComponent, {
      data: {
        allowCustom: false,
        datasetPath: this.datasetPath,
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
        datasetPath: this.datasetPath,
      } as SelectPresetModalConfig,
    });
  }

  getDatasetPath(): string {
    return this.datasetPath.replace(/(^\/mnt\/)/gi, '');
  }
}
