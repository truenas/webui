export interface NetworkInterfacesChangedEvent {
  name: 'NetworkInterfacesChanged';
  sender: unknown;
  data: {
    commit: boolean;
    checkin?: boolean;
  };
}
