import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodSelectDialogComponent implements OnInit {
  private tailLines = 500;
  selectedAppName: string;
  dialogType: PodSelectDialogType;
  podSelectDialogType = PodSelectDialogType;
  podList: string[] = [];
  podDetails: Record<string, string[]> = {};

  form: FormGroup<{
    pods: FormControl<string>;
    containers: FormControl<string>;
    command?: FormControl<string>;
    tail_lines?: FormControl<number>;
  }>;
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
    private cdr: ChangeDetectorRef,
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
        }) as PodSelectDialogComponent['form'];
        break;
      case PodSelectDialogType.Logs:
        this.form = this.formBuilder.group({
          pods: ['', Validators.required],
          containers: ['', Validators.required],
          tail_lines: [this.tailLines, Validators.required],
        }) as PodSelectDialogComponent['form'];
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
            const initialPodKey = this.findBestMatchPodKey(this.podList, this.data.containerImageKey);

            this.pods$ = of(this.podList.map((item) => ({ label: item, value: item })));
            this.containers$ = of(this.podDetails[initialPodKey].map((item) => ({ label: item, value: item })));

            this.form.controls.pods.patchValue(initialPodKey);
            this.form.controls.containers.patchValue(this.podDetails[initialPodKey][0]);

            this.form.controls.pods.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
              this.containers$ = of(this.podDetails[value].map((item) => ({ label: item, value: item })));
              this.form.controls.containers.patchValue(this.podDetails[value][0]);
            });
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
    this.data.customSubmit(this.form.value, this.selectedAppName);
    this.dialogRef.close();
  }

  private findBestMatchPodKey(pods: string[], key: string): string {
    const keyMainPart = key.split('/').pop()?.split(':')[0]?.replace(/-/g, '');

    const bestMatch = pods.find((item) => {
      const normalizedItem = item.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[^a-z0-9]/gi, '').toLowerCase();
      return normalizedItem.includes(keyMainPart);
    });

    return bestMatch || pods[0];
  }
}
