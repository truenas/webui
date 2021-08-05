import { Sensor } from 'app/interfaces/sensor.interface';

export interface SensorDataEvent {
  name: 'SensorData';
  sender: unknown;
  data: Sensor[];
}
