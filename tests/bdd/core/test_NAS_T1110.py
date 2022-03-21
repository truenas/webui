# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)
import pytest

pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1110.feature', 'Verify the tarsnap plugin functions')
def test_verify_the_tarsnap_plugin_functions(driver):
    """Verify the tarsnap plugin functions."""
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
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click on Plugins on the left sidebar')
def on_the_dashboard_click_on_plugins_on_the_left_sidebar(driver):
    """on the Dashboard, click on Plugins on the left sidebar."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Plugins"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Plugins"]').click()


@then('on the Plugins page, Tarsnap should be available to install')
def on_the_plugins_page_tarsnap_should_be_available_to_install(driver):
    """on the Plugins page, Tarsnap should be available to install."""
    assert wait_on_element(driver, 5, '//div[text()="Plugins"]')
    assert wait_on_element(driver, 5, '//mat-button-toggle[@ix-auto="button__Tarsnap"]/button', 'clickable')


@then('click on the Tarsnap plugin, then click INSTALL')
def click_on_the_tarsnap_plugin_then_click_install(driver):
    """click on the Tarsnap plugin, then click INSTALL."""
    driver.find_element_by_xpath('//mat-button-toggle[@ix-auto="button__Tarsnap"]/button').click()
    assert wait_on_element(driver, 5, '//img[@alt="Tarsnap"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__INSTALL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__INSTALL"]').click()


@then('under Jail Name, enter "tarsnaptest", and DHCP should be checked')
def under_jail_name_enter_tarsnaptest_and_dhcp_should_be_checked(driver):
    """under Jail Name, enter "tarsnaptest", and DHCP should be checked."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Add")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Jail Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Jail Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Jail Name"]').send_keys('tarsnaptest')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__NAT"]')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__NAT"]', 'class', 'mat-checkbox-checked')


@then('click SAVE, then an Install window should be visible outlining progress')
def click_save_then_an_install_window_should_be_visible_outlining_progress(driver):
    """click SAVE, then an Install window should be visible outlining progress."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(text(),"Install")]')
    assert wait_on_element_disappear(driver, 1800, '//h1[contains(text(),"Install")]')


@then('when Plugin installed successfully appear, click CLOSE')
def when_plugin_installed_successfully_appear_click_close(driver):
    """when Plugin installed successfully appear, click CLOSE."""
    assert wait_on_element(driver, 20, '//h1[text()="Plugin installed successfully"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('after the Tarsnap plugin should be in the table')
def after_the_tarsnap_plugin_should_be_in_the_table(driver):
    """after the Tarsnap plugin should be in the table."""
    assert wait_on_element(driver, 20, '//datatable-body-row[contains(.,"tarsnaptest")]')


@then('status should be "up", with the Boot option checked')
def status_should_be_up_with_the_boot_option_checked(driver):
    """status should be "up", with the Boot option checked."""
    assert wait_on_element(driver, 20, '//div[contains(@id,"tarsnaptest_Status")]//span[text()="up"]')
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@id,"tarsnaptest_Boot-checkbox")]')
    assert attribute_value_exist(driver, '//mat-checkbox[contains(@id,"tarsnaptest_Boot-checkbox")]', 'class', 'mat-checkbox-checked')


@then('at the right of the plugin table, click the ">"')
def at_the_right_of_the_plugin_table_click_the_(driver):
    """at the right of the plugin table, click the ">"."""
    assert wait_on_element(driver, 5, '//a[@ix-auto="expander__tarsnaptest"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__tarsnaptest"]').click()


@then('these options will be shown (Restart/Stop/Update/Mount Points/Uninstall/POST INSTALL NOTES)')
def these_options_will_be_shown_restart_stop_update_mount_points_uninstall_post_install_notes(driver):
    """these options will be shown (Restart/Stop/Update/Mount Points/Uninstall/POST INSTALL NOTES)."""
    assert wait_on_element(driver, 5, '//button[@id="action_button_tarsnaptest__restart"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_tarsnaptest__stop"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_tarsnaptest__update"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_tarsnaptest__mount"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_tarsnaptest__delete"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_tarsnaptest__postinstall"]')
