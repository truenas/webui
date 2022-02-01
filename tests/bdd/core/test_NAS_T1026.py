# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1026.feature', 'Create an iSCSI share without Authorized Access with a zvol')
def test_create_an_iscsi_share_without_authorized_access_with_a_zvol(driver):
    """Create an iSCSI share without Authorized Access with a zvol."""


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


@then('click on the Portals tab, click on the three-dot button of the portal')
def click_on_the_portals_tab_click_on_the_threedot_button_of_the_portal(driver):
    """click on the Portals tab, click on the three-dot button of the portal."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Portals"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Portals")]')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__1"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__edit_Edit"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__edit_Edit"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic Info")]')


@then(parsers.parse('change the Description for "{description}"'))
def change_the_description_for_my_no_authorized_access_portal(driver, description):
    """change the Description for "my no Authorized Access portal"."""
    global portal_desc
    portal_desc = description
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)


@then(parsers.parse('select "{method}" in Discovery Auth Method'))
def select_none_in_discovery_auth_method(driver, method):
    """select "NONE" in Discovery Auth Method."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Discovery Authentication Method"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Discovery Authentication Method_{method}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Discovery Authentication Method_{method}"]').click()
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Discovery Authentication Group"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Discovery Authentication Group"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Discovery Authentication Group_---"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Discovery Authentication Group_---"]').click()


@then('click Save, you should be returned to the Portals tab')
def click_save_you_should_be_returned_to_the_portals_tab(driver):
    """click Save, you should be returned to the Portals tab."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Portals")]')


@then('the portal should remain in the Portals list')
def the_portal_should_remain_in_the_portals_list(driver):
    """the portal should remain in the Portals list."""
    assert wait_on_element(driver, 7, f'//span[contains(.,"{portal_desc}")]')


@then('click on the Targets tab, then click Add')
def click_on_the_targets_tab_then_click_add(driver):
    """click on the Targets tab, then click Add."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Targets"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Targets")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic Info")]')


@then(parsers.parse('input {name} in Target name, input {alias} in Target alias'))
def input_noauth1_in_target_name_input_noauth1_in_target_alias(driver, name, alias):
    """input noauth1 in Target name, input noauth1 in Target alias."""
    global target_name
    target_name = name
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Name"]').send_keys(name)
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Alias"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Alias"]').send_keys(alias)


@then(parsers.parse('select "{portal_group}" in Portal Group ID'))
def select_1_my_no_peer_iscsi_share_in_portal_group_id(driver, portal_group):
    """select "1 (my no peer iscsi share)" in Portal Group ID."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Portal Group ID"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Portal Group ID"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Portal Group ID_{portal_group}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Portal Group ID_{portal_group}"]').click()


@then(parsers.parse('select "{initiator_group}" in Initiator Group ID'))
def select_1_all_initiators_allowed_in_initiator_group_id(driver, initiator_group):
    """select "1 (ALL Initiators Allowed)" in Initiator Group ID."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Initiator Group ID"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Initiator Group ID_{initiator_group}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Initiator Group ID_{initiator_group}"]').click()


@then(parsers.parse('select "{method}" in Auth Method'))
def select_none_in_auth_method(driver, method):
    """select "None" in Auth Method."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Authentication Method"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Authentication Method_{method}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Authentication Method_{method}"]').click()


@then('click Submit, you should be returned to the Targets tab')
def click_submit_you_should_be_returned_to_the_targets_tab(driver):
    """click Submit, you should be returned to the Targets tab."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Targets")]')


@then('the new target should be on the Targets list')
def the_new_target_should_be_on_the_targets_list(driver):
    """the new target should be on the Targets list."""
    assert wait_on_element(driver, 7, f'//span[contains(.,"{target_name}")]')


@then('click on the Extents tab, then click Add')
def click_on_the_extents_tab_then_click_add(driver):
    """click on the Extents tab, then click Add."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Extents"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Extents")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic Info")]')


@then(parsers.parse('input {name} in Extent name, select {extent_type} in Extent Type'))
def input_noauth1_in_extent_name_select_file_in_extent_type(driver, name, extent_type):
    """input noauth1 in Extent name, select File in Extent Type."""
    global extent_name
    extent_name = name
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(name)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Extent Type"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Extent Type_{extent_type}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Extent Type_{extent_type}"]').click()


@then(parsers.parse('select "{device}" in Device'))
def select_tanknopeer1_100g_in_device(driver, device):
    """select "tank/nopeer1 (1.00G)" in Device."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Device"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Device_{device}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Device_{device}"]').click()


@then('click Submit, you should be returned to the Extents tab')
def click_submit_you_should_be_returned_to_the_extents_tab(driver):
    """click Submit, you should be returned to the Extents tab."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Extents")]')


@then('the new extent should be on the Extents list')
def the_new_extent_should_be_on_the_extents_list(driver):
    """the new extent should be on the Extents list."""
    assert wait_on_element(driver, 7, f'//div[contains(.,"{extent_name}")]')


@then('click on the Associated Targets tab, then click Add')
def click_on_the_associated_targets_tab_then_click_add(driver):
    """click on the Associated Targets tab, then click Add."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Associated Targets"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Associated Targets")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Associated Target")]')


@then(parsers.parse('select {target} in Target, input {lun_id} in LUN ID, select {extent} in Extent'))
def select_nopeer1_in_target_input_1_in_lun_id_select_nopeer1_in_extent(driver, target, lun_id, extent):
    """select nopeer1 in Target, input 1 in LUN ID, select nopeer1 in Extent."""
    global target_name
    target_name = target
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Target"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Target_{target}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Target_{target}"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__LUN ID"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__LUN ID"]').send_keys(lun_id)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Extent"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Extent_{extent}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Extent_{extent}"]').click()


@then('click Submit, you should be returned to the Associated Targets tab')
def click_submit_you_should_be_returned_to_the_associated_targets_tab(driver):
    """click Submit, you should be returned to the Associated Targets tab."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Associated Targets")]')


@then('the new associated target should be on the Associated Targets list')
def the_new_associated_target_should_be_on_the_associated_targets_list(driver):
    """the new associated target should be on the Associated Targets list."""
    assert wait_on_element(driver, 7, f'//div[contains(.,"{target_name}")]')
