"""Make the pair ha.sh booted into a working HA system, over the API.

The sequence is middleware's own (tests/sharing_protocols/conftest.py
setup_server_ha, utils/ha.py settle_ha). Every step is logged with how long
it took and, on failure, what both nodes say about failover, so a broken
run names the step that broke.

    python3 ha_setup.py <license file> [--failover]

Reads HA_NODE_A, HA_NODE_B, HA_VIP, HA_NETMASK, HA_GATEWAY and HA_PASSWORD
from the environment, and imports tnctl from $APPLIANCE_LIB.
"""
import argparse
import json
import os
import subprocess
import sys
import time

sys.path.insert(0, os.environ["APPLIANCE_LIB"])
import tnctl  # noqa: E402

USER = "truenas_admin"
TEMPLATE_PASSWORD = "truenas-appliance-template"
A, B, VIP = os.environ["HA_NODE_A"], os.environ["HA_NODE_B"], os.environ["HA_VIP"]
NETMASK = int(os.environ["HA_NETMASK"])
GATEWAY = os.environ["HA_GATEWAY"]
PASSWORD = os.environ["HA_PASSWORD"]
T0 = time.monotonic()


def log(*a):
    print(f"[{time.monotonic() - T0:7.1f}s]", *a, flush=True)


def connect(ip, password=PASSWORD, timeout=600):
    return tnctl.retry(f"a login to {ip}", timeout, lambda: tnctl.login(f"ws://{ip}", USER, password), every=3)


def call(ip, method, *params, timeout=120, login_timeout=60):
    c = connect(ip, timeout=login_timeout)
    try:
        return c.call(method, *params, timeout=timeout)
    finally:
        c.close()


def poll(what, timeout, fn, every=5):
    """fn() until it returns something truthy; logs each new answer."""
    deadline = time.monotonic() + timeout
    last = object()
    while True:
        try:
            got = fn()
        except Exception as e:  # noqa: BLE001 - a node rebooting answers with anything
            got = f"error: {e}"
        if got != last:
            log(f"  {what}: {got}")
            last = got
        if got is True:
            return
        if time.monotonic() >= deadline:
            raise TimeoutError(f"{what}: not in {timeout}s; last: {got}")
        time.sleep(every)


def report():
    """What both nodes say about failover and fencing, for a failed run's
    log. One quick login each: a standby refuses them, and retrying runs
    into middleware's rate limit on unauthenticated calls."""
    for name, ip in (("A", A), ("B", B), ("VIP", VIP)):
        for method in ("failover.node", "failover.status", "failover.disabled.reasons", "failover.licensed"):
            try:
                log(f"  {name} {method}: {json.dumps(call(ip, method, timeout=20, login_timeout=5))}")
            except Exception as e:  # noqa: BLE001
                log(f"  {name} {method}: error: {str(e)[:200]}")
        # A standby answers only through its peer.
        try:
            log(f"  {name}'s peer failover.status: {json.dumps(remote(ip, 'failover.status', timeout=20))}")
        except Exception as e:  # noqa: BLE001
            log(f"  {name}'s peer failover.status: error: {str(e)[:200]}")
    disks = " ".join(f"/dev/sd{c}" for c in "abcdefgh")
    for name, ip in (("A", A), ("B", B)):
        log(f"  --- {name}: fenced's log, the disks, and their persistent reservations")
        try:
            print(ssh(ip, f"""
                sudo tail -n 60 /var/log/fenced.log
                lsblk -o NAME,SERIAL,VENDOR,MODEL,TRAN
                for d in {disks}; do
                    [ -b "$d" ] || continue
                    echo "== $d"
                    sudo sg_persist -n -i -k "$d"; sudo sg_persist -n -i -r "$d"; sudo sg_persist -n -c "$d"
                done
            """), flush=True)
        except Exception as e:  # noqa: BLE001
            log(f"  no ssh into {name}: {e}")


KEY = os.path.join(os.environ.get("HA_DIR", "/tmp"), "ssh_key")
SSH = ["ssh", "-i", KEY, "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "-o", "StrictHostKeyChecking=no",
       "-o", "UserKnownHostsFile=/dev/null", "-o", "LogLevel=ERROR"]


def enable_ssh(ip):
    """ssh in as the admin, with a key and sudo, to read and change what
    the API does not reach. ssh is on for good after this."""
    if not os.path.exists(KEY):
        subprocess.run(["ssh-keygen", "-q", "-t", "ed25519", "-N", "", "-C", "e2e-ha", "-f", KEY], check=True)
    with open(KEY + ".pub") as f:
        pub = f.read().strip()
    c = connect(ip)
    try:
        uid = c.call("user.query", [["username", "=", USER]], {"get": True})["id"]
        c.call("user.update", uid, {"sshpubkey": pub, "sudo_commands_nopasswd": ["ALL"]})
        c.call("service.update", "ssh", {"enable": True})
        c.job("service.control", "START", "ssh", {"silent": False})
    finally:
        c.close()


def ssh(ip, script, check=True):
    r = subprocess.run([*SSH, f"{USER}@{ip}", "bash -s"], input=script, capture_output=True, text=True, timeout=300)
    if check and r.returncode != 0:
        raise RuntimeError(f"ssh {ip}: exit {r.returncode}: {r.stderr.strip()[:500]}")
    return r.stdout + r.stderr


def identity(ip):
    """The ids a clone shares with the disk it was cloned from: fenced keys
    its reservations by /etc/machine-id's first 8 hex digits, ZFS stamps
    pools with /etc/hostid."""
    return ssh(ip, "echo machine-id $(cat /etc/machine-id) hostid $(hostid)").strip()


def wait_login(ip, timeout=900):
    def up():
        return call(ip, "system.ready", timeout=20, login_timeout=10) is True
    poll(f"{ip} system.ready", timeout, up)


def remote(via, method, *params, timeout=120):
    """method on the other node, through `via`. A standby will not take a
    login of its own: it answers REDIRECT to the VIP. Middleware's tests
    reach it this way, over the heartbeat."""
    return call(via, "failover.call_remote", method, list(params), timeout=timeout)


def wait_peer_ready(via, timeout=900):
    def ready():
        return remote(via, "system.ready", timeout=30) is True
    poll(f"the node behind {via}: system.ready", timeout, ready)


def step(title):
    log(f"=== {title}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("license")
    p.add_argument("--failover", action="store_true")
    a = p.parse_args()

    step("passwords: the template's, rotated to this job's on both nodes")
    for ip in (A, B):
        c = tnctl.login(f"ws://{ip}", USER, TEMPLATE_PASSWORD)
        uid = c.call("user.query", [["username", "=", USER]])[0]["id"]
        c.call("user.update", uid, {"password": PASSWORD})
        c.close()

    step("identity: what middleware makes of each node's hardware")
    for name, ip in (("A", A), ("B", B)):
        hw, node = call(ip, "failover.hardware"), call(ip, "failover.node")
        disks = sorted(d["serial"] for d in call(ip, "disk.query"))
        log(f"  {name} at {ip}: hardware {hw}, node {node}, disks {disks}")
        assert hw == "IXKVM", f"node {name} is not IXKVM: {hw}"
        assert node == name, f"node at {ip} says it is {node}, not {name}"

    step("machine identity: both nodes are clones of one disk; B gets ids of its own")
    for ip in (A, B):
        enable_ssh(ip)
    ids = {n: identity(ip) for n, ip in (("A", A), ("B", B))}
    log(f"  before: {ids}")
    if ids["A"] == ids["B"]:
        # Before the license: its fingerprint includes the machine-id.
        ssh(B, """
            set -e
            new=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \\n')
            echo "$new" | sudo tee /etc/machine-id >/dev/null
            sudo rm -f /var/lib/dbus/machine-id
            sudo zgenhostid -f
        """)
        ssh(B, "sudo systemctl reboot", check=False)
        time.sleep(20)
        wait_login(B)
        ids["B"] = identity(B)
        log(f"  after B's reboot: {ids}")
    assert ids["A"] != ids["B"], f"the nodes still share their ids: {ids}"

    step("license: CI-HAA on node A, which pushes it to B")
    with open(a.license) as f:
        pem = f.read()
    call(A, "truenas.license.upload", pem)
    call(A, "truenas.accept_eula")
    poll("A failover.licensed", 60, lambda: call(A, "failover.licensed") is True)
    poll("B failover.licensed (call_remote)", 120,
         lambda: call(A, "failover.call_remote", "failover.licensed") is True)

    step("network: hostnames and gateway")
    call(A, "network.configuration.update", {
        "hostname": "e2e-ha-a", "hostname_b": "e2e-ha-b", "hostname_virtual": "e2e-ha",
        "ipv4gateway": GATEWAY,
    })

    step(f"interface: {A} on A, {B} on B, {VIP} the VIP; failover off while it changes")
    ifaces = call(A, "interface.query")
    data = next(i for i in ifaces if any(x.get("address") == A for x in i["state"]["aliases"]))
    log(f"  data interface on A: {data['name']} (of {[i['name'] for i in ifaces]})")
    call(A, "failover.update", {"disabled": True, "master": True})
    call(A, "interface.update", data["name"], {
        "ipv4_dhcp": False, "ipv6_auto": False,
        "failover_critical": True, "failover_group": 1,
        "aliases": [{"type": "INET", "address": A, "netmask": NETMASK}],
        "failover_aliases": [{"type": "INET", "address": B}],
        "failover_virtual_aliases": [{"type": "INET", "address": VIP}],
    })
    try:
        call(A, "interface.commit", {"checkin_timeout": 120})
    except Exception as e:  # noqa: BLE001 - the address is re-applied under the connection
        log(f"  commit dropped the connection, as it may: {e}")
    call(A, "interface.checkin")

    step("sync to B, which reboots into A's configuration")
    try:
        call(A, "failover.sync_to_peer", {"reboot": True}, timeout=300)
    except Exception as e:  # noqa: BLE001 - middleware's own setup swallows this too
        log(f"  sync_to_peer: {e}")
    time.sleep(30)
    wait_peer_ready(A)

    step("pool: a stripe on one shared disk, then failover on")
    unused = call(A, "disk.get_unused")
    log(f"  unused on A: {[(d['name'], d['serial']) for d in unused]}")
    c = connect(A)
    try:
        c.job("pool.create", {"name": "tank", "topology": {"data": [{"type": "STRIPE", "disks": [unused[0]["name"]]}]}},
              timeout=600)
    finally:
        c.close()
    call(A, "failover.update", {"disabled": False, "master": True})

    step("settle: no disabled reasons, A MASTER, B BACKUP")

    def settled():
        reasons = call(A, "failover.disabled.reasons")
        status = (call(A, "failover.status"), remote(A, "failover.status"))
        return True if not reasons and status == ("MASTER", "BACKUP") else {"reasons": reasons, "status": status}
    poll("HA settled", 600, settled)
    log(f"  the VIP answers as node {call(VIP, 'failover.node')}")

    if a.failover:
        step("failover: A becomes passive (reboots); B must take the VIP")
        try:
            call(A, "failover.become_passive", timeout=30)
        except Exception as e:  # noqa: BLE001 - A goes down under the call
            log(f"  become_passive: {e}")
        poll("VIP served by B as MASTER", 600,
             lambda: call(VIP, "failover.node") == "B" and call(VIP, "failover.status") == "MASTER")
        wait_peer_ready(B)

        def resettled():
            reasons = call(B, "failover.disabled.reasons")
            status = (remote(B, "failover.status"), call(B, "failover.status"))
            return True if not reasons and status == ("BACKUP", "MASTER") else {"reasons": reasons, "status": status}
        poll("HA settled after failover", 900, resettled)

    log("=== done: HA works in this runner")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log("=== FAILED; what the nodes say:")
        report()
        raise
