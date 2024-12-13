export interface AppDeleteDialogInputData {
  name: string;
  showRemoveVolumes: boolean;
}

export interface AppDeleteDialogOutputData {
  removeVolumes: boolean;
  removeImages: boolean;
  forceRemoveVolumes: boolean;
}
