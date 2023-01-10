import { PodSelectDialogComponent } from 'app/pages/apps-old/dialogs/pod-select/pod-select-dialog.component';
import { PodSelectDialogType } from 'app/pages/apps-old/enums/pod-select-dialog.enum';

export interface PodDialogData {
  type: PodSelectDialogType;
  title: string;
  appName: string;
  customSubmit: (formValue: PodDialogFormValue, appName: string) => void;
}

export type PodDialogFormValue = PodSelectDialogComponent['form']['value'];
