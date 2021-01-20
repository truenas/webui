# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

import time
from function import wait_on_element, is_element_present, wait_on_element_disappear
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T961.feature', 'Creating new pool and set it as System Dataset')
def test_creating_new_pool_and_set_it_as_system_dataset(driver):
    """Creating new pool and set it as System Dataset."""


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open, navigate to "{nas_url}"."""
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        assert wait_on_element(driver, 0.5, 5, '//input[@data-placeholder="Username"]')
        time.sleep(1)


@when(parsers.parse('the login page appears, enter "{user}" and "{password}"'))
def the_login_page_appear_enter_root_and_password(driver, user, password):
    """the login page appears, enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 0.5, 5, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 0.5, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('you should see the dashboard and the System Information')
def you_should_see_the_dashboard_and_the_system_information(driver):
    """you should see the dashboard and the System Information."""
    assert wait_on_element(driver, 1, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 0.5, 10, '//span[contains(.,"System Information")]')


@then('navigate to Storage')
def navigate_to_storage(driver):
    """navigate to Storage."""
    assert wait_on_element(driver, 0.5, 10, '//span[contains(.,"System Information")]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@then('when the storage page appears, click Create')
def when_the_storage_page_appears_click_create(driver):
    """when the storage page appears, click Create."""
    assert wait_on_element(driver, 1, 7, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button___POOL_CREATE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button___POOL_CREATE"]').click()


@then('the Pools page should open')
def the_pools_page_should_open(driver):
    """the Pools page should open."""
    assert wait_on_element(driver, 0.5, 5, '//div[contains(.,"Pools")]')


@then('the Pool Manager page should open')
def the_pool_manager_page_should_open(driver):
    """the Pool Manager page should open."""
    assert wait_on_element(driver, 0.5, 5, '//div[contains(.,"Pool Manager")]')


@then(parsers.parse('enter {pool_name} for pool name, check the box next to {disk}'))
def enter_dozer_for_pool_name_check_the_box_next_to_sdb(driver, pool_name, disk):
    """enter dozer for pool name, check the box next to sdb."""
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').clear()
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys(pool_name)
    driver.find_element_by_xpath(f'//mat-checkbox[@id="pool-manager__disks-{disk}"]').click()


@then('press right arrow under data vdev, click on the Force checkbox')
def press_right_arrow_under_data_vdev_click_on_the_force_checkbox(driver):
    """press right arrow under data vdev, click on the Force checkbox."""
    assert wait_on_element(driver, 0.5, 7, '//button[@id="vdev__add-button"]')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()


@then('on the warning box, click Confirm checkbox and click CONTINUE')
def on_the_warning_box_click_confirm_checkbox_and_click_continue(driver):
    """on the warning box, click Confirm checkbox and click CONTINUE."""
    assert wait_on_element(driver, 1, 7, '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__CONTINUE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('click Create, click on Confirm checkbox and click CREATE POOL')
def click_create_click_on_confirm_checkbox_and_click_create_pool(driver):
    """click Create, click on Confirm checkbox and click CREATE POOL."""
    assert wait_on_element(driver, 0.5, 7, '//button[@name="create-button"]')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('Create Pool should appear while the pool is being created')
def create_pool_should_appear_while_the_pool_is_being_created(driver):
    """Create Pool should appear while the pool is being created."""
    assert wait_on_element_disappear(driver, 1, 30, '//h1[contains(.,"Create Pool")]')


@then('you should be returned to the list of Pools')
def you_should_be_returned_to_the_list_of_pools(driver):
    """you should be returned to the list of Pools."""
    assert wait_on_element(driver, 1, 7, '//h1[contains(.,"Storage")]')


@then(parsers.parse('the {pool_name} pool should be on the Pools list'))
def the_dozer_pool_should_be_on_the_pools_list(driver, pool_name):
    """the "dozer" pool should be on the Pools list."""
    assert wait_on_element(driver, 1, 7, '//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//td[contains(.,"tank")]')


@then('navigate to System Setting and click Misc')
def navigate_to_system_setting_and_click_misc(driver):
    """navigate to System Setting and click Misc."""
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__System Settings"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Misc"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Misc"]').click()


@then('the Miscellaneous page should open')
def the_miscellaneous_page_should_open(driver):
    """the Miscellaneous page should open."""
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Miscellaneous")]')


@then('click on System Dataset')
def click_on_system_dataset(driver):
    """click on System Dataset."""
    assert wait_on_element(driver, 0.5, 7, '//li[contains(.,"System Dataset")]')
    driver.find_element_by_xpath('//li[contains(.,"System Dataset")]').click()


@then('the System Dataset page should open')
def the_system_dataset_page_should_open(driver):
    """the System Dataset page should open."""
    assert wait_on_element(driver, 1, 5, '//h4[contains(.,"Configure System Dataset")]')


@then(parsers.parse('click on System Dataset Pool select {pool_name}'))
def click_on_system_dataser_pool_select_dozer(driver, pool_name):
    """click on System Dataser Pool select dozer."""
    assert wait_on_element(driver, 1, 5, '//mat-select[@ix-auto="select__System Dataset Pool"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__System Dataset Pool"]').click()
    assert wait_on_element(driver, 0.5, 5, f'//mat-option[@ix-auto="option__System Dataset Pool_{pool_name}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__System Dataset Pool_{pool_name}"]').click()


@then('click the Confirm checkbox then and click CONTINUE, Click Save')
def click_the_confirm_checkbox_then_and_click_continue_click_save(driver):
    """click the Confirm checkbox then and click CONTINUE, Click Save."""
    assert wait_on_element(driver, 0.5, 5, '//h1[contains(.,"WARNING")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__CONTINUE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 0.5, 30, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Please wait should appear while settings are being applied')
def Please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 1, 30, '//h6[contains(.,"Please wait")]')


@then('navigate to the dashboard')
def navigate_to_dashboard(driver):
    """navigate to The dashboard."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 1, 30, '//span[contains(.,"System Information")]')


@then('refresh and wait for the second node to be up')
def refresh_and_wait_for_the_second_node_to_be_up(driver):
    """refresh and wait for the second node to be up"""
    driver.refresh()
    assert wait_on_element(driver, 1, 120, '//div[contains(.,"tn-bhyve01-nodeb")]')
    assert wait_on_element(driver, 1, 10, '//mat-icon[@svgicon="ha_enabled"]')
    # This 5 seconds of sleep is to let the system ketchup.
    time.sleep(5)
