#!/usr/bin/env bash
# SPIKE: an HA pair of TrueNAS appliances, both inside this runner.
#
# Not the finished thing: it answers whether the in-runner model can host
# HA at all, before any of it moves into the truenas-appliance-runner
# action. Reuses that action's lib.sh and tnctl.py, from a checkout of
# iXsystems/ux-github-workflows at $APPLIANCE_LIB.
#
# What middleware needs of the hardware, and how this provides it:
#
#   HA identity    SMBIOS manufacturer QEMU and a serial ending _c1 / _c2:
#                  middleware reports IXKVM, node A or B by the last digit
#                  (utils/hardware/detect.py).
#   heartbeat      a NIC the guest names enp1s0 (hard-coded for IXKVM in
#                  failover_/internal_interface.py): the only device behind
#                  a PCIe root port, so on bus 1, slot 0. Its own bridge,
#                  shared by the two nodes and nothing else.
#   data network   a second bridge, the runner at .1, dnsmasq handing each
#                  node a fixed address by MAC; the VIP is set later.
#   shared disks   LIO iSCSI LUNs on the runner, attached to both nodes as
#                  scsi-block through qemu's own initiator, which passes
#                  SCSI persistent reservations through: fenced needs them,
#                  and pool.create needs fenced.
#
#   ha.sh start   boot both, wait for both APIs; KEY=value on stdout
#   ha.sh stop
#   ha.sh console <a|b> [lines]
#
# The two OS disks are the two appliance disks the scale set attached,
# clones of one image: whether HA tolerates that is one of the questions.

set -euo pipefail
: "${APPLIANCE_LIB:?the truenas-appliance-runner action directory}"
# shellcheck source=/dev/null
. "$APPLIANCE_LIB/lib.sh"

DIR="${HA_DIR:-${RUNNER_TEMP:-/tmp}/tn-ha}"
NET=10.231.0
RUNNER_IP=$NET.1
VIP=$NET.10
declare -A IP=([a]=$NET.11 [b]=$NET.12)
declare -A DATA_MAC=([a]=52:54:00:e2:a0:01 [b]=52:54:00:e2:b0:01)
declare -A HB_MAC=([a]=52:54:00:e2:a0:02 [b]=52:54:00:e2:b0:02)
declare -A SERIAL_SUFFIX=([a]=_c1 [b]=_c2)
IQN=iqn.2026-10.net.truenas.e2e:ha
initiator() { echo "iqn.2026-10.net.truenas.e2e:node-$1"; }
SHARED="${HA_SHARED_DISKS:-4}"
SHARED_GB="${HA_SHARED_DISK_GB:-10}"

# boot_disks: every attached disk holding a TrueNAS boot-pool, not the one
# / is on. appliance.sh's attached_disk insists on exactly one.
boot_disks() {
    lsblk -J -p -o NAME,PKNAME,FSTYPE,LABEL,MOUNTPOINT | python3 -c '
import json, sys
devs = []
def walk(ds):
    for d in ds:
        devs.append(d)
        walk(d.get("children") or [])
walk(json.load(sys.stdin)["blockdevices"])
root = {d["pkname"] for d in devs if d.get("mountpoint") == "/"}
for p in sorted({d["pkname"] for d in devs
                 if d.get("fstype") == "zfs_member" and d.get("label") == "boot-pool"
                 and d.get("pkname") and d["pkname"] not in root}):
    print(p)
'
}

network() {
    say "network: bridges tnha-data ($RUNNER_IP/24) and tnha-hb, a tap per node on each"
    local br n
    for br in tnha-data tnha-hb; do
        sudo -n ip link add "$br" type bridge
        sudo -n ip link set "$br" up
    done
    sudo -n ip addr add "$RUNNER_IP/24" dev tnha-data
    for n in a b; do
        sudo -n ip tuntap add dev "tnha-d-$n" mode tap user "$(id -u)"
        sudo -n ip tuntap add dev "tnha-h-$n" mode tap user "$(id -u)"
        sudo -n ip link set "tnha-d-$n" master tnha-data up
        sudo -n ip link set "tnha-h-$n" master tnha-hb up
    done
    # Docker loads br_netfilter and drops FORWARD by default, which would
    # drop frames between the two nodes on these bridges: VRRP, heartbeat.
    for br in tnha-data tnha-hb; do
        sudo -n iptables -I FORWARD -i "$br" -j ACCEPT
        sudo -n iptables -I FORWARD -o "$br" -j ACCEPT
    done
    sudo -n dnsmasq --interface=tnha-data --bind-interfaces --except-interface=lo --port=0 \
        --dhcp-range="$NET.100,$NET.200,12h" \
        --dhcp-host="${DATA_MAC[a]},${IP[a]}" --dhcp-host="${DATA_MAC[b]},${IP[b]}" \
        --dhcp-leasefile="$DIR/dnsmasq.leases" --pid-file="$DIR/dnsmasq.pid" \
        --log-dhcp --log-facility="$DIR/dnsmasq.log"
}

storage() {
    say "storage: $SHARED LIO LUNs of ${SHARED_GB}G on 127.0.0.1:3260, an ACL per node"
    local i
    sudo -n modprobe target_core_mod
    sudo -n modprobe iscsi_target_mod
    sudo -n targetcli /iscsi create "$IQN" >/dev/null
    sudo -n targetcli "/iscsi/$IQN/tpg1/portals" delete 0.0.0.0 3260 >/dev/null 2>&1 || true
    sudo -n targetcli "/iscsi/$IQN/tpg1/portals" create 127.0.0.1 3260 >/dev/null
    sudo -n targetcli "/iscsi/$IQN/tpg1" set attribute authentication=0 >/dev/null
    for i in $(seq 1 "$SHARED"); do
        truncate -s "${SHARED_GB}G" "$DIR/shared$i.img"
        sudo -n targetcli /backstores/fileio create "name=tnha$i" "file_or_dev=$DIR/shared$i.img" write_back=false >/dev/null
        sudo -n targetcli "/iscsi/$IQN/tpg1/luns" create "/backstores/fileio/tnha$i" >/dev/null
    done
    sudo -n targetcli "/iscsi/$IQN/tpg1/acls" create "$(initiator a)" >/dev/null
    sudo -n targetcli "/iscsi/$IQN/tpg1/acls" create "$(initiator b)" >/dev/null
    sudo -n targetcli ls "/iscsi/$IQN" >&2
}

boot() {
    local n="$1" disk="$2" memory="$3" vcpus="$4" name="$5"
    local d="$DIR/$n" i
    mkdir -p "$d"
    qemu-img create -q -f qcow2 -F raw -b "$disk" "$d/os.qcow2"
    vars_qcow2 "$d/vars.qcow2"
    local shared=(-device virtio-scsi-pci,id=scsi0,bus=pcie.0,addr=0x5)
    for i in $(seq 1 "$SHARED"); do
        shared+=(-blockdev "{\"driver\":\"iscsi\",\"node-name\":\"sh$i\",\"transport\":\"tcp\",\"portal\":\"127.0.0.1:3260\",\"target\":\"$IQN\",\"lun\":$((i - 1)),\"initiator-name\":\"$(initiator "$n")\"}"
                 -device "scsi-block,bus=scsi0.0,channel=0,scsi-id=$i,lun=0,drive=sh$i")
    done
    say "booting node $n from $disk as ${name}${SERIAL_SUFFIX[$n]}: ${memory} MB, $vcpus vCPUs"
    qemu-system-x86_64 -name "$name-$n" -machine q35,accel=kvm -cpu host -smp "$vcpus" -m "$memory" \
        -uuid "$(python3 -c 'import uuid; print(uuid.uuid4())')" \
        -smbios "type=1,manufacturer=QEMU,serial=${name}${SERIAL_SUFFIX[$n]}" \
        -drive "if=pflash,format=raw,readonly=on,file=$OVMF_CODE" \
        -drive "if=pflash,format=qcow2,file=$d/vars.qcow2" \
        -drive "file=$d/os.qcow2,if=none,id=os,format=qcow2,discard=unmap" \
        -device "virtio-blk-pci,drive=os,serial=os,bootindex=0,bus=pcie.0,addr=0x4" \
        "${shared[@]}" \
        -netdev "tap,id=data,ifname=tnha-d-$n,script=no,downscript=no" \
        -device "virtio-net-pci,netdev=data,mac=${DATA_MAC[$n]},bus=pcie.0,addr=0x3" \
        -device pcie-root-port,id=rp1,bus=pcie.0,chassis=1,addr=0x1c \
        -netdev "tap,id=hb,ifname=tnha-h-$n,script=no,downscript=no" \
        -device "virtio-net-pci,netdev=hb,mac=${HB_MAC[$n]},bus=rp1,addr=0x0" \
        -device virtio-rng-pci \
        -qmp "unix:$d/qmp.sock,server=on,wait=off" \
        -display none -serial "file:$d/console.log" \
        -daemonize -pidfile "$d/qemu.pid"
    skip_grub "$d/console.log" "$d/qmp.sock"
}

start() {
    local memory="${HA_MEMORY_MB:-8192}" vcpus="${HA_VCPUS:-4}"
    local name="e2e-${GITHUB_RUN_ID:-local}"
    [ -w /dev/kvm ] || die "no /dev/kvm this user can use"
    needs qemu-system-x86_64 qemu-system-x86 qemu-img qemu-utils python3 python3 \
        targetcli targetcli-fb dnsmasq dnsmasq-base iptables iptables
    # qemu's iSCSI initiator is a loadable block module, packaged apart.
    if ! ls /usr/lib/*/qemu/block-iscsi.so >/dev/null 2>&1; then
        say "installing qemu-block-extra (qemu's iSCSI initiator)"
        sudo -n env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends qemu-block-extra >/dev/null
    fi
    ovmf
    say "runner: $(nproc) vCPUs, $(free -m | awk '/^Mem:/ {print $2 " MB, " $7 " MB available"}'), kernel $(uname -r)"

    local disks
    mapfile -t disks < <(boot_disks)
    if [ "${#disks[@]}" -ne 2 ]; then
        lsblk -p -o NAME,SIZE,SERIAL,FSTYPE,LABEL,MOUNTPOINT >&2 || true
        die "want two attached appliance disks, found ${#disks[@]}: ${disks[*]:-none}"
    fi
    local d
    for d in "${disks[@]}"; do
        [ -r "$d" ] || sudo -n chown "$(id -u)" "$d"
    done

    rm -rf "$DIR"
    mkdir -p "$DIR"
    network
    storage

    local t0
    t0=$(date +%s.%N)
    boot b "${disks[1]}" "$memory" "$vcpus" "$name"
    boot a "${disks[0]}" "$memory" "$vcpus" "$name"

    local n booted
    for n in a b; do
        if ! booted=$("${TNCTL[@]}" wait "ws://${IP[$n]}" "$APPLIANCE_USER" "$APPLIANCE_TEMPLATE_PASSWORD" \
                --since "$t0" --timeout "${HA_BOOT_TIMEOUT:-900}"); then
            say "--- node $n's console, last 60 lines"
            tail -n 60 "$DIR/$n/console.log" >&2 || true
            say "--- dnsmasq"
            cat "$DIR/dnsmasq.log" "$DIR/dnsmasq.leases" >&2 2>/dev/null || true
            die "node $n's API never came up at ${IP[$n]}"
        fi
        say "node $n: API up at ${IP[$n]}, ${booted}s"
    done
    cat <<EOF
HA_NODE_A=${IP[a]}
HA_NODE_B=${IP[b]}
HA_VIP=$VIP
HA_NETMASK=24
HA_GATEWAY=$RUNNER_IP
HA_NAME=$name
EOF
}

stop() {
    local n
    for n in a b; do
        [ -f "$DIR/$n/qemu.pid" ] && kill "$(cat "$DIR/$n/qemu.pid")" 2>/dev/null || true
    done
}

case "${1:-}" in
start)   start ;;
stop)    stop ;;
console) tail -n "${3:-100}" "$DIR/${2:?a or b}/console.log" ;;
*)       die "usage: ha.sh start | stop | console <a|b> [lines]" ;;
esac
