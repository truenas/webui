import { PodSelectDialogComponent } from 'app/pages/applications/dialogs/pod-select/pod-select-dialog.component';
import { PodSelectDialogType } from 'app/pages/applications/enums/pod-select-dialog.enum';

export interface PodDialogData {
  type: PodSelectDialogType;
  title: string;
  appName?: string;
  customSubmit: (dialog: PodSelectDialogComponent, appName: string) => void;
  afterDialogInit?: (dialog: PodSelectDialogComponent) => (dialog: PodSelectDialogComponent) => void;
}

export type PodDialogFormValue = PodSelectDialogComponent['form']['value'];
