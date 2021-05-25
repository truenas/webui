import { Schedule } from 'app/interfaces/schedule.interface';
import { SmartTestType } from 'app/enums/smart-test-type.enum';

export interface SmartTest {
  all_disks: boolean;
  desc: string;
  disks: any[];
  id: number;
  schedule: Schedule;
  type: SmartTestType;
}

export interface SmartTestUi extends SmartTest {
  cron_schedule: string;
  frequency: string;
  next_run: string;
}
