import { OnInit, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { PodSelectDialogType } from 'app/enums/pod-select-dialog.enum';
import { Option } from 'app/interfaces/option.interface';
import { PodDialogData } from 'app/interfaces/pod-select-dialog.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  styleUrls: ['./pod-select-dialog.component.scss'],
  templateUrl: './pod-select-dialog.component.html',
})
export class PodSelectDialogComponent implements OnInit {
  private tailLines = 500;
  selectedAppName: string;
  dialogType: PodSelectDialogType;
  podSelectDialogType = PodSelectDialogType;
  podList: string[] = [];
  podDetails: Record<string, string[]> = {};

  form: FormGroup;
  pods$: Observable<Option[]>;
  containers$: Observable<Option[]>;
  title: string;
  hasPool = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PodDialogData,
    public dialogRef: MatDialogRef<PodSelectDialogComponent>,
    public appService: ApplicationsService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
  ) {
    this.selectedAppName = data.appName;
    this.dialogType = data.type;
    this.title = data.title;
    switch (this.dialogType) {
      case PodSelectDialogType.Shell:
        this.form = this.formBuilder.group({
          pods: ['', Validators.required],
          containers: ['', Validators.required],
          command: ['/bin/sh'],
        });
        break;
      case PodSelectDialogType.Logs:
        this.form = this.formBuilder.group({
          pods: ['', Validators.required],
          containers: ['', Validators.required],
          tail_lines: [this.tailLines, Validators.required],
        });
        break;
    }
  }

  ngOnInit(): void {
    this.loadPods();
  }

  loadPods(): void {
    this.podList = [];
    this.podDetails = {};
    this.ws.call('chart.release.pod_console_choices', [this.selectedAppName])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: (consoleChoices) => {
          this.podDetails = { ...consoleChoices };
          this.podList = Object.keys(this.podDetails);
          if (this.podList.length) {
            this.pods$ = of(this.podList.map((item) => ({ label: item, value: item })));
            this.containers$ = of(this.podDetails[this.podList[0]].map((item) => ({ label: item, value: item })));
            this.form.controls.pods.patchValue(this.podList[0]);
            this.form.controls.containers.patchValue(this.podDetails[this.podList[0]][0]);

            this.form.controls.pods.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
              this.containers$ = of(this.podDetails[value].map((item) => ({ label: item, value: item })));
              this.form.controls.containers.patchValue(this.podDetails[value][0]);
            });
          } else {
            this.hasPool = false;
          }
        },
        error: () => {
          this.hasPool = false;
        },
      });
  }

  onPodSelect(): void {
    this.data.customSubmit(this.form.value, this.selectedAppName);
    this.dialogRef.close();
  }
}
