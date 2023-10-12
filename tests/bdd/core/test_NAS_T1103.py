# coding=utf-8
"""Core UI feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
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


@scenario('features/NAS-T1103.feature', 'Verify the iconik plugin functions')
def test_verify_the_iconik_plugin_functions(driver):
    """Verify the iconik plugin functions."""
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


@when('on the Dashboard, click on Plugins on the left sidebar')
def on_the_dashboard_click_on_plugins_on_the_left_sidebar(driver):
    """on the Dashboard, click on Plugins on the left sidebar."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Plugins"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Plugins"]').click()


@then('when Choose Pool for Plugin and Jail Storage appears, select tank')
def when_choose_pool_for_plugin_and_jail_storage_appears_select_tank(driver):
    """when Choose Pool for Plugin and Jail Storage appears, select tank."""
    assert wait_on_element(driver, 10, '//div[text()="Plugins"]')
    if wait_on_element(driver, 2, '//h1[contains(.,"Choose Pool for Plugin and Jail Storage")]'):
        assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Choose a pool for plugin and jail storage."]', 'clickable')
        driver.find_element_by_xpath('//mat-select[@ix-auto="select__Choose a pool for plugin and jail storage."]').click()
        assert wait_on_element(driver, 5, '//mat-option[contains(.,"tank")]', 'clickable')
        driver.find_element_by_xpath('//mat-option[contains(.,"tank")]').click()


@then('click chose, then Pool Chosen will appear, click CLOSE')
def click_chose_then_pool_chosen_will_appear_click_close(driver):
    """click chose, then Pool Chosen will appear, click CLOSE."""
    if is_element_present(driver, '//h1[contains(.,"Choose Pool for Plugin and Jail Storage")]'):
        assert wait_on_element(driver, 5, '//button[@name="Choose_button"]', 'clickable')
        driver.find_element_by_xpath('//button[@name="Choose_button"]').click()
        assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
        assert wait_on_element(driver, 10, '//h1[contains(.,"Pool Chosen")]')
        assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('on the Plugins page, iconik should be available to install')
def on_the_plugins_page_iconik_should_be_available_to_install(driver):
    """on the Plugins page, iconik should be available to install."""
    assert wait_on_element(driver, 5, '//div[text()="Plugins"]')
    assert wait_on_element(driver, 5, '//mat-button-toggle[@ix-auto="button__Iconik"]/button', 'clickable')


@then('click on the iconik plugin, then click INSTALL')
def click_on_the_iconik_plugin_then_click_install(driver):
    """click on the iconik plugin, then click INSTALL."""
    driver.find_element_by_xpath('//mat-button-toggle[@ix-auto="button__Iconik"]/button').click()
    assert wait_on_element(driver, 5, '//img[@alt="Iconik"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__INSTALL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__INSTALL"]').click()


@then('under Jail Name, enter "iconiktest", and NAT should be checked')
def under_jail_name_enter_iconiktest_and_nat_should_be_checked(driver):
    """under Jail Name, enter "iconiktest", and NAT should be checked."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Add")]')
    assert wait_on_element(driver, 10, '//input[@placeholder="Jail Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Jail Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Jail Name"]').send_keys('iconiktest')
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


@then('after iconik plugin should be in the table')
def after_iconik_plugin_should_be_in_the_table(driver):
    """after iconik plugin should be in the table."""
    assert wait_on_element(driver, 20, '//datatable-body-row[contains(.,"iconiktest")]')


@then('status should be "up", with the Boot option checked')
def status_should_be_up_with_the_boot_option_checked(driver):
    """status should be "up", with the Boot option checked."""
    assert wait_on_element(driver, 20, '//div[contains(@id,"iconiktest_Status")]//span[text()="up"]')
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@id,"iconiktest_Boot-checkbox")]')
    assert attribute_value_exist(driver, '//mat-checkbox[contains(@id,"iconiktest_Boot-checkbox")]', 'class', 'mat-checkbox-checked')


@then('at the right of the plugin table, click the ">"')
def at_the_right_of_the_plugin_table_click_the_(driver):
    """at the right of the plugin table, click the ">"."""
    assert wait_on_element(driver, 5, '//a[@ix-auto="expander__iconiktest"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="expander__iconiktest"]').click()


@then('these options will be shown (Restart/Stop/Update/Mount Points/Manage/Uninstall)')
def these_options_will_be_shown_restartstopupdatemount_pointsmanageuninstall(driver):
    """these options will be shown (Restart/Stop/Update/Mount Points/Manage/Uninstall)."""
    assert wait_on_element(driver, 5, '//button[@id="action_button_iconiktest__restart"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_iconiktest__stop"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_iconiktest__update"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_iconiktest__mount"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_iconiktest__management"]')
    assert wait_on_element(driver, 5, '//button[@id="action_button_iconiktest__delete"]')


@then('click the "Manage" option')
def click_the_manage_option(driver):
    """click the "Manage" option."""
    assert wait_on_element(driver, 5, '//button[@id="action_button_iconiktest__management"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button_iconiktest__management"]').click()
    time.sleep(1)


@then('a new tab or window should load the Iconik Credentials page')
def a_new_tab_or_window_should_load_the_iconik_credentials_page(driver):
    """A new tab or window should load the Iconik Credentials page."""
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 5, '//h1[contains(.,"Iconik Credentials")]')
    assert wait_on_element(driver, 5, '//input[@value="Update credentials"]')
    driver.close()
    driver.switch_to.window(driver.window_handles[0])
    assert wait_on_element(driver, 5, '//div[text()="Plugins"]')
