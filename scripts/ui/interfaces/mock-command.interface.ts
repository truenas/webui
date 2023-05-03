export interface ConfigGeneratorAnswers {
  fileName: string;
  mockEnclosure: string;
  controller?: string;
  shelves?: string;
  dispersal?: string;
  mockDisk: string;
  diskSize?: string;
  repeats?: string;
  mockPool: string;
  vdevScenario?: string;
  vdevLayout?: string;
  vdevWidth?: string;
  vdevDiskSize?: string;
  vdevRepeats?: string;
  loadAfterSave: string;
  saveOrCancel: string;
}

export interface ConfigLoaderAnswers {
  location: string;
  customFile?: string;
  includedFile?: string;
}
