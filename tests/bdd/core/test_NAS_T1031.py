# coding=utf-8
"""Core UI feature tests."""


import time
from function import (
    wait_on_element,
    is_element_present,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)


@scenario('features/NAS-T1031.feature', 'Create iSCSI share with wizard and test the connection')
def test_create_iscsi_share_with_wizard_and_test_the_connection():
    """Create iSCSI share with wizard and test the connection."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 0.5, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 1, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 0.5, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 1, 7, '//a[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 0.5, 7, '//span[contains(.,"System Information")]')


@then('click on Sharing on the side menu and click Block Shares')
def click_on_sharing_on_the_side_menu_and_click_block_shares(driver):
    """click on Sharing on the side menu and click Block Shares."""
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Sharing"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]').click()


@then('the iSCSI page appear at the Target Global Configuration tab')
def the_iscsi_page_appear_at_the_target_global_configuration_tab(driver):
    """the iSCSI page appear at the Target Global Configuration tab."""
    assert wait_on_element(driver, 1, 7, '//a[contains(.,"iSCSI")]')
    assert wait_on_element(driver, 0.5, 7, '//h4[contains(.,"Global Configuration")]')


@then('click on Wizard, the Wizard should appear')
def click_on_wizard_the_wizard_should_appear(driver):
    """click on Wizard, the Wizard should appear."""
    driver.find_element_by_xpath('//button[@id="iscsi_wizard_action_button"]').click()
    assert wait_on_element(driver, 1, 7, '//a[contains(.,"Wizard")]')


@then('give the <share> a name and select Device as the Extent Type')
def give_the_share_a_name_and_select_device_as_the_extent_type(driver, share):
    """give the <share> a name and select Device as the Extent Type."""


@then('in the Device drop-down, select Create New')
def in_the_device_dropdown_select_create_new(driver):
    """in the Device drop-down, select Create New."""


@then('select a dataset, set the size to 50 MiB')
def select_a_dataset_set_the_size_to_50_mib(driver):
    """select a dataset, set the size to 50 MiB."""


@then('select a platform from the Sharing Platform drop-down, then click NEXT.')
def select_a_platform_from_the_sharing_platform_dropdown_then_click_next(driver):
    """select a platform from the Sharing Platform drop-down, then click NEXT.."""


@then('In the Portal drop-down, select Create New and set the IP Address to 0.0.0.0.')
def in_the_portal_dropdown_select_create_new_and_set_the_ip_address_to_0000(driver):
    """In the Portal drop-down, select Create New and set the IP Address to 0.0.0.0.."""


@then('Click NEXT twice, then click Submit. Enable the service if prompted')
def click_next_twice_then_click_submit_enable_the_service_if_prompted(driver):
    """Click NEXT twice, then click Submit. Enable the service if prompted."""


@then('ssh to <host> with <password> and enter iscsictl -A -t <basename>:<share> -p NAS IP')
def ssh_to_host_with_password_and_enter_iscsictl_a_t_basenameshare_p_nas_ip(driver, nas_ip, host, password, basename, share):
    """ssh to <host> with <password> and enter iscsictl -A -t <basename>:<share> -p NAS IP."""
    # global hst, passwd, share
    # hst = host
    # passwd = password
    # cmd = f'iscsictl -A -p {nas_ip}:3260 -t {basename}:{share}'
    # login_results = ssh_cmd(cmd, 'root', passwd, hst)
    # assert login_results['result'], str(login_results)


@then('enter iscsictl -L verify that the target is connected')
def enter_iscsictl_l_verify_that_the_target_is_connected(driver, nas_ip):
    """enter iscsictl -L verify that the target is connected."""
    # for num in list(range(15)):
    #     cmd = f'iscsictl -L | grep {nas_ip}:3260'
    #     iscsictl_results = ssh_cmd(cmd, 'root', passwd, hst)
    #     assert iscsictl_results['result'], str(iscsictl_results)
    #     iscsictl_list = iscsictl_results['output'].strip().split()
    #     if iscsictl_list[2] == "Connected:":
    #         assert True
    #         break
    #     time.sleep(3)
    # else:
    #     assert False, str(iscsictl_results)
