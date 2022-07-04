# coding=utf-8
"""SCALE UI: feature tests."""

import time
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


@scenario('features/NAS-T1102.feature', 'Creating new pool and set it as a system dataset')
def test_creating_new_pool_and_set_it_as_a_system_dataset():
    """Creating new pool and set it as a system dataset."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard, click Storage on the side menu')
def you_should_be_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you should be on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@when('the pools page appears click create pool')
def the_pools_page_appears_click_create_pool(driver):
    """the pools page appears click create pool."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 10, '//a[@ix-auto="button___POOL_CREATE"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button___POOL_CREATE"]').click()


@then('the Pool Manager appears, enter the system for pool name')
def the_pool_manager_appears_enter_the_system_for_pool_name(driver):
    """the Pool Manager appears, enter the system for pool name."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 10, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys('system')


@then('click sdc checkbox, press the right arrow under Data VDevs')
def click_sdc_checkbox_press_the_right_arrow_under_data_vdevs(driver):
    """click sdc checkbox, press the right arrow under Data VDevs."""
    assert wait_on_element(driver, 7, '//datatable-body[contains(.,"sd")]//mat-checkbox[1]', 'clickable')
    driver.find_element_by_xpath('//datatable-body[contains(.,"sd")]//mat-checkbox[1]').click()
    assert wait_on_element(driver, 5, '//button[@id="vdev__add-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()


@then('click create, On the Warning widget, click confirm checkbox, click CREATE POOL')
def click_create_on_the_warning_widget_click_confirm_checkbox_click_create_pool(driver):
    """click create, On the Warning widget, click confirm checkbox, click CREATE POOL."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//button[@id="pool-manager__create-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="pool-manager__create-button"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('Create pool should appear while pool is being created')
def create_pool_should_appear_while_pool_is_being_created(driver):
    """Create pool should appear while pool is being created."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element_disappear(driver, 120, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')


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
    element = driver.find_element_by_xpath('//h3[contains(text(),"System Dataset Pool")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Warning")]')
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
    assert wait_on_element(driver, 10, '//mat-option[@role="option"]//span[contains(.,"system")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@role="option"]//span[contains(.,"system")]').click()
    assert wait_on_element(driver, 30, '//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]').click()


@then('Please wait should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 30, '//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]')
