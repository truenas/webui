import { CdkScrollable } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, tap } from 'rxjs';
import { nameValidatorRegex } from 'app/constants/name-validator.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetCaseSensitivity } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-create-dataset-dialog',
  templateUrl: './create-dataset-dialog.component.html',
  styleUrls: ['./create-dataset-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatProgressBar,
    CdkScrollable,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    AsyncPipe,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class CreateDatasetDialogComponent implements OnInit {
  readonly requiredRoles = [Role.DatasetWrite];

  isLoading$ = new BehaviorSubject(false);
  form = this.fb.group({
    name: ['', [
      Validators.required,
      Validators.pattern(nameValidatorRegex),
    ]],
  });

  parent: Dataset;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private dialogRef: MatDialogRef<CreateDatasetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: { parentId: string; dataset: DatasetCreate },
  ) {}

  ngOnInit(): void {
    this.loadParentDataset();

    this.isLoading$.pipe(untilDestroyed(this)).subscribe((isLoading) => {
      if (isLoading) {
        this.form.controls.name.disable();
      } else {
        this.form.controls.name.enable();
      }
    });
  }

  createDataset(): void {
    this.isLoading$.next(true);
    this.ws.call('pool.dataset.create', [{ ...this.data.dataset, name: `${this.parent.name}/${this.form.value.name}` }])
      .pipe(untilDestroyed(this)).subscribe({
        next: (dataset) => {
          this.isLoading$.next(false);
          this.dialogRef.close(dataset);
        },
        error: (error) => {
          this.isLoading$.next(false);
          this.dialog.error(this.errorHandler.parseError(error));
        },
      });
  }

  loadParentDataset(): void {
    this.isLoading$.next(true);
    const normalizedParentId = this.data.parentId.replace(/\/$/, '');
    this.ws.call('pool.dataset.query', [[['id', '=', normalizedParentId]]]).pipe(
      tap((parent) => {
        if (!parent.length) {
          throw new Error(`Parent dataset ${normalizedParentId} not found`);
        }
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (parent) => {
        this.isLoading$.next(false);
        this.parent = parent[0];
        this.cdr.markForCheck();
        this.addNameValidators();
      },
      error: (error) => {
        this.isLoading$.next(false);
        this.dialog.error(this.errorHandler.parseError(error));
        this.dialogRef.close(false);
      },
    });
  }

  private addNameValidators(): void {
    const isNameCaseSensitive = this.parent.casesensitivity.value === DatasetCaseSensitivity.Sensitive;
    const namesInUse = this.parent.children.map((child) => {
      const childName = /[^/]*$/.exec(child.name)[0];
      if (isNameCaseSensitive) {
        return childName.toLowerCase();
      }

      return childName;
    });

    this.form.controls.name.addValidators([
      datasetNameTooLong(this.parent.name),
      forbiddenValues(namesInUse, isNameCaseSensitive),
    ]);
  }
}
