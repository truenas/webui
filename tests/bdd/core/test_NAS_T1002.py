# coding=utf-8
"""Core UI feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
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
import pytest

pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1002.feature', 'Creating new pool and set it as a system dataset')
def test_creating_new_pool_and_set_it_as_a_system_dataset(driver):
    """Creating new pool and set it as a system dataset."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
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


@when('you see the dashboard')
def you_see_the_dashboard(driver):
    """you see the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click Storage on the side menu and click Pools')
def click_storage_on_the_side_menu_and_click_pools(driver):
    """click Storage on the side menu and click Pools."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('when the Pools page appears, click Add')
def when_the_pools_page_appears_click_add(driver):
    """when the Pools page appears, click Add."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button___ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//label[contains(.,"Create a pool:")]')


@then('select Create new pool and click CREATE POOL')
def select_create_new_pool_and_click_create_pool(driver):
    """select Create new pool and click CREATE POOL."""
    assert wait_on_element(driver, 7, '//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]', 'clickable')
    driver.find_element_by_xpath('//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('when the Pool Manager page open, input "system" for pool name')
def when_the_pool_manager_page_open_input_system_for_pool_name(driver):
    """when the Pool Manager page open, input "system" for pool name."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 7, '//input[@placeholder="Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys('system')


@then('click the checkbox next to ada3, and press the right arrow under data vdev, click create')
def click_the_checkbox_next_to_ada3_and_press_the_right_arrow_under_data_vdev_click_create(driver):
    """click the checkbox next to ada3, and press the right arrow under data vdev, click create."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__disks-ada3"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__disks-ada3"]').click()
    assert wait_on_element(driver, 7, '//button[@id="vdev__add-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 7, '//button[@name="create-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()


@then('click the Confirm checkbox, click CREATE POOL')
def click_the_confirm_checkbox_click_create_pool(driver):
    """click the Confirm checkbox, click CREATE POOL."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('the Create Pool widget should appear while the pool is being created')
def the_create_pool_widget_should_appear_while_the_pool_is_being_created(driver):
    """the Create Pool widget should appear while the pool is being created."""
    assert wait_on_element_disappear(driver, 20, '//h1[contains(.,"Create Pool")]')


@then('when completed, you should be on the Pools page')
def when_completed_you_should_be_on_the_pools_page(driver):
    """when completed, you should be on the Pools page."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('the system Pool should be in the pools list')
def the_system_pool_should_be_in_the_pools_list(driver):
    """the system Pool should be in the pools list."""
    assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"system")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__system_name"]')


@then('click Systems on the side menu and click System Dataset')
def click_systems_on_the_side_menu_and_click_system_dataset(driver):
    """click Systems on the side menu and click System Dataset."""
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System Dataset"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Dataset"]').click()


@then('when the System Dataset page appears, click on System Dataset Pool')
def when_the_system_dataset_page_appears_click_on_system_dataset_pool(driver):
    """when the System Dataset page appears, click on System Dataset Pool."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Configure System Dataset")]')
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__System Dataset Pool"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__System Dataset Pool"]').click()


@then('select system, and click Save')
def select_system_and_click_save(driver):
    """select system, and click Save."""
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__System Dataset Pool_system"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__System Dataset Pool_system"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Please wait should appear without errors')
def please_wait_should_appear_without_errors(driver):
    """Please wait should appear without errors."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[text()="Settings saved."]')
