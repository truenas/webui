# coding=utf-8
"""High Availability (bhyve02) feature tests."""

import xpaths
import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    refresh_if_element_missing
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T932.feature', 'Creating new pool and set it as System Dataset')
def test_creating_new_pool_and_set_it_as_system_dataset(driver):
    """Creating new pool and set it as System Dataset."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_user_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 4, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """You should see the dashboard and "System Information"."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    assert wait_on_element(driver, 5, xpaths.dashboard.system_information)


@then('Navigate to Storage click Pools')
def navigate_to_storage_click_pools(driver):
    """Navigate to Storage click Pools."""
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('The Pools page should open')
def the_pools_page_should_open(driver):
    """The Pools page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')


@then('Click Add, select Create new pool and click CREATE POOL')
def click_add_select_create_new_pool_and_click_create_pool(driver):
    """Click Add, select Create new pool and click CREATE POOL."""
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 5, '//label[contains(.,"Create a pool:")]')
    driver.find_element_by_xpath('//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CREATE POOL"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('The Pool Manager page should open')
def the_pool_manager_page_should_open(driver):
    """The Pool Manager page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pool Manager")]')


@then('Enter dozer for pool name, check the box next to da1, press right arrow under data vdev, click create')
def enter_dozer_for_pool_name_check_the_box_next_to_da1_press_right_arrow_under_data_vdev_click_create(driver):
    """Enter dozer for pool name, check the box next to da1, press right arrow under data vdev, click create."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Name"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys('dozer')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__disks-da1"]').click()
    assert wait_on_element(driver, 5, '//button[@id="vdev__add-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//button[@name="create-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()


@then('Check confirm, click CREATE POOL')
def check_confirm_click_create_pool(driver):
    """Check confirm, click CREATE POOL."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('Create Pool should appear while pool is being created.')
def create_pool_should_appear_while_pool_is_being_created(driver):
    """Create Pool should appear while pool is being created.."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element_disappear(driver, 30, '//h1[contains(.,"Create Pool")]')


@then('You should be returned to list of pools and dozer should appear in it')
def you_should_be_returned_to_list_of_pools_and_dozer_should_appear_in_it(driver):
    """You should be returned to list of pools and dozer should appear in it."""
    assert wait_on_element(driver, 5, '//mat-panel-title[contains(.,"dozer")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__dozer_name"]')


@then('Navigate to Systems then System Dataset')
def navigate_to_systems_then_system_dataset(driver):
    """Navigate to Systems then System Dataset."""
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System Dataset"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Dataset"]').click()


@then('The Configure System Dataset page should open')
def the_configure_system_dataset_page_should_open(driver):
    """The Configure System Dataset page should open."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"Configure System Dataset")]')


@then('Click on System Dataset Pool select dozer')
def click_on_system_dataset_pool_select_dozer(driver):
    """Click on System Dataset Pool select dozer."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__System Dataset Pool"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__System Dataset Pool"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__System Dataset Pool_dozer"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__System Dataset Pool_dozer"]').click()


@then('Check confirm and click CONTINUE')
def check_confirm_and_click_continue(driver):
    """Check confirm and click CONTINUE."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"WARNING")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('Click Save')
def click_save(driver):
    """Click Save."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Please wait should appear while settings are being applied')
def Please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 30, xpaths.popupTitle.please_wait)


@then('Navigate to dashboard')
def navigate_to_dashboard(driver):
    """Navigate to dashboard."""
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 7, xpaths.dashboard.system_information)


@then('HA should be disable wait for it to be enable')
def ha_should_be_disable_wait_for_it_to_be_enable(driver):
    """HA should be disable wait for it to be enable."""
    assert is_element_present(driver, xpaths.topToolbar.ha_disabled)
    # refresh_if_element_missing need to be replace with wait_on_element when NAS-118299
    assert refresh_if_element_missing(driver, 420, xpaths.topToolbar.ha_enable)
    # This 5 seconds of sleep is to let the system ketchup.
    time.sleep(5)
