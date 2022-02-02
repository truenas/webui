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
)


@scenario('features/NAS-T985.feature', 'Create a pool call tank')
def test_create_a_pool_call_tank_with_2_disk(driver):
    """Create a pool call tank with 2 disk."""


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


@then('click Storage on the side menu and click Pools')
def click_storage_on_the_side_menu_and_click_pools(driver):
    """click Storage on the side menu and click Pools."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('when the Pools page appears, click Add')
def when_the_pools_page_appears_click_add(driver):
    """when the Pools page appears, click Add."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()


@then('select Create new pool Click create pool')
def select_create_new_pool_click_create_pool(driver):
    """select Create new pool Click create pool."""
    assert wait_on_element(driver, 7, '//label[contains(.,"Create a pool:")]')
    driver.find_element_by_xpath('//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('when the Pool Manager appears, enter the tank for pool name')
def when_the_pool_manager_appears_enter_the_tank_for_pool_name(driver):
    """when the Pool Manager appears, enter the tank for pool name."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys('tank')


@then('click ada1 checkbox, press the right arrow under Data VDevs')
def click_ada1_checkbox_press_the_right_arrow_under_data_vdevs(driver):
    """click ada1 checkbox, press the right arrow under Data VDevs."""
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__disks-ada1"]').click()
    assert wait_on_element(driver, 7, '//button[@id="vdev__add-button"]')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('click create, On the Warning widget, click confirm checkbox, click CREATE POOL')
def click_create_on_the_warning_widget_click_confirm_checkbox_click_create_pool(driver):
    """click create, On the Warning widget, click confirm checkbox, click CREATE POOL."""
    assert wait_on_element(driver, 7, '//button[@name="create-button"]')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('Create pool should appear while pool is being created')
def create_pool_should_appear_while_pool_is_being_created(driver):
    """Create pool should appear while pool is being created."""
    assert wait_on_element_disappear(driver, 20, '//h1[contains(.,"Create Pool")]')


@then('you should be returned to the list of pools')
def you_should_be_returned_to_the_list_of_pools(driver):
    """you should be returned to the list of pools."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('the tank should appear in the list')
def the_tank_should_appear_in_the_list(driver):
    """the tank should appear in the list."""
    assert wait_on_element(driver, 7, '//mat-panel-title[contains(.,"tank")]')
    assert wait_on_element(driver, 7, '//td[@ix-auto="value__tank_name"]')
