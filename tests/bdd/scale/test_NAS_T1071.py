# coding=utf-8
"""SCALE UI feature tests."""

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
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1071.feature', 'Create pool with 1 disk')
def test_create_pool_with_1_disk():
    """Create pool with 2 disks."""


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
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard, click Storage on the side menu')
def you_should_be_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you should be on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@when('the pools page appears click create pool')
def the_pools_page_appears_click_create_pool(driver):
    """the pools page appears click create pool."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 10, '//a[@ix-auto="button___POOL_CREATE"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button___POOL_CREATE"]').click()


@then('the Pool Manager appears, enter the tank for pool name')
def the_pool_manager_appears_enter_the_tank_for_pool_name(driver):
    """the Pool Manager appears, enter the tank for pool name."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 10, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys('tank')


@then('click sdb checkbox, press the right arrow under Data VDevs')
def click_sdb_checkbox_press_the_right_arrow_under_data_vdevs(driver):
    """click sdb checkbox, press the right arrow under Data VDevs."""
    assert wait_on_element(driver, 5, '//datatable-body[contains(.,"sd")]//mat-checkbox[1]', 'clickable')
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


@then('you should be returned to the list of pools and tank should appear in the list')
def you_should_be_returned_to_the_list_of_pools_and_tank_should_appear_in_the_list(driver):
    """you should be returned to the list of pools and tank should appear in the list."""
    assert wait_on_element(driver, 7, '//div[contains(.,"tank")]')
