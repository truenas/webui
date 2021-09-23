export interface WidgetMemoryData {
  title: string;
  orientation: string;
  units: string;
  max: string;
  data: string[][];
}

export interface WidgetCpuData {
  max: number;
  title: string;
  orientation: string;
  data: (string | number)[][];
}
