import { OnInit, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { PodSelectDialogType } from 'app/pages/applications/enums/pod-select-dialog.enum';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  styleUrls: ['./pod-select-dialog.component.scss'],
  templateUrl: './pod-select-dialog.component.html',
})
export class PodSelectDialogComponent implements OnInit {
  selectedAppName: string;
  dialogType: PodSelectDialogType;
  podSelectDialogType = PodSelectDialogType;
  podList: string[] = [];
  podDetails: Record<string, string[]> = {};

  form: FormGroup;
  pods$: Observable<Option[]>;
  containers$: Observable<Option[]>;

  get hasPods(): boolean {
    return !!this.podList.length;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { appName: string; type: PodSelectDialogType },
    public dialogRef: MatDialogRef<PodSelectDialogComponent>,
    public appService: ApplicationsService,
    private router: Router,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
  ) {
    this.selectedAppName = data.appName;
    this.dialogType = data.type;
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
          tail_lines: [500, Validators.required],
        });
    }
  }

  ngOnInit(): void {
    this.loadPods();
  }

  loadPods(): void {
    this.podList = [];
    this.podDetails = {};
    this.loader.open();
    this.ws.call('chart.release.pod_console_choices', [this.selectedAppName]).pipe(untilDestroyed(this)).subscribe({
      next: (consoleChoices) => {
        this.loader.close();
        this.podDetails = { ...consoleChoices };
        this.podList = Object.keys(this.podDetails);
        if (this.podList.length) {
          this.pods$ = of(this.podList.map((item) => ({ label: item, value: item })));
          this.containers$ = of(this.podDetails[this.podList[0]].map((item) => ({ label: item, value: item })));
          this.form.controls.pods.patchValue(this.podList[0]);
          this.form.controls.containers.patchValue(this.podDetails[this.podList[0]][0]);

          this.form.controls.pods.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
            this.containers$ = of(this.podDetails[value].map((item) => ({ label: item, value: item })));
            this.form.controls.containers.patchValue(this.podDetails[value][0]);
          });
        }
      },
      error: () => {
        this.loader.close();
      },
    });
  }

  onPodSelect(): void {
    const pod = this.form.value.pods;

    switch (this.dialogType) {
      case PodSelectDialogType.Shell: {
        const command = this.form.value.command;
        this.router.navigate(new Array('/apps/1/shell/').concat([this.selectedAppName, pod, command]));
        break;
      }
      case PodSelectDialogType.Logs: {
        const container = this.form.value.containers;
        const tailLines = this.form.value.tail_lines.toString();
        this.router.navigate(new Array('/apps/1/logs/').concat([this.selectedAppName, pod, container, tailLines]));
      }
    }
    this.dialogRef.close();
  }
}
