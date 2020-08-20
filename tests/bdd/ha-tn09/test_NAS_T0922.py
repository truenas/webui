# coding=utf-8
"""High Availability (tn09) feature tests."""
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


@scenario('features/NAS-T922.feature', 'Verify vlan1043 with lagg0 parrent interface MTU can be change to 9000')
def test_verify_vlan1043_with_lagg0_parrent_interface_mtu_can_be_change_to_9000(driver):
    """Verify vlan1043 with lagg0 parrent interface MTU can be change to 9000."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"{nas_url}/ui/sessions/signin")
        time.sleep(5)


@when(parsers.parse('login appear enter "{user}" and "{password}"'))
def login_appear_enter_root_and_password(driver, user, password):
    """login appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 1, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 0.5, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('you should see the dashboard')
def you_should_see_the_dashboard(driver):
    """you should see the dashboard."""
    assert wait_on_element(driver, 0.5, 7, '//span[contains(.,"System Information")]')


@then('navigate to System then to Failover')
def navigate_to_system_then_to_failover(driver):
    """navigate to System then to Failover."""
    # make sure to scroll back up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Failover"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Failover"]').click()


@then('the Failover Page should open')
def the_failover_page_should_open(driver):
    """the Failover Page should open."""
    assert wait_on_element(driver, 0.5, 7, '//h4[contains(.,"Failover Configuration")]')


@then('check disable failover and click save Check confirm on the warning dialog and press OK')
def check_disable_failover_and_click_save_check_confirm_on_the_warning_dialog_and_press_ok(driver):
    """check disable failover and click save Check confirm on the warning dialog and press OK."""
    element = driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]')
    class_attribute = element.get_attribute('class')
    if 'mat-checkbox-checked' not in class_attribute:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    if 'mat-checkbox-checked' not in class_attribute:
        assert wait_on_element(driver, 0.5, 4, '//h1[contains(.,"Disable Failover")]')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        driver.find_element_by_xpath('//button[@ix-auto="button__OK"]').click()


@then('a dialog should appear while applying settings')
def a_dialog_should_appear_while_applying_settings(driver):
    """a dialog should appear while applying settings."""
    assert wait_on_element_disappear(driver, 1, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Settings saved")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('navigate to Network then to Interfaces')
def navigate_to_network_then_to_interfaces(driver):
    """navigate to Network then to Interfaces."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Interfaces"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Interfaces"]').click()


@then('the interface page should open.')
def the_interface_page_should_open(driver):
    """the interface page should open.."""
    assert wait_on_element(driver, 0.5, 7, '//div[contains(.,"Interfaces")]')


@then('click on the lagg0 angle bracket, then click edit')
def click_on_lagg0_angle_bracket_then_click_edit(driver):
    """click on the lagg0 angle bracket, then click edit."""
    assert wait_on_element(driver, 0.5, 5, '//a[@ix-auto="expander__lagg0"]')
    driver.find_element_by_xpath('//a[@ix-auto="expander__lagg0"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__EDIT_lagg0_lagg0"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_lagg0_lagg0"]').click()


@then('lagg0 Interface Settings should appear')
def lagg0_interface_settings_should_appear(driver):
    """lagg0 Interface Settings should appear."""
    assert wait_on_element(driver, 0.5, 7, '//h4[contains(.,"Interface Settings")]')


@then('set mtu to 9000 and Click Apply')
def set_mtu_to_9000_and_click_apply(driver):
    """set mtu to 9000 and Click Apply."""
    assert wait_on_element(driver, 0.5, 5, '//input[@ix-auto="input__MTU"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__MTU"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__MTU"]').send_keys()
    assert wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__APPLY"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__APPLY"]').click()


@then('"Please wait" should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """"Please wait" should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 1, 30, '//h6[contains(.,"Please wait")]')


@then('click Test Changes, check Confirm, Click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver):
    """click Test Changes, check Confirm, Click Test Changes again."""
    assert wait_on_element(driver, 0.5, 5, '//button[contains(.,"TEST CHANGES")]')
    driver.find_element_by_xpath('//button[contains(.,"TEST CHANGES")]').click()
    assert wait_on_element(driver, 0.5, 5, '//h1[contains(.,"Test Changes")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()


@then('click Save Changes, Click Save')
def click_save_changes_click_save(driver):
    """click Save Changes, Click Save."""
    assert wait_on_element(driver, 0.5, 5, '//button[contains(.,"SAVE CHANGES")]')
    driver.find_element_by_xpath('//button[contains(.,"SAVE CHANGES")]').click()
    assert wait_on_element(driver, 0.5, 5, '//h1[contains(.,"Save Changes")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('a message indicating that network changes have been applied should appeared, and you should be able to close')
def a_message_indicating_that_network_changes_have_been_applied_should_appeared_and_you_should_be_able_to_close(driver):
    """a message indicating that network changes have been applied should appeared, and you should be able to close."""
    assert wait_on_element(driver, 0.5, 5, '//h1[contains(.,"Changes Saved")]')
    assert wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__CLOSE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('click on the vlan1043 angle bracket, then click edit')
def click_on_vlan1043_angle_bracket_then_click_edit(driver):
    """click on the vlan1043 angle bracket, then click edit."""
    assert wait_on_element(driver, 0.5, 5, '//div[contains(.,"Interfaces")]')
    driver.find_element_by_xpath('//a[@ix-auto="expander__vlan1043"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__EDIT_vlan1043_vlan1043"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_vlan1043_vlan1043"]').click()


@then('vlan1043 Interface Settings should appear')
def vlan1043_interface_settings_should_appear(driver):
    """vlan1043 Interface Settings should appear."""
    assert wait_on_element(driver, 0.5, 7, '//h4[contains(.,"Interface Settings")]')


@then('uncheck disable failover and click save Check confirm on the warning dialog and press OK')
def uncheck_disable_failover_and_click_save_check_confirm_on_the_warning_dialog_and_press_ok(driver):
    """uncheck disable failover and click save Check confirm on the warning dialog and press OK."""
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then(parsers.parse('logout and log back in with "{user}" and "{password}"'))
def logout_and_log_back_in(driver, user, password):
    """logout and log back in with "{user}" and "{password}"."""
    # make sure to scroll back up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__power"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__power"]').click()
    assert wait_on_element(driver, 0.5, 5, '//button[@ix-auto="option__Log Out"]')
    driver.find_element_by_xpath('//button[@ix-auto="option__Log Out"]').click()
    time.sleep(4)
    assert wait_on_element(driver, 1, 5, '//input[@placeholder="Username"]')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
    assert wait_on_element(driver, 0.5, 5, '//button[@name="signin_button"]')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('you should be able to log in.')
def you_should_be_able_to_log_in(driver):
    """you should be able to log in."""
    assert wait_on_element(driver, 0.5, 10, '//span[contains(.,"System Information")]')


@then(parsers.parse('verify both "{serial1}" and "{serial2}" controllers are on dashboard'))
def verify_both_controllers_are_on_dashboard(driver, serial1, serial2):
    """verify both "{serial1}" and "{serial2}" controllers are on dashboard."""
    assert wait_on_element(driver, 1, 60, f'//span[contains(.,"{serial1}")]')
    assert wait_on_element(driver, 1, 90, f'//span[contains(.,"{serial2}")]')


@then('HA status icon should appear and it should reflect that HA is enabled when clicked')
def ha_status_icon_should_appear_and_it_should_reflect_that_ha_is_enabled_when_clicked(driver):
    """HA status icon should appear and it should reflect that HA is enabled when clicked."""
    assert wait_on_element(driver, 1, 5, '//button[@ix-auto="button__haStatus"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__haStatus"]').click()
    assert wait_on_element(driver, 0.5, 5, '//h1[contains(.,"HA Enabled")]')
    driver.find_element_by_xpath('//span[contains(.,"HA is enabled")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
