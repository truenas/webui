export interface EnclosureLabelChangedEvent {
  name: 'EnclosureLabelChanged';
  sender: unknown;
  data: {
    label: string;
    index: number;
    id: string;
  };
}
