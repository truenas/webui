# coding=utf-8
"""Core UI feature tests."""


import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    ssh_cmd,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1031.feature', 'Create iSCSI share with wizard and test the connection')
def test_create_iscsi_share_with_wizard_and_test_the_connection():
    """Create iSCSI share with wizard and test the connection."""


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
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on Sharing on the side menu and click Block Shares')
def click_on_sharing_on_the_side_menu_and_click_block_shares(driver):
    """click on Sharing on the side menu and click Block Shares."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Sharing"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]').click()


@then('the iSCSI page appear at the Target Global Configuration tab')
def the_iscsi_page_appear_at_the_target_global_configuration_tab(driver):
    """the iSCSI page appear at the Target Global Configuration tab."""
    assert wait_on_element(driver, 7, '//a[contains(.,"iSCSI")]')
    assert wait_on_element(driver, 7, '//h4[contains(.,"Global Configuration")]')


@then('click on Wizard, the Wizard should appear')
def click_on_wizard_the_wizard_should_appear(driver):
    """click on Wizard, the Wizard should appear."""
    driver.find_element_by_xpath('//button[@id="iscsi_wizard_action_button"]').click()
    assert wait_on_element(driver, 7, '//a[contains(.,"Wizard")]')


@then('give the <share> a name and select Device as the Extent Type')
def give_the_share_a_name_and_select_device_as_the_extent_type(driver, share):
    """give the <share> a name and select Device as the Extent Type."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(share)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Extent Type"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Extent Type_Device"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Extent Type_Device"]').click()


@then('in the Device drop-down, select Create New')
def in_the_device_dropdown_select_create_new(driver):
    """in the Device drop-down, select Create New."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Device"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Device"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Device_Create New"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Device_Create New"]').click()


@then('select a dataset, set the size to 50 MiB')
def select_a_dataset_set_the_size_to_50_mib(driver):
    """select a dataset, set the size to 50 MiB."""
    driver.find_element_by_xpath('//span[@class="toggle-children"]').click()
    assert wait_on_element(driver, 7, '//span[@title="tank"]')
    driver.find_element_by_xpath('//span[@title="tank"]').click()
    # driver.find_element_by_xpath('//input[@ix-auto="input__dataset"]').send_keys('tank')
    driver.find_element_by_xpath('//input[@ix-auto="input__Size"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Size"]').send_keys('50')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option___MiB"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option___MiB"]').click()


@then('select a platform from the Sharing Platform drop-down, then click NEXT.')
def select_a_platform_from_the_sharing_platform_dropdown_then_click_next(driver):
    """select a platform from the Sharing Platform drop-down, then click NEXT.."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Sharing Platform"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Sharing Platform"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Sharing Platform_Modern OS: Extent block size 4k, TPC enabled, no Xen compat mode, SSD speed"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Sharing Platform_Modern OS: Extent block size 4k, TPC enabled, no Xen compat mode, SSD speed"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Create or Choose Block Device"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Create or Choose Block Device"]').click()


@then(parsers.parse('In the Portal drop-down, select Create New and set the IP Address to {ip}.'))
def in_the_portal_dropdown_select_create_new_and_set_the_ip_address_to_0000(driver, ip):
    """In the Portal drop-down, select Create New and set the IP Address to 0.0.0.0."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Portal"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Portal"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Portal_Create New"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Portal_Create New"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__IP Address"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__IP Address_{ip}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__IP Address_{ip}"]').click()


@then('Click NEXT twice, then click Submit. Enable the service if prompted')
def click_next_twice_then_click_submit_enable_the_service_if_prompted(driver):
    """Click NEXT twice, then click Submit. Enable the service if prompted."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Portal"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Portal"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Initiator"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Initiator"]').click()
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//h4[contains(.,"Global Configuration")]')


@then('ssh to <host> with <password> and enter iscsictl -A -t <basename>:<share> -p NAS IP')
def ssh_to_host_with_password_and_enter_iscsictl_a_t_basenameshare_p_nas_ip(driver, nas_ip, host, password, basename, share):
    """ssh to <host> with <password> and enter iscsictl -A -t <basename>:<share> -p NAS IP."""
    global hst, passwd, target
    hst = host
    passwd = password
    target = share
    cmd = f'iscsictl -A -p {nas_ip}:3260 -t {basename}:{share}'
    login_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert login_results['result'], str(login_results)


@then('enter iscsictl -L verify that the target is connected')
def enter_iscsictl_l_verify_that_the_target_is_connected(driver, nas_ip):
    """enter iscsictl -L verify that the target is connected."""
    for _ in list(range(15)):
        cmd = f'iscsictl -L | grep {nas_ip}:3260'
        iscsictl_results = ssh_cmd(cmd, 'root', passwd, hst)
        assert iscsictl_results['result'], str(iscsictl_results)
        iscsictl_list = iscsictl_results['output'].strip().split()
        if iscsictl_list[2] == "Connected:":
            assert True
            break
        time.sleep(3)
    else:
        assert False, str(iscsictl_results)
    cmd = f"iscsictl -R -t iqn.2005-10.org.freenas.ctl:{target}"
    remove_results = ssh_cmd(cmd, 'root', passwd, hst)
    assert remove_results['result'], str(remove_results)
