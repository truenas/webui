import { ShellDetailsDialogComponent } from 'app/pages/apps/components/shell-details-dialog/shell-details-dialog.component';
import { ShellDetailsType } from 'app/pages/apps/enum/shell-details-type.enum';

export interface ShellDetailsDialogData {
  type: ShellDetailsType;
  title: string;
  appName: string;
  containerImageKey: string;
  customSubmit: (formValue: ShellDetailsDialogFormValue, appName: string) => void;
}

export type ShellDetailsDialogFormValue = ShellDetailsDialogComponent['form']['value'];
