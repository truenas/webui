import { PodSelectDialogType } from 'app/enums/pod-select-dialog.enum';
import { PodSelectDialogComponent } from 'app/pages/apps/components/pod-select-dialog/pod-select-dialog.component';

export interface PodDialogData {
  type: PodSelectDialogType;
  title: string;
  appName: string;
  customSubmit: (formValue: PodDialogFormValue, appName: string) => void;
}

export type PodDialogFormValue = PodSelectDialogComponent['form']['value'];
