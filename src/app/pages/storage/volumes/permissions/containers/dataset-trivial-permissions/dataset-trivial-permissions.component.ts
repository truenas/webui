import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { AclType } from 'app/enums/acl-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-permissions';
import { DatasetPermissionsUpdate } from 'app/interfaces/dataset-permissions.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { GroupComboboxProvider } from 'app/modules/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { DialogService, StorageService, UserService, WebSocketService } from 'app/services';
import { forkJoin } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  templateUrl: './dataset-trivial-permissions.component.html',
  styleUrls: ['./dataset-trivial-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetTrivialPermissionsComponent implements OnInit {
  form = this.formBuilder.group({
    user: [''],
    applyUser: [false],
    group: [''],
    mode: [''],
    applyGroup: [false],
    permission: [''],
    recursive: [false],
    traverse: [false],
  });

  isLoading = false;
  aclType: AclType;
  datasetPath: string;

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly groupProvider = new GroupComboboxProvider(this.userService);

  readonly tooltips = {
    user: helptext.dataset_permissions_user_tooltip,
    applyUser: helptext.apply_user.tooltip,
    group: helptext.dataset_permissions_group_tooltip,
    applyGroup: helptext.apply_group.tooltip,
    permissions: helptext.dataset_permissions_mode_tooltip,
    recursive: helptext.dataset_permissions_recursive_tooltip,
    traverse: helptext.dataset_permissions_traverse_tooltip,
  };

  readonly isRecursive$ = this.form.select((values) => values.recursive);

  private datasetId: string;
  private oldDatasetMode: string;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ws: WebSocketService,
    private storageService: StorageService,
    private translate: TranslateService,
    private dialog: DialogService,
    private userService: UserService,
    private matDialog: MatDialog,
  ) {}

  get canSetAcl(): boolean {
    return this.aclType !== AclType.Off;
  }

  ngOnInit(): void {
    this.datasetId = this.activatedRoute.snapshot.params['pk'];
    this.datasetPath = '/mnt/' + this.datasetId;

    this.loadPermissionsInformation();
    this.setRecursiveWarning();
  }

  onSetAclPressed(): void {
    if (this.aclType === AclType.Posix1e) {
      // TODO: WTF is this split
      this.router.navigate([
        '/', 'storage', 'id', this.datasetId.split('/')[0], 'dataset',
        'posix-acl', this.datasetId,
      ]);
    } else {
      this.router.navigate([
        '/', 'storage', 'id', this.datasetId.split('/')[0], 'dataset',
        'acl', this.datasetId,
      ]);
    }
  }

  onSubmit(): void {
    const payload = this.preparePayload();

    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: this.translate.instant('Saving Permissions'),
      },
    });
    const jobComponent = dialogRef.componentInstance;

    jobComponent.setDescription(this.translate.instant('Saving Permissions...'));
    jobComponent.setCall('pool.dataset.permission', payload);
    jobComponent.submit();
    jobComponent.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.router.navigate(['/', 'storage']);
    });
  }

  private loadPermissionsInformation(): void {
    this.isLoading = true;
    forkJoin([
      this.ws.call('pool.dataset.query', [[['id', '=', this.datasetId]]]),
      this.storageService.filesystemStat(this.datasetPath),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(
        ([datasets, stat]) => {
          this.isLoading = false;
          this.aclType = datasets[0].acltype.value as AclType;
          this.oldDatasetMode = stat.mode.toString(8).substring(2, 5);
          this.form.patchValue({
            mode: this.oldDatasetMode,
            user: stat.user,
            group: stat.group,
          });

          // TODO: CDR?
        },
        (error) => {
          this.isLoading = false;
          // TODO: Borked
        },
      );
  }

  private preparePayload(): DatasetPermissionsUpdate {
    const values = this.form.value;

    const update = {
      acl: [],
      options: {
        stripacl: true,
        recursive: values.recursive,
        traverse: values.traverse,
      },
    } as DatasetPermissionsUpdate[1];
    if (values.applyUser) {
      update['user'] = values.user;
    }

    if (values.applyGroup) {
      update['group'] = values.group;
    }

    if (this.oldDatasetMode !== values.mode) {
      update['mode'] = values.mode;
      update.options['stripacl'] = true;
    }

    return [this.datasetId, update];
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
