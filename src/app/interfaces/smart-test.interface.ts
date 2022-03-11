import { SmartPowerMode } from 'app/enums/smart-power.mode';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Schedule } from 'app/interfaces/schedule.interface';

export interface SmartTest {
  all_disks: boolean;
  desc: string;
  disks: string[];
  id: number;
  schedule: Schedule;
  type: SmartTestType;
}

export type SmartTestUpdate = Omit<SmartTest, 'id'>;

export interface SmartTestUi extends SmartTest {
  cron_schedule: string;
  frequency: string;
  next_run: string;
  disksLabel?: string[];
}

export interface SmartConfig {
  critical: number;
  difference: number;
  id: number;
  informational: number;
  interval: number;
  powermode: SmartPowerMode;
}

export type SmartConfigUpdate = Omit<SmartConfig, 'id'>;

export interface SmartManualTestParams {
  identifier: string;
  type: SmartTestType;
}

export interface SmartTestResults {
  disk: string;
  tests: SmartTestResult[];
}

export interface SmartTestResult {
  description: string;
  lba_of_first_error: number;
  lifetime: number;
  num: number;
  remaining: number;
  status: string; // Enum: SUCCESS,
  status_verbose: string;
}

export interface ManualSmartTest {
  disk: string;
  expected_result_time: ApiTimestamp;
  identifier: string;
  job: number;
  error?: string;
}
