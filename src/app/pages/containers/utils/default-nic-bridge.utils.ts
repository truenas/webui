import { ContainerDeviceType } from 'app/enums/container.enum';
import { ContainerGlobalConfig, ContainerNicDevice } from 'app/interfaces/container.interface';

/** The TrueNAS-managed bridge (DHCP, DNS and NAT) middleware uses while the bridge setting is Automatic. */
export const autoContainerBridge = 'truenasbr0';

/**
 * The bridge a NIC created without `nic_attach` is attached to. The global bridge setting only
 * sets this default for new NICs; changing it does not move NICs that already exist.
 */
export function getDefaultNicBridge(config: ContainerGlobalConfig | null): string {
  return config?.bridge || autoContainerBridge;
}

/**
 * A NIC with no attachment: middleware puts it on the default bridge and stores that bridge's
 * name, generating the MAC once so the container keeps its address across restarts.
 */
export const defaultNicAttributes = { dtype: ContainerDeviceType.Nic } as ContainerNicDevice;
