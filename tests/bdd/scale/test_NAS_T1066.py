# coding=utf-8
"""SCALE UI feature tests."""

import xpaths

from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
)

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
import pytest
pytestmark = [pytest.mark.debug_test]


@pytest.mark.dependency(name='Set_Interface')
@scenario('features/NAS-T1066.feature', 'Set DNS and static IP')
def test_set_interface():
    """Set interface."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you see the dashboard click Network on the side menu')
def you_see_the_dashboard_click_network_on_the_side_menu(driver):
    """you see the dashboard click Network on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.network, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.network).click()


@when('the Network page will open, click Global Configuration Settings')
def the_network_page_will_open_click_global_configuration_settings(driver):
    """the Network page will open, click Global Configuration Settings."""
    assert wait_on_element(driver, 10, xpaths.network.title)
    assert wait_on_element(driver, 7, xpaths.network.globalConfigurationTitle)
    assert wait_on_element(driver, 10, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()


@then(parsers.parse('the global config page will open and input Nameservers "{nameserver1}", "{nameserver2}" and "{nameserver3}"'))
def the_global_config_page_will_open_and_input_nameservers(driver, nameserver1, nameserver2, nameserver3):
    """the global config page will open and input Nameservers "{nameserver1}", "{nameserver2}" and "{nameserver3}"."""
    assert wait_on_element(driver, 10, xpaths.globalConfiguration.title)
    assert wait_on_element(driver, 7, xpaths.globalConfiguration.nameserver1_input, 'inputable')
    driver.find_element_by_xpath(xpaths.globalConfiguration.nameserver1_input).clear()
    driver.find_element_by_xpath(xpaths.globalConfiguration.nameserver1_input).send_keys(nameserver1)
    driver.find_element_by_xpath(xpaths.globalConfiguration.nameserver2_input).clear()
    driver.find_element_by_xpath(xpaths.globalConfiguration.nameserver2_input).send_keys(nameserver2)
    driver.find_element_by_xpath(xpaths.globalConfiguration.nameserver3_input).clear()
    driver.find_element_by_xpath(xpaths.globalConfiguration.nameserver3_input).send_keys(nameserver3)


@then(parsers.parse('input gateway "{gateway}" and an hostname and click SAVE'))
def input_gateway_and_a_hostname_and_click_save(driver, nas_hostname, gateway):
    """input gateway "{gateway}" and an hostname and click SAVE."""
    driver.find_element_by_xpath(xpaths.globalConfiguration.ipv4_defaultGateway_input).clear()
    driver.find_element_by_xpath(xpaths.globalConfiguration.ipv4_defaultGateway_input).send_keys(gateway)
    driver.find_element_by_xpath(xpaths.globalConfiguration.hostname_input).clear()
    driver.find_element_by_xpath(xpaths.globalConfiguration.hostname_input).send_keys(nas_hostname)
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('"Please wait" should appear, changes should be saved without errors, the network page will reload')
def please_wait_should_appear_changes_should_be_saved_without_errors_the_network_page_will_reload(driver):
    """"Please wait" should appear, changes should be saved without errors, the network page will reload."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.network.title)


@then('click the interface field, uncheck dhcp and click add and enter IP and click Apply.')
def click_the_interface_field_uncheck_dhcp_and_click_add_and_enter_ip_and_click_apply(driver, nas_ip):
    """click the interface field, uncheck dhcp and click add and enter IP and click Apply.."""
    assert wait_on_element(driver, 7, xpaths.network.interface, 'clickable')
    driver.find_element_by_xpath(xpaths.network.interface).click()
    assert wait_on_element(driver, 7, xpaths.interface.title)
    assert wait_on_element(driver, 7, xpaths.interface.dhcp_checkbox, 'clickable')
    if attribute_value_exist(driver, xpaths.interface.dhcp_checkbox, 'class', 'mat-checkbox-checked'):
        driver.find_element_by_xpath(xpaths.interface.dhcp_checkbox).click()
    assert wait_on_element(driver, 7, xpaths.interface.add_allias, 'clickable')
    driver.find_element_by_xpath(xpaths.interface.add_allias).click()
    assert wait_on_element(driver, 7, xpaths.interface.ipAddress_input, 'clickable')
    driver.find_element_by_xpath(xpaths.interface.ipAddress_input).clear()
    driver.find_element_by_xpath(xpaths.interface.ipAddress_input).send_keys(nas_ip)
    driver.find_element_by_xpath(xpaths.interface.netmask_select).click()
    assert wait_on_element(driver, 10, xpaths.interface.netmask_option, 'clickable')
    driver.find_element_by_xpath(xpaths.interface.netmask_option).click()
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('"Please wait" should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """"Please wait" should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.network.title)
    assert wait_on_element(driver, 7, xpaths.network.interface, 'clickable')


@then('click Test Changes, check Confirm, click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver, nas_ip):
    """click Test Changes, check Confirm, click Test Changes again."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__testChange"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__testChange"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Test Changes")]')
    assert wait_on_element(driver, 7, xpaths.checkbox.old_confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_confirm).click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__TEST CHANGES"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__keepChange"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__keepChange"]').click()


@then('when Save Changes appear click the "Save Changes" button')
def when_save_changes_appear_click_the_save_changes_button(driver):
    """when Save Changes appear click the "Save Changes" button."""
    assert wait_on_element_disappear(driver, 65, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.network.title)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Save Changes")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('the changes should be successfully saved')
def the_changes_should_be_successfully_saved(driver):
    """the changes should be successfully saved."""
    assert wait_on_element(driver, 10, '//div[contains(.,"Network interface changes have been made permanent.")]')
    assert wait_on_element(driver, 10, xpaths.network.title)
    assert wait_on_element(driver, 7, xpaths.network.interface, 'clickable')
