# coding=utf-8
"""Core feature tests."""

import random
import string
import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)

# random mount point to avoid the same test to break if it ever run in the same time
mountpoint = f'/mnt/nfs_host{"".join(random.choices(string.digits, k=2))}'


@scenario('features/NAS-T1053.feature', 'Verify authorized IP address work for an NFS share')
def test_verify_authorized_ip_address_work_for_an_nfs_share(driver):
    """Verify authorized IP address work for an NFS share."""
    pass


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
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        rsc.scroll_To(driver, xpaths.sideMenu.root)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Sharing on the side menu, click on Unix Shares')
def on_the_dashboard_click_on_sharing_on_the_side_menu_click_on_unix_shares(driver):
    """on the dashboard, click on Sharing on the side menu, click on Unix Shares."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Sharing"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Unix Shares (NFS)"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Unix Shares (NFS)"]').click()


@then('on the NFS page, click on the three-dot of any share and select Edit')
def on_the_nfs_page_click_on_the_threedot_of_any_share_and_select_edit(driver):
    """on the NFS page, click on the three-dot of any share and select Edit."""
    assert wait_on_element(driver, 7, '//div[contains(.,"NFS")]')
    assert wait_on_element(driver, 7, '//mat-icon[@ix-auto="options__/mnt/tank/nfs"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__/mnt/tank/nfs"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__edit_Edit"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__edit_Edit"]').click()


@then('on the Edit page, click Advanced Mode')
def on_the_edit_page_click_advanced_mode(driver):
    """on the Edit page, click Advanced Mode."""
    assert wait_on_element(driver, 7, '//li[contains(.,"Edit")]')
    assert wait_on_element(driver, 7, xpaths.button.advanced_options, 'clickable')
    driver.find_element_by_xpath(xpaths.button.advanced_options).click()


@then('input <client> ip in Authorized Hosts and IP')
def input_client_ip_in_authorized_hosts_and_ip(driver, client):
    """input <client> ip in Authorized Hosts and IP."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Authorized Hosts and IP addresses"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Authorized Hosts and IP addresses"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Authorized Hosts and IP addresses"]').send_keys(client)


@then('click Save, the nfs share should save without errors')
def click_save_the_nfs_share_should_save_without_errors(driver):
    """click Save, the nfs share should save without errors."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('try to mount the nfs share on from <client> with <password>')
def try_to_mount_the_nfs_share_on_from_client_with_password(driver, nas_ip, client, password):
    """try to mount the nfs share on from <client> with <password>."""
    global ip, passwd, mount_results
    ip = client
    passwd = password
    cmd = f'mkdir -p {mountpoint}'
    results = ssh_cmd(cmd, 'root', passwd, ip)
    assert results['result'], str(results)
    cmd = f'mount {nas_ip}:/mnt/tank/nfs {mountpoint}'
    mount_results = ssh_cmd(cmd, 'root', passwd, ip)


@then('the share should mount without errors on the client and umount')
def the_share_should_mount_without_errors_on_the_client_and_umount(driver):
    """the share should mount without errors on the client and umount."""
    assert mount_results['result'], str(mount_results)
    cmd = f'umount {mountpoint} && rm -rf {mountpoint}'
    results = ssh_cmd(cmd, 'root', passwd, ip)
    assert results['result'], str(results)


@then('on the NFS page, click on the three-dot of the same share and select Edit')
def on_the_nfs_page_click_on_the_threedot_of_the_same_share_and_select_edit(driver):
    """on the NFS page, click on the three-dot of the same share and select Edit."""
    assert wait_on_element(driver, 7, '//div[contains(.,"NFS")]')
    assert wait_on_element(driver, 7, '//mat-icon[@ix-auto="options__/mnt/tank/nfs"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__/mnt/tank/nfs"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__edit_Edit"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__edit_Edit"]').click()


@then('input <subnet> in Authorized Hosts and IP')
def input_subnet_in_authorized_hosts_and_ip(driver, subnet):
    """input <subnet> in Authorized Hosts and IP."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Authorized Hosts and IP addresses"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Authorized Hosts and IP addresses"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Authorized Hosts and IP addresses"]').send_keys(subnet)


@then('the mount should generate an access denied error')
def the_mount_should_generate_an_access_denied_error(driver):
    """the mount should generate an access denied error."""
    assert mount_results['result'] is False, str(mount_results)
    cmd = f'rm -rf {mountpoint}'
    results = ssh_cmd(cmd, 'root', passwd, ip)
    assert results['result'], str(results)
