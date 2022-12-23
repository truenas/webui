import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Option } from 'app/interfaces/option.interface';

export interface RepeatVdevDialogData {
  firstDataVdevDiskNumber: number;
  duplicableDisksCount: number;
  size: string;
  diskType: string;
  vdevType: string;
}

@UntilDestroy()
@Component({
  templateUrl: './repeat-vdev-dialog.component.html',
  styleUrls: ['./repeat-vdev-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepeatVdevDialogComponent implements OnInit {
  repeatCountControl = new FormControl(1);

  repeatOptions$: Observable<Option[]>;

  description: string;

  readonly helptext = helptext;

  constructor(
    private dialogRef: MatDialogRef<RepeatVdevDialogComponent>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: RepeatVdevDialogData,
  ) {}

  get maxVdevs(): number {
    let maxVdevs = 0;
    if (this.data.firstDataVdevDiskNumber && this.data.firstDataVdevDiskNumber > 0) {
      maxVdevs = Math.floor(this.data.duplicableDisksCount / this.data.firstDataVdevDiskNumber);
    }

    return maxVdevs;
  }

  ngOnInit(): void {
    this.repeatCountControl.setValue(this.maxVdevs);
    this.createRepeatOptions();
    this.updateDescription();
    this.updateDescriptionOnChange();
  }

  onSubmit(): void {
    this.dialogRef.close(this.repeatCountControl.value);
  }

  private createRepeatOptions(): void {
    const options = Array.from({ length: this.maxVdevs }, (_, i) => ({
      label: `${i + 1}`,
      value: i + 1,
    }));
    this.repeatOptions$ = of(options);
  }

  private updateDescriptionOnChange(): void {
    this.repeatCountControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateDescription();
    });
  }

  private updateDescription(): void {
    const used = this.data.firstDataVdevDiskNumber * this.repeatCountControl.value;
    const remaining = this.data.duplicableDisksCount - used;

    this.description = this.translate.instant(
      'Create {vdevs} new {vdevType} data vdevs using {used} ({size}) {type}s and leaving {remaining} of those drives unused.',
      {
        vdevs: this.repeatCountControl.value,
        used,
        remaining,
        size: this.data.size,
        type: this.data.diskType,
        vdevType: this.data.vdevType,
      },
    );
  }
}
