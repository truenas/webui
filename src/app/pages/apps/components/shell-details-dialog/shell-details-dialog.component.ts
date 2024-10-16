import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ShellDetailsDialogData } from 'app/interfaces/shell-details-dialog.interface';
import { ShellDetailsType } from 'app/pages/apps/enum/shell-details-type.enum';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

@UntilDestroy()
@Component({
  selector: 'ix-shell-details-dialog',
  templateUrl: './shell-details-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellDetailsDialogComponent {
  private tailLines = 500;
  selectedAppName: string;
  dialogType: ShellDetailsType;
  podSelectDialogType = ShellDetailsType;
  podList: string[] = [];
  podDetails: Record<string, string[]> = {};

  form: FormGroup<{
    command?: FormControl<string>;
    tail_lines?: FormControl<number>;
  }>;

  title: string;
  hasPool = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ShellDetailsDialogData,
    public dialogRef: MatDialogRef<ShellDetailsDialogComponent>,
    public appService: ApplicationsService,
    private formBuilder: FormBuilder,
  ) {
    this.selectedAppName = data.appName;
    this.dialogType = data.type;
    this.title = data.title;
    switch (this.dialogType) {
      case ShellDetailsType.Shell:
        this.form = this.formBuilder.group({
          command: ['/bin/sh', Validators.required],
        }) as ShellDetailsDialogComponent['form'];
        break;
      case ShellDetailsType.Logs:
        this.form = this.formBuilder.group({
          tail_lines: [this.tailLines, Validators.required],
        }) as ShellDetailsDialogComponent['form'];
        break;
    }
  }

  onPodSelect(): void {
    this.data.customSubmit(this.form.value, this.selectedAppName);
    this.dialogRef.close();
  }
}
