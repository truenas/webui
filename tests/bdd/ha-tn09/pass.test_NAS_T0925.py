# coding=utf-8
"""High Availability (tn09) feature tests."""

import time
from function import wait_on_element, is_element_present, wait_on_element_disappear
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T925.feature', 'Creating new pool and set it as System Dataset')
def test_creating_new_pool_and_set_it_as_system_dataset(driver):
    """Creating new pool and set it as System Dataset."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(3)


@when(parsers.parse('if login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_user_and_password(driver, user, password):
    """if login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 1, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 0.5, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('you should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """you should see the dashboard and "System Information"."""
    assert wait_on_element(driver, 0.5, 5, '//span[contains(.,"System Information")]')


@then('navigate to Storage click Pools')
def navigate_to_storage_click_pools(driver):
    """navigate to Storage click Pools."""

    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('the Pools page should open')
def the_pools_page_should_open(driver):
    """the Pools page should open."""
    assert wait_on_element(driver, 0.5, 5, '//div[contains(.,"Pools")]')


@then('click Add, select Create new pool and click CREATE POOL')
def click_add_select_create_new_pool_and_click_create_pool(driver):
    """click Add, select Create new pool and click CREATE POOL."""
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 0.5, 5, '//label[contains(.,"Create a pool:")]')
    driver.find_element_by_xpath('//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]').click()
    assert wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__CREATE POOL"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('the Pool Manager page should open')
def the_pool_manager_page_should_open(driver):
    """the Pool Manager page should open."""
    assert wait_on_element(driver, 0.5, 5, '//div[contains(.,"Pool Manager")]')


@then('enter dozer for pool name, check the box next to da1, press right arrow under data vdev, click create')
def enter_dozer_for_pool_name_check_the_box_next_to_da1_press_right_arrow_under_data_vdev_click_create(driver):
    """enter dozer for pool name, check the box next to da1, press right arrow under data vdev, click create."""
    driver.find_element_by_xpath('//input[@placeholder="Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys('dozer')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__disks-da1"]').click()
    assert wait_on_element(driver, 0.5, 5, '//button[@id="vdev__add-button"]')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 0.5, 5, '//button[@name="create-button"]')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()


@then('check confirm, click CREATE POOL')
def check_confirm_click_create_pool(driver):
    """check confirm, click CREATE POOL."""
    assert wait_on_element(driver, 0.5, 5, '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 0.5, 5, '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('Create Pool should appear while pool is being created.')
def create_pool_should_appear_while_pool_is_being_created(driver):
    """Create Pool should appear while pool is being created.."""
    assert wait_on_element(driver, 1, 5, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element_disappear(driver, 1, 30, '//h1[contains(.,"Create Pool")]')


@then('you should be returned to list of pools and dozer should appear in it')
def you_should_be_returned_to_list_of_pools_and_dozer_should_appear_in_it(driver):
    """you should be returned to list of pools and dozer should appear in it."""
    assert wait_on_element(driver, 1, 5, '//mat-panel-title[contains(.,"dozer")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__dozer_name"]')


@then('navigate to Systems then System Dataset')
def navigate_to_systems_then_system_dataset(driver):
    """navigate to Systems then System Dataset."""

    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 0.5, 30, '//mat-list-item[@ix-auto="option__System Dataset"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Dataset"]').click()


@then('the Configure System Dataset page should open')
def the_configure_system_dataset_page_should_open(driver):
    """the Configure System Dataset page should open."""
    assert wait_on_element(driver, 1, 5, '//h4[contains(.,"Configure System Dataset")]')


@then('click on System Dataser Pool select dozer')
def click_on_system_dataser_pool_select_dozer(driver):
    """click on System Dataser Pool select dozer."""
    assert wait_on_element(driver, 1, 5, '//mat-select[@ix-auto="select__System Dataset Pool"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__System Dataset Pool"]').click()
    assert wait_on_element(driver, 1, 5, '//mat-option[@ix-auto="option__System Dataset Pool_dozer"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__System Dataset Pool_dozer"]').click()


@then('check confirm and click CONTINUE')
def check_confirm_and_click_continue(driver):
    """check confirm and click CONTINUE."""
    assert wait_on_element(driver, 0.5, 5, '//h1[contains(.,"WARNING")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__CONTINUE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('click Save')
def click_save(driver):
    """click Save."""
    assert wait_on_element(driver, 0.5, 30, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Please wait should appear while settings are being applied')
def Please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 1, 30, '//h6[contains(.,"Please wait")]')


@then('navigate to dashboard')
def navigate_to_dashboard(driver):
    """navigate to dashboard."""

    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 0.5, 30, '//span[contains(.,"System Information")]')


@then(parsers.parse('"{serial2}" should be rebootting'))
def serial2_should_be_rebooting(driver, serial2):
    """"{serial2}" should be rebootting."""
    assert not is_element_present(driver, f'//span[contains(.,"{serial2}")]')
    assert is_element_present(driver, '//mat-icon[@svgicon="ha_disabled"]')


@then(parsers.parse('wait for "{serial2}" to be up'))
def wait_for_second_node_to_be_up(driver, serial2):
    """wait for "{serial2}" to be up"""
    assert wait_on_element(driver, 1, 300, f'//span[contains(.,"{serial2}")]')
    assert wait_on_element(driver, 1, 10, '//mat-icon[@svgicon="ha_enabled"]')
