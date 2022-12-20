# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@pytest.mark.dependency(name='system_pool')
@scenario('features/NAS-T1102.feature', 'Creating new pool and set it as a system dataset')
def test_creating_new_pool_and_set_it_as_a_system_dataset():
    """Creating new pool and set it as a system dataset."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['tank_pool'], scope='session')
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


@when('you should be on the dashboard, click Storage on the side menu')
def you_should_be_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you should be on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@when('the pools page appears click create pool')
def the_pools_page_appears_click_create_pool(driver):
    """the pools page appears click create pool."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 10, xpaths.storage.create_pool_button, 'clickable')
    driver.find_element_by_xpath(xpaths.storage.create_pool_button).click()


@then('the Pool Manager appears, enter the system for pool name')
def the_pool_manager_appears_enter_the_system_for_pool_name(driver):
    """the Pool Manager appears, enter the system for pool name."""
    assert wait_on_element(driver, 7, xpaths.pool_manager.title)
    assert wait_on_element(driver, 10, xpaths.pool_manager.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.pool_manager.name_input).send_keys('system')


@then('click sdc checkbox, press the right arrow under Data VDevs')
def click_sdc_checkbox_press_the_right_arrow_under_data_vdevs(driver):
    """click sdc checkbox, press the right arrow under Data VDevs."""
    assert wait_on_element(driver, 7, xpaths.pool_manager.firstDisk_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.firstDisk_checkbox).click()
    assert wait_on_element(driver, 5, xpaths.pool_manager.vdevAdd_button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.vdevAdd_button).click()
    assert wait_on_element(driver, 7, xpaths.pool_manager.force_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.force_checkbox).click()


@then('click create, On the Warning widget, click confirm checkbox, click CREATE POOL')
def click_create_on_the_warning_widget_click_confirm_checkbox_click_create_pool(driver):
    """click create, On the Warning widget, click confirm checkbox, click CREATE POOL."""
    assert wait_on_element(driver, 10, xpaths.pool_manager.warning_box_title)
    assert wait_on_element(driver, 7, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()
    assert wait_on_element(driver, 5, xpaths.pool_manager.create_button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.create_button).click()
    assert wait_on_element(driver, 10, xpaths.pool_manager.warning_box_title)
    assert wait_on_element(driver, 7, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 7, xpaths.pool_manager.create_pool_button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.create_pool_button).click()


@then('Create pool should appear while pool is being created')
def create_pool_should_appear_while_pool_is_being_created(driver):
    """Create pool should appear while pool is being created."""
    assert wait_on_element(driver, 10, xpaths.pool_manager.create_pool_popup)
    assert wait_on_element_disappear(driver, 120, xpaths.pool_manager.create_pool_popup)
    assert wait_on_element(driver, 10, xpaths.storage.title)


@then('the pools system should appear in the list')
def the_pools_system_should_appear_in_the_list(driver):
    """the pools system should appear in the list."""
    assert wait_on_element(driver, 7, '//div[contains(.,"system")]')


@then('navigate to System Setting and click Advanced to open the Advanced page should open')
def navigate_to_system_setting_and_click_advanced_to_open_the_advanced_page_should_open(driver):
    """navigate to System Setting and click Advanced to open the Advanced page should open."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System Settings"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Advanced"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Advanced"]').click()


@then('click on System Dataset Configure button and close the popup')
def click_on_system_dataset_configure_button_and_close_the_popup(driver):
    """click on System Dataset Configure button and close the popup."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Advanced")]')
    assert wait_on_element(driver, 7, '//h3[contains(text(),"System Dataset Pool")]')
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]').click()
    assert wait_on_element(driver, 5, xpaths.pool_manager.warning_box_title)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('click on System Dataset Pool select system, click Save')
def click_on_system_dataset_pool_select_system_click_save(driver):
    """click on System Dataset Pool select system, click Save."""
    assert wait_on_element(driver, 5, '//h3[contains(text(),"System Dataset Pool") and @class="ix-formtitle"]')
    assert wait_on_element(driver, 5, '//label[contains(text(),"Select Pool")]')
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//mat-select', 'clickable')
    driver.find_element_by_xpath('//mat-select').click()
    assert wait_on_element(driver, 5, '//mat-option[@role="option"]//span[contains(.,"system")]')
    driver.find_element_by_xpath('//mat-option[@role="option"]//span[contains(.,"system")]').click()
    assert wait_on_element(driver, 30, '//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]').click()


@then('Please wait should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 30, '//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]')
