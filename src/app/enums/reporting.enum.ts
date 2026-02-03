export enum ReportingGraphName {
  Cpu = 'cpu',
  CpuTemp = 'cputemp',
  Disk = 'disk',
  DiskTemp = 'disktemp', // deprecated
  Memory = 'memory',
  NetworkInterface = 'interface',
  NfsStat = 'nfsstat', // deprecated
  NfsStatBytes = 'nfsstatbytes', // deprecated
  Partition = 'df', // deprecated
  Processes = 'processes', // deprecated
  SystemLoad = 'load',
  Target = 'ctl', // deprecated or unavailable
  Uptime = 'uptime',
  UpsCharge = 'upscharge',
  UpsRuntime = 'upsruntime',
  UpsVoltage = 'upsvoltage',
  UpsCurrent = 'upscurrent',
  UpsFrequency = 'upsfrequency',
  UpsLoad = 'upsload',
  UpsTemp = 'upstemperature',
  ZfsArcRatio = 'arcratio',
  ZfsArcResult = 'arcresult',
  ZfsArcSize = 'arcsize',
  ZfsArcRate = 'arcrate',
  ZfsArcActualRate = 'arcactualrate',
}

export enum ReportingQueryUnit {
  Hour = 'HOUR',
  Day = 'DAY',
  Week = 'WEEK',
  Month = 'MONTH',
  Year = 'YEAR',
}
