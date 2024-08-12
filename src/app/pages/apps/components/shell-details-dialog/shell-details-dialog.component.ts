import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject,
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { PodSelectDialogType } from 'app/enums/pod-select-dialog.enum';
import { Option } from 'app/interfaces/option.interface';
import { ShellDetailsDialogData } from 'app/interfaces/shell-details-dialog.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-shell-details-dialog',
  styleUrls: ['./shell-details-dialog.component.scss'],
  templateUrl: './shell-details-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellDetailsDialogComponent {
  private tailLines = 500;
  selectedAppName: string;
  dialogType: PodSelectDialogType;
  podSelectDialogType = PodSelectDialogType;
  podList: string[] = [];
  podDetails: Record<string, string[]> = {};

  form: FormGroup<{
    command?: FormControl<string>;
    tail_lines?: FormControl<number>;
  }>;
  pods$: Observable<Option[]>;
  containers$: Observable<Option[]>;
  title: string;
  hasPool = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ShellDetailsDialogData,
    public dialogRef: MatDialogRef<ShellDetailsDialogComponent>,
    public appService: ApplicationsService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.selectedAppName = data.appName;
    this.dialogType = data.type;
    this.title = data.title;
    switch (this.dialogType) {
      case PodSelectDialogType.Shell:
        this.form = this.formBuilder.group({
          command: ['/bin/sh', Validators.required],
        }) as ShellDetailsDialogComponent['form'];
        break;
      case PodSelectDialogType.Logs:
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
