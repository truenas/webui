import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WebSocketService } from 'app/services/ws.service';

export type LogsDialogFormValue = PodSelectLogsDialogComponent['form']['value'];

@UntilDestroy()
@Component({
  templateUrl: './pod-select-logs-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodSelectLogsDialogComponent implements OnInit {
  title: string;
  hasPool = true;
  private tailLines = 500;
  private apps: string[] = [];
  private selectedApp: string;
  private podLogsDetails: Record<string, string[]>;
  pods$: Observable<Option[]>;
  containers$: Observable<Option[]>;
  apps$: Observable<Option[]>;

  form = this.formBuilder.group({
    apps: ['', Validators.required],
    pods: ['', Validators.required],
    containers: ['', Validators.required],
    tail_lines: [this.tailLines, Validators.required],
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string;
      appName: string;
      customSubmit: (formValue: LogsDialogFormValue) => void;
    },
    public dialogRef: MatDialogRef<PodSelectLogsDialogComponent>,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
  ) {
    this.title = data.title;
    this.selectedApp = data.appName;
  }

  ngOnInit(): void {
    this.loader.open();
    this.appService.getChartReleaseNames().pipe(untilDestroyed(this)).subscribe((charts) => {
      charts.forEach((chart) => {
        this.apps.push(chart.name);
      });
      this.fillForm();
    });
  }

  fillForm(): void {
    const appOptions = this.apps.map((app) => ({ label: app, value: app }));
    this.apps$ = of(appOptions);
    const app = appOptions.find((option) => option.value === this.selectedApp);
    this.form.controls.apps.setValue(app.value);

    this.loadPodLogs(this.selectedApp);

    this.form.controls.apps.valueChanges.pipe(untilDestroyed(this)).subscribe((appValue) => {
      this.loadPodLogs(appValue);
    });

    this.form.controls.pods.valueChanges.pipe(untilDestroyed(this)).subscribe((pod) => {
      if (pod) {
        const containers = this.podLogsDetails[pod];

        this.containers$ = of(containers.map((item) => ({
          label: item,
          value: item,
        })));
        this.form.controls.containers.setValue(containers[0]);
      } else {
        this.containers$ = of(null);
        this.form.controls.containers.setValue(null);
      }
      this.cdr.markForCheck();
    });
  }

  loadPodLogs(appName: string): void {
    this.ws.call('chart.release.pod_logs_choices', [appName])
      .pipe(this.loader.withLoader(), untilDestroyed(this)).subscribe({
        next: (podLogs) => {
          this.podLogsDetails = { ...podLogs };
          const logsList = Object.keys(this.podLogsDetails);
          if (logsList.length) {
            this.pods$ = of(logsList.map((item) => ({ label: item, value: item })));
            this.containers$ = of(this.podLogsDetails[logsList[0]].map((item) => ({ label: item, value: item })));
            this.form.controls.pods.setValue(logsList[0]);
            this.form.controls.containers.setValue(this.podLogsDetails[logsList[0]][0]);
          } else {
            this.hasPool = false;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.hasPool = false;
          this.cdr.markForCheck();
        },
      });
  }

  onPodSelect(): void {
    this.data.customSubmit(this.form.value);
    this.dialogRef.close();
  }
}
