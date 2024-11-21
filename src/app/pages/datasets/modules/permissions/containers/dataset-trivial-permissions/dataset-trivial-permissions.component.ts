import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AclType } from 'app/enums/acl-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextPermissions } from 'app/helptext/storage/volumes/datasets/dataset-permissions';
import { FilesystemSetPermParams } from 'app/interfaces/filesystem-stat.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-trivial-permissions',
  templateUrl: './dataset-trivial-permissions.component.html',
  styleUrls: ['./dataset-trivial-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatTooltip,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxComboboxComponent,
    IxCheckboxComponent,
    IxPermissionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    RouterLink,
    TranslateModule,
    AsyncPipe,
    FakeProgressBarComponent,
  ],
})
export class DatasetTrivialPermissionsComponent implements OnInit {
  protected readonly requiredRoles = [Role.DatasetWrite];

  form = this.formBuilder.group({
    owner: [null as string, [this.validatorService.validateOnCondition(
      () => this.isToApplyUser,
      Validators.required,
    )]],
    applyUser: [false],
    ownerGroup: [null as string, [this.validatorService.validateOnCondition(
      () => this.isToApplyGroup,
      Validators.required,
    )]],
    mode: ['000'],
    applyGroup: [false],
    permission: [''],
    recursive: [false],
    traverse: [false],
  });

  protected readonly isLoading = signal(false);

  aclType: AclType;
  datasetPath: string;
  datasetId: string;

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly groupProvider = new GroupComboboxProvider(this.userService);

  readonly tooltips = {
    user: helptextPermissions.dataset_permissions_user_tooltip,
    applyUser: helptextPermissions.apply_user.tooltip,
    group: helptextPermissions.dataset_permissions_group_tooltip,
    applyGroup: helptextPermissions.apply_group.tooltip,
    mode: helptextPermissions.dataset_permissions_mode_tooltip,
    recursive: helptextPermissions.dataset_permissions_recursive_tooltip,
    traverse: helptextPermissions.dataset_permissions_traverse_tooltip,
  };

  readonly isRecursive$ = this.form.select((values) => values.recursive);

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private storageService: StorageService,
    private translate: TranslateService,
    private dialog: DialogService,
    private userService: UserService,
    private validatorService: IxValidatorsService,
    private snackbar: SnackbarService,
  ) {}

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
      .pipe(untilDestroyed(this))
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
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([datasets, stat]) => {
          this.isLoading.set(false);
          // TODO: DatasetAclType and AclType may represent the same thing
          this.aclType = datasets[0].acltype.value as unknown as AclType;
          const mode = stat.mode.toString(8).substring(2, 5);
          this.form.patchValue({
            mode,
            owner: stat.user,
            ownerGroup: stat.group,
          });
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.dialog.error(this.errorHandler.parseError(error));
        },
      });
  }

  private preparePayload(): FilesystemSetPermParams {
    const values = this.form.value;

    const update = {
      path: this.datasetPath,
      mode: values.mode,
      options: {
        stripacl: values.recursive,
        recursive: values.recursive,
        traverse: values.traverse,
      },
    } as FilesystemSetPermParams;

    if (values.applyUser) {
      update.user = values.owner;
    }

    if (values.applyGroup) {
      update.group = values.ownerGroup;
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
      untilDestroyed(this),
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
