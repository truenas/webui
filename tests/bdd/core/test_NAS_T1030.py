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
    when
)


@scenario('features/NAS-T1030.feature', 'Delete iSCSi portals, targets, extents, Associated Targets, Authorized Access and Initiators Groups')
def test_delete_iscsi_portals_targets_extents_associated_targets_authorized_access_and_initiators_groups(driver):
    """Delete iSCSi portals, targets, extents, Associated Targets, Authorized Access and Initiators Groups."""


@given("the browser is open on the TrueNAS URL and logged in")
def the_browser_is_open_on_the_TrueNAS_URL_and_logged_in(driver, nas_ip, root_password):
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


@when("you should be on the dashboard")
def you_should_be_on_the_dashboard(driver):
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then("click on Sharing on the side menu and click Block Shares")
def click_on_Sharing_on_the_side_menu_and_click_Block_Shares(driver):
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Sharing"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]').click()


@then("the iSCSI page appear at the Target Global Configuration tab")
def the_iSCSI_page_appear_at_the_Target_Global_Configuration_tab(driver):
    assert wait_on_element(driver, 7, '//a[contains(.,"iSCSI")]')
    assert wait_on_element(driver, 7, '//h4[contains(.,"Global Configuration")]')


@then("click on the Portals tab, the Portals tab should appear")
def click_on_the_Portals_tab_the_Portals_tab_should_appear(driver):
    driver.find_element_by_xpath('//a[@ix-auto="tab__Portals"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Portals")]')


@then("click on the portal three-dot button and click Delete")
def click_on_the_portal_three_dot_button_and_click_Delete(driver):
    assert wait_on_element(driver, 7, '//mat-icon[@ix-auto="options__1"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__1"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__delete_Delete"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__delete_Delete"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Delete")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__DELETE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')


@then("the portal should disappear from the Portals list")
def the_portal_should_disappear_from_the_Portals_list(driver):
    assert not is_element_present(driver, '//div[contains(.,"my no Authorized Access portal")]')


@then("click on the Initiators Group tab, the Initiators Group tab should appear")
def click_on_the_Initiators_Group_tab_the_Initiators_Group_tab_should_appear(driver):
    driver.find_element_by_xpath('//a[@ix-auto="tab__Initiators Groups"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Initiators Groups")]')


@then("click on the Initiators Group three-dot button and click Delete")
def click_on_the_Initiators_Group_three_dot_button_and_click_Delete(driver):
    assert wait_on_element(driver, 7, '//mat-icon[@ix-auto="options__1"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__1"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__delete_Delete"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__delete_Delete"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Delete")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__DELETE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')


@then("the initiator should disappear from the Initiators Group list")
def the_initiator_should_disappear_from_the_Initiators_Group_list(driver):
    assert not is_element_present(driver, '//span[contains(.,"No Pear Group 1")]')


@then("click on the Targets tab, the Targets tab should appear")
def click_on_the_Targets_tab_the_Targets_tab_should_appear(driver):
    driver.find_element_by_xpath('//a[@ix-auto="tab__Targets"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Targets")]')


@then("for all targets, click on the three-dot button and click Delete")
def for_all_targets_click_on_the_three_dot_button_and_click_Delete(driver):
    global targets_list
    targets_list = ['noauth2', 'noauth1', 'nopeer2', 'nopeer1']
    for target in targets_list:
        assert wait_on_element(driver, 7, f'//mat-icon[@ix-auto="options__{target}"]', 'clickable')
        driver.find_element_by_xpath(f'//mat-icon[@ix-auto="options__{target}"]').click()
        assert wait_on_element(driver, 7, f'//button[@ix-auto="action__{target}_Delete"]', 'clickable')
        driver.find_element_by_xpath(f'//button[@ix-auto="action__{target}_Delete"]').click()
        assert wait_on_element(driver, 7, '//h1[contains(.,"Delete")]')
        assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__DELETE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()
        assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')


@then("all targets should disappear from the Targets list")
def all_targets_should_disappear_from_the_Targets_list(driver):
    for target in targets_list:
        assert not is_element_present(driver, f'//div[@ix-auto="value__{target}_Target Name"]')


@then("click on the Extents tab, the Extents tab should appear")
def click_on_the_Extents_tab_the_Extents_tab_should_appear(driver):
    driver.find_element_by_xpath('//a[@ix-auto="tab__Extents"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Extents")]')


@then("for all extents, click on the three-dot button and click Delete")
def for_all_extents_click_on_the_three_dot_button_and_click_Delete(driver):
    for target in targets_list:
        assert wait_on_element(driver, 7, f'//mat-icon[@ix-auto="options__{target}"]', 'clickable')
        driver.find_element_by_xpath(f'//mat-icon[@ix-auto="options__{target}"]').click()
        assert wait_on_element(driver, 7, '//button[@ix-auto="action__delete_Delete"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="action__delete_Delete"]').click()
        assert wait_on_element(driver, 7, '//h1[contains(.,"Delete")]')
        assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Force"]', 'clickable')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Force"]').click()
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__DELETE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()
        assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')


@then("all extent should disappear from the Extents list")
def all_extent_should_disappear_from_the_Extents_list(driver):
    for target in targets_list:
        assert not is_element_present(driver, f'//div[@ix-auto="value__{target}_Extent Name""]')


@then("click on the Associated Targets tab, the Associated Targets tab should appear")
def click_on_the_Associated_Targets_tab_the_Associated_Targets_tab_should_appear(driver):
    driver.find_element_by_xpath('//a[@ix-auto="tab__Associated Targets"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Associated Targets")]')


@then("all associated target should be already deleted")
def all_associated_target_should_be_already_deleted(driver):
    for target in targets_list:
        assert not is_element_present(driver, f'//div[@ix-auto="value__{target}_Target"]')


@then("click on the Authorized Access tab, the Authorized Access tab should appear")
def click_on_the_Authorized_Access_tab_the_Authorized_Access_tab_should_appear(driver):
    driver.find_element_by_xpath('//a[@ix-auto="tab__Authorized Access"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Authorized Access")]')


@then("click on the Authorized Acces three-dot button and click Delete")
def click_on_the_Authorized_Acces_three_dot_button_and_click_Delete(driver):
    assert wait_on_element(driver, 7, '//mat-icon[@ix-auto="options__1"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__1"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__delete_Delete"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__delete_Delete"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Delete")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__DELETE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')


@then("the authorized access should disappear from the Authorized Access list")
def the_authorized_access_should_disappear_from_the_Authorized_Access_list(driver):
    assert not is_element_present(driver, '//span[contains(.,"nopeer")]')
