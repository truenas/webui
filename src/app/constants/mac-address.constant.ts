/**
 * Middleware validates custom MAC addresses on container and VM NIC devices as
 * colon-separated only. Dash-separated (`10-66-6A-1F-F1-B1`), unseparated,
 * mixed-separator and Cisco dotted (`1066.6a1f.f1b1`) forms are rejected: libvirt only
 * ever parsed the colon form, so the permissive values used to save and then fail at start.
 */
export const macAddressRegex = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i;
