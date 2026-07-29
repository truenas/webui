import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCheckboxComponent,
  TnFormFieldComponent, TnFormSectionComponent, TnTestIdDirective, TnTooltipDirective,
} from '@truenas/ui-components';
import { forkJoin } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AclType } from 'app/enums/acl-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextPermissions } from 'app/helptext/storage/volumes/datasets/dataset-permissions';
import { FilesystemSetPermParams } from 'app/interfaces/filesystem-stat.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxGroupComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-group-combobox/ix-group-combobox.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { StorageService } from 'app/services/storage.service';

interface AccessMode {
  ownerRead: boolean;
  ownerWrite: boolean;
  ownerExec: boolean;
  groupRead: boolean;
  groupWrite: boolean;
  groupExec: boolean;
  otherRead: boolean;
  otherWrite: boolean;
  otherExec: boolean;
}

@Component({
  selector: 'ix-dataset-trivial-permissions',
  templateUrl: './dataset-trivial-permissions.component.html',
  styleUrls: ['./dataset-trivial-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnTooltipDirective,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnTestIdDirective,
    IxUserComboboxComponent,
    IxGroupComboboxComponent,
    TnCheckboxComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    RouterLink,
    TranslateModule,
    FakeProgressBarComponent,
  ],
})
export class DatasetTrivialPermissionsComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private storageService = inject(StorageService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private validatorService = inject(IxValidatorsService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DatasetWrite];

  form = this.formBuilder.group({
    owner: new FormControl(null as string | null, [this.validatorService.validateOnCondition(
      () => this.isToApplyUser,
      Validators.required,
    )]),
    applyUser: [false],
    ownerGroup: new FormControl(null as string | null, [this.validatorService.validateOnCondition(
      () => this.isToApplyGroup,
      Validators.required,
    )]),
    accessMode: this.formBuilder.group({
      ownerRead: [false],
      ownerWrite: [false],
      ownerExec: [false],
      groupRead: [false],
      groupWrite: [false],
      groupExec: [false],
      otherRead: [false],
      otherWrite: [false],
      otherExec: [false],
    }),
    applyGroup: [false],
    recursive: [false],
    traverse: [false],
  });

  // `prefix`/`suffix` build the form control name; `testId` keeps the resolved
  // data-test stable (owner→user, Exec→execute) regardless of the control name.
  protected readonly accessModeRows = [
    { label: 'User', prefix: 'owner', testId: 'user' },
    { label: 'Group', prefix: 'group', testId: 'group' },
    { label: 'Other', prefix: 'other', testId: 'other' },
  ];

  protected readonly accessModeColumns = [
    { label: 'Read', suffix: 'Read', testId: 'read' },
    { label: 'Write', suffix: 'Write', testId: 'write' },
    { label: 'Execute', suffix: 'Exec', testId: 'execute' },
  ];

  protected readonly isLoading = signal(false);

  aclType: AclType;
  datasetPath: string;
  datasetId: string;

  readonly tooltips = {
    user: helptextPermissions.userTooltip,
    applyUser: helptextPermissions.applyUser.tooltip,
    group: helptextPermissions.groupLabel,
    applyGroup: helptextPermissions.applyGroup.tooltip,
    mode: helptextPermissions.modeTooltip,
    recursive: helptextPermissions.recursiveTooltip,
    traverse: helptextPermissions.traverseTooltip,
  };

  protected readonly isRecursive = toSignal(this.form.select((values) => values.recursive));

  get canSetAcl(): boolean {
    return this.aclType !== AclType.Off;
  }

  get isToApplyUser(): boolean {
    return this.form?.value?.applyUser;
  }

  get isToApplyGroup(): boolean {
    return this.form?.value?.applyGroup;
  }

  ngOnInit(): void {
    this.datasetId = this.activatedRoute.snapshot.params['datasetId'] as string;
    this.datasetPath = '/mnt/' + this.datasetId;

    this.loadPermissionsInformation();
    this.setRecursiveWarning();
  }

  onSetAclPressed(): void {
    this.router.navigate(['/datasets', 'acl', 'edit'], {
      queryParams: {
        path: this.datasetPath,
      },
    });
  }

  onSubmit(): void {
    const payload = this.preparePayload();

    this.dialog.jobDialog(
      this.api.job('filesystem.setperm', [payload]),
      { title: this.translate.instant('Saving Permissions') },
    )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Permissions saved.'));
          this.router.navigate(['/datasets', this.datasetId]);
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  private loadPermissionsInformation(): void {
    this.isLoading.set(true);
    forkJoin([
      this.api.call('pool.dataset.query', [[['id', '=', this.datasetId]]]),
      this.storageService.filesystemStat(this.datasetPath),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([datasets, stat]) => {
          this.isLoading.set(false);
          // TODO: DatasetAclType and AclType may represent the same thing
          this.aclType = datasets[0].acltype.value as unknown as AclType;
          const mode = stat.mode.toString(8).substring(2, 5);
          this.form.patchValue({
            accessMode: this.modeToAccessMode(mode),
            owner: stat.user,
            ownerGroup: stat.group,
          });
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private modeToAccessMode(mode: string): AccessMode {
    const toBits = (digit: string): [boolean, boolean, boolean] => {
      const value = parseInt(digit, 10) || 0;
      return [!!(value & 4), !!(value & 2), !!(value & 1)];
    };
    const [ownerRead, ownerWrite, ownerExec] = toBits(mode[0]);
    const [groupRead, groupWrite, groupExec] = toBits(mode[1]);
    const [otherRead, otherWrite, otherExec] = toBits(mode[2]);
    return {
      ownerRead, ownerWrite, ownerExec, groupRead, groupWrite, groupExec, otherRead, otherWrite, otherExec,
    };
  }

  private accessModeToMode(access: AccessMode): string {
    const toDigit = (read: boolean, write: boolean, exec: boolean): number => {
      return (read ? 4 : 0) + (write ? 2 : 0) + (exec ? 1 : 0);
    };
    return [
      toDigit(access.ownerRead, access.ownerWrite, access.ownerExec),
      toDigit(access.groupRead, access.groupWrite, access.groupExec),
      toDigit(access.otherRead, access.otherWrite, access.otherExec),
    ].join('');
  }

  private preparePayload(): FilesystemSetPermParams {
    const values = this.form.value;

    const update = {
      path: this.datasetPath,
      mode: this.accessModeToMode(this.form.controls.accessMode.getRawValue()),
      options: {
        stripacl: values.recursive,
        recursive: values.recursive,
        traverse: values.traverse,
      },
    } as FilesystemSetPermParams;

    if (values.applyUser) {
      update.user = values.owner || undefined;
    }

    if (values.applyGroup) {
      update.group = values.ownerGroup || undefined;
    }

    return update;
  }

  private setRecursiveWarning(): void {
    this.form.controls.recursive.valueChanges.pipe(
      filter(Boolean),
      switchMap(() => {
        return this.dialog.confirm({
          title: this.translate.instant('Warning'),
          message: this.translate.instant('Setting permissions recursively will affect this directory and any others below it. This might make data inaccessible.'),
        });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((confirmed) => {
      if (confirmed) {
        return;
      }

      this.form.patchValue({
        recursive: false,
      });
    });
  }
}
