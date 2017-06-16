import { Tooltip } from './Tooltip';

export const TOOLTIPS: Tooltip[] = [
    {
        id: 'gc_netwait_enabled',
        body: 'If enabled, delays the start of network-reliant services until interface is up and ICMP packets to a destination defined in netwait ip list are flowing. Link state is examined first, followed by "pinging" an IP address to verify network usability. If no destination can be reached or timeouts are exceeded, network services are started anyway with no guarantee that the network is usable.'
    },
    {
        id: 'gc_netwait_ip',
        body: 'Space-delimited list of IP addresses to ping(8). If multiple IP addresses are specified, each will be tried until one is successful or the list is exhausted. If it is empty the default gateway will be used.'
    },
    {
        id: 'gc_hosts',
        body: 'This field is appended to /etc/hosts which contains information regarding known hosts on the network. hosts(5)'
    }
]