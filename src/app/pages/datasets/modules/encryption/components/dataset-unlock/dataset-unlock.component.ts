import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { from, of, switchMap } from 'rxjs';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-unlock';
import { DatasetEncryptionSummary } from 'app/interfaces/dataset-encryption-summary.interface';
import { DatasetUnlockParams } from 'app/interfaces/dataset-lock.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-unlock',
  templateUrl: './dataset-unlock.component.html',
  styleUrls: ['./dataset-unlock.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetUnlockComponent implements OnInit {
  pk: string;
  dialogOpen = false;
  isFormLoading = false;
  form = this.formBuilder.group({
    use_file: [true],
    unlock_children: [true],
    file: [null as File[]],
    datasets: this.formBuilder.array([]),
    force: [false],
  });

  useFileOptions$ = of([{
    value: true,
    label: this.translate.instant('From a key file'),
  }, {
    value: false,
    label: this.translate.instant('Provide keys/passphrases manually'),
  }]);

  readonly helptext = helptext;

  get useFile(): boolean {
    return this.form.controls.use_file.value;
  }

  constructor(
    private formBuilder: FormBuilder,
    protected aroute: ActivatedRoute,
    private ws: WebSocketService,
    protected dialogService: DialogService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['datasetId'];
      this.getEncryptionSummary();
    });
  }

  getEncryptionSummary(): void {
    const dialogRef = this.dialog.open(EntityJobComponent, {
      data: { title: helptext.fetching_encryption_summary_title },
      disableClose: true,
    });
    dialogRef.componentInstance.setDescription(
      this.translate.instant(helptext.fetching_encryption_summary_message) + this.pk,
    );
    dialogRef.componentInstance.setCall('pool.dataset.encryption_summary', [this.pk]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: (job: Job<DatasetEncryptionSummary[]>) => {
        if (!job) {
          return;
        }

        dialogRef.close();
        if (job.result && job.result.length > 0) {
          for (let i = 0; i < job.result.length; i++) {
            const result = job.result[i];
            if (this.form.controls.datasets.controls[i] === undefined) {
              this.form.controls.datasets.push(this.formBuilder.group({
                name: [''],
                key: ['', [Validators.minLength(64), Validators.maxLength(64)]],
                file: [null as File[]],
                passphrase: ['', [Validators.minLength(8)]],
                is_passphrase: [result.key_format === DatasetEncryptionType.Passphrase],
              }));

              (this.form.controls.datasets.controls[i].controls.file as FormControl).valueChanges.pipe(
                switchMap((files: File[]) => (!files?.length ? of('') : from(files[0].text()))),
                untilDestroyed(this),
              ).subscribe((key) => {
                (this.form.controls.datasets.controls[i].controls.key as FormControl).setValue(key);
              });
            }
            const isPassphrase = result.key_format === DatasetEncryptionType.Passphrase;
            (this.form.controls.datasets.controls[i].controls.name as FormControl).setValue(result.name);
            (this.form.controls.datasets.controls[i].controls.is_passphrase as FormControl).setValue(isPassphrase);
          }
        }
      },
      error: this.handleError,
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (error) => {
        if (error) {
          dialogRef.close();
          this.handleError(error);
        }
      },
      error: this.handleError,
    });
  }

  handleError = (error: WebsocketError | Job): void => {
    new EntityUtils().handleWsError(this, error, this.dialogService);
  };

  unlockSubmit(payload: DatasetUnlockParams): void {
    console.warn(payload);
    // TODO: Submit data
  }

  onSubmit(): void {
    console.warn(this.form.value);
    // TODO: Submit data
  }

  goBack(): void {
    this.router.navigate(['datasets']);
  }
}
