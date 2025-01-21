import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const containersHelptext = {
  cpuHint: T('Leave empty to allow all host CPUs to be used.'),
  memoryHint: T('Leave empty to not limit instance memory.'),
  vncHint: T('VNC connection is currently insecure. Secure the connection in other ways.'),

  name_placeholder: T('Name'),
  name_tooltip: T('Specify a unique name for the container.'),

  instance_type_placeholder: T('Virtualization Method'),
  instance_type_tooltip: T('<b>Difference between Container and VM:</b><br /><br /> \
<b>Why choose Container?</b><br /> \
Containers offer lightweight, \
efficient virtualization by sharing the host OS kernel, \
providing faster startup times and reduced resource usage compared to VMs. \
Ideal for scalable applications.<br /><br /> \
<b>Why choose VM?</b><br /> \
Choose a VM for full OS isolation, kernel independence, and running diverse OS types.'),

  cpu_placeholder: T('CPU Configuration'),
  cpu_tooltip: T('Specify the logical cores that container is allowed to use. \
Better cache locality can be achieved by setting CPU set base on CPU topology. \
E.g. to assign cores: 0,1,2,5,9,10,11 you can write: 1-2,5,9-11'),

  memory_placeholder: T('Memory Size'),
  memory_tooltip: T('Specify RAM allocation for the container. You can use units such as GB, MB.'),

  env_placeholder: T('Environment Variables'),
  env_tooltip: T('Environment variables allow you to customize container behavior.'),
  env_name_placeholder: T('Name'),
  env_name_tooltip: T('Specify the environment variable name.'),
  env_value_placeholder: T('Value'),
  env_value_tooltip: T('Enter the value for the environment variable.'),

  disks_placeholder: T('Disks'),
  disks_tooltip: T('Specify storage volumes for your Linux Containers.'),
  disks_src_placeholder: T('Source'),
  disks_src_tooltip: T('Specify the disk source for your container.'),
  disks_dst_placeholder: T('Destination'),
  disks_dst_tooltip: T('Specify the container filesystem path where the disk will be mounted.'),

  proxies_placeholder: T('Proxies'),
  proxies_tooltip: T('Brief explanation of proxy configuration for Linux Containers.'),

  host_protocol_placeholder: T('Host Protocol'),
  host_protocol_tooltip: T('Specify the protocol (TCP or UDP) for the host.'),
  host_port_placeholder: T('Host Port'),
  host_port_tooltip: T('Specify the host port to be mapped to the container\'s port.'),

  instance_protocol_placeholder: T('Instance Protocol'),
  instance_protocol_tooltip: T('Select the protocol for the instance\'s network connection.'),
  instance_port_placeholder: T('Instance Port'),
  instance_port_tooltip: T('Specify the network port for the container instance.'),

  network_use_default_placeholder: T('Use default network settings'),
  network_use_default_tooltip: T('Enable to apply default network configurations.'),
  network_bridged_nics_placeholder: T('Bridged NICs'),
  network_bridged_nics_tooltip: T('Enable or disable NICs.'),
  network_mac_vlan_nics_placeholder: T('Macvlan NICs'),
  network_mac_vlan_nics_tooltip: T('Enable or disable NICs.'),

  usb_devices_placeholder: T('USB Devices'),
  usb_devices_tooltip: T('Enable or disable the USB device for your container.'),

  enable_vnc_placeholder: T('Enable VNC'),
  enable_vnc_tooltip: T('Check to allow remote desktop access via VNC.'),

  add_tpm_placeholder: T('Add Trusted Platform Module'),
  add_tpm_tooltip: T('Enable TPM for enhanced security features in your VM instance.'),
};
