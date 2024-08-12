import { PodSelectDialogType } from 'app/enums/pod-select-dialog.enum';
import { ShellDetailsDialogComponent } from 'app/pages/apps/components/shell-details-dialog/shell-details-dialog.component';

export interface ShellDetailsDialogData {
  type: PodSelectDialogType;
  title: string;
  appName: string;
  containerImageKey: string;
  customSubmit: (formValue: ShellDetailsDialogFormValue, appName: string) => void;
}

export type ShellDetailsDialogFormValue = ShellDetailsDialogComponent['form']['value'];
