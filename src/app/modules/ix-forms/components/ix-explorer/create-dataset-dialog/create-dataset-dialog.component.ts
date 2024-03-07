import {
  Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { nameValidatorRegex } from 'app/constants/name-validator.constant';
import { DatasetCaseSensitivity } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { forbiddenValues } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './create-dataset-dialog.component.html',
  styleUrls: ['./create-dataset-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    this.ws.call('pool.dataset.query', [[['id', '=', this.data.parentId]]])
      .pipe(untilDestroyed(this)).subscribe((parent) => {
        this.isLoading$.next(false);
        this.parent = parent[0];
        this.cdr.markForCheck();
        this.addNameValidators();
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
