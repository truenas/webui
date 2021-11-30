# coding=utf-8
"""Core UI feature tests."""

import time
import os
import re
import random
import string
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)

user = os.environ.get('USER')
mount_point = f'/tmp/iscsi_{"".join(random.choices(string.digits, k=2))}'


@scenario('features/NAS-T1028.feature', 'Start iscsi services and connect to the iscsi zvol and file share without auth')
def test_start_iscsi_services_and_connect_to_the_iscsi_zvol_and_file_share_without_auth():
    """Start iscsi services and connect to the iscsi zvol and file share without auth."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on Services on the side menu')
def click_on_services_on_the_side_menu(driver):
    """click on Services on the side menu."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Services"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('the Services page should open')
def the_services_page_should_open(driver):
    """the Services page should open."""
    assert wait_on_element(driver, 7, '//services')


@then('if the SCSI service is not started, start the service')
def if_the_scsi_service_is_not_started_start_the_service(driver):
    """if the SCSI service is not started, start the service."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__iSCSI"]')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__iSCSI_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__iSCSI_Running"]').click()
    time.sleep(2)


@then('ssh on <host> with <password> to test <type>')
def if_system_is_linux_ssh_on_host_with_password(driver, host, password):
    """ssh on <host> with <password> to test <type>."""
    global hst, passwd
    hst = host
    passwd = password


@then('if <system> is linux run iscsiadm to discover portal NAS IP and login with <target>')
def run_iscsiadm_to_discover_portal_nas_ip_and_login_with_nopeer1_target(driver, nas_ip, system, target):
    """if <system> is linux run iscsiadm to discover portal NAS IP and login with <target>."""
    global targets
    targets = target
    if system == 'linux':
        cmd = f"iscsiadm --mode discovery --type sendtargets --portal {nas_ip}"
        discovery_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert discovery_results['result'], str(discovery_results)
        discovery_text = discovery_results['output']
        global iqn
        target_list = re.findall(f'.*{target}$', discovery_text, re.MULTILINE)[0].split()
        iqn = target_list[1]
        cmd = f"iscsiadm --mode node --targetname {iqn} --portal {nas_ip}:3260 --login"
        login_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert login_results['result'], str(login_results)
        assert target in login_results['output'], str(login_results)
        cmd = "iscsiadm -m session"
        session_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert session_results['result'], str(session_results)
        assert target in session_results['output'], str(session_results)


@then(parsers.parse('if <system> is bsd run iscsictl with NAS IP and <target>'))
def run_iscsictl_with_NAS_IP_nopeer1_and_target(driver, nas_ip, system, target):
    """if <system> is BSD run run iscsictl with NAS IP and <target>."""
    global os_system
    os_system = system
    if system == 'bsd':
        cmd = f'iscsictl -A -p {nas_ip}:3260 -t iqn.2005-10.org.freenas.ctl:{target}'
        login_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert login_results['result'], str(login_results)


@then('find the iscsi device and format the device')
def find_the_iscsi_device_and_format_the_device(driver, nas_ip):
    """find the iscsi device and format the device."""
    global device
    if os_system == 'linux':
        cmd = "fdisk -l | grep -B 1 'iSCSI Disk' | grep -v 'iSCSI Disk'"
        fdisk_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert fdisk_results['result'], str(fdisk_results)
        device = fdisk_results['output'].replace('Disk ', '').split(':')[0]
        cmd = f"mkfs {device}"
        format_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert format_results['result'], str(format_results)
    else:
        for num in list(range(15)):
            cmd = f'iscsictl -L | grep {nas_ip}:3260'
            iscsictl_results = ssh_cmd(cmd, 'root', passwd, hst)
            assert iscsictl_results['result'], str(iscsictl_results)
            iscsictl_list = iscsictl_results['output'].strip().split()
            if iscsictl_list[2] == "Connected:":
                device = f"/dev/{iscsictl_list[3]}"
                assert True
                break
            time.sleep(3)
        else:
            assert False
        cmd = f'newfs {device}'
        format_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert format_results['result'], str(format_results)


@then('create a mount point, then mount the device to it')
def created_a_mount_point_then_mount_the_device_to_it(driver):
    """create a mount point, then mount the device to it."""
    cmd = f"mkdir -p {mount_point}"
    mkdir_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert mkdir_results['result'], str(mkdir_results)
    cmd = f"mount {device} {mount_point}"
    mount_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert mount_results['result'], str(mount_results)


@then('should be able to send a file to the mount point')
def should_be_able_to_send_a_file_to_the_mount_point(driver):
    """should be able to send a file to the mount point."""
    cmd = f"touch {mount_point}/test.text"
    touch_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert touch_results['result'], str(touch_results)
    cmd = f"test -f {mount_point}/test.text"
    touch_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert touch_results['result'], str(touch_results)


@then('when you umount, the file should not be in the mount point')
def when_you_umount_the_file_should_not_be_in_the_mount_point(driver):
    """when you umount, the file should not be in the mount point."""
    cmd = f"umount {mount_point}"
    mount_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert mount_results['result'], str(mount_results)
    cmd = f"test -f {mount_point}/test.text"
    touch_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert not touch_results['result'], str(touch_results)


@then('when remount, the file should be in the mount point')
def when_remount_the_file_should_be_in_the_mount_point(driver):
    """when remount, the file should be in the mount point."""
    cmd = f"mount {device} {mount_point}"
    mount_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert mount_results['result'], str(mount_results)
    cmd = f"test -f {mount_point}/test.text"
    touch_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert touch_results['result'], str(touch_results)


@then('umount and remove the mount point, disconnect from <system>')
def umount_and_remove_the_mount_point_disconnect_from_system(driver, nas_ip, system):
    """umount and remove the mount point, disconnect from <system>."""
    cmd = f"umount {mount_point}"
    mount_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert mount_results['result'], str(mount_results)
    cmd = f"rm -rf {mount_point}"
    mount_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert mount_results['result'], str(mount_results)
    if system == 'linux':
        cmd = f"iscsiadm -m node -T {iqn} -p {nas_ip}:3260 -u"
        logout_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert logout_results['result'], str(logout_results)
        cmd = "iscsiadm -m session"
        session_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert not session_results['result'], str(session_results)
        assert targets not in session_results['output'], str(session_results)
        cmd = f"iscsiadm -m discoverydb -t sendtargets -p {nas_ip}:3260 -o delete"
        session_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert session_results['result'], str(session_results)
    else:
        cmd = f"iscsictl -R -t iqn.2005-10.org.freenas.ctl:{targets}"
        remove_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert remove_results['result'], str(remove_results)
