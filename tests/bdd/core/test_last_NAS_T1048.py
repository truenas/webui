# coding=utf-8
"""Core feature tests."""

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
    when
)


@scenario('features/NAS-T1048.feature', 'Verify rollback of boot environment works')
def test_verify_rollback_of_boot_environment_works(driver):
    """Verify rollback of boot environment works."""
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
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(1)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you are on the Dashboard')
def you_are_on_the_dashboard(driver):
    """you are on the Dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on System on the side menu, click on Boot')
def click_on_system_on_the_side_menu_click_on_boot(driver):
    """click on System on the side menu, click on Boot."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Boot"]')
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]')
    class_attribute = element.get_attribute('class')
    assert 'open' in class_attribute, class_attribute
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Boot"]').click()
    assert wait_on_element(driver, 7, '//li[contains(.,"Boot")]')


@then('click on the three dots of the initial BE, click the Activate button')
def click_on_the_three_dots_of_the_initial_be_click_the_activate_button(driver):
    """click on the three dots of the initial BE, click the Activate button."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Boot Environments")]')
    assert wait_on_element(driver, 10, '//mat-icon[@ix-auto="options__Initial-Install"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__Initial-Install"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__activate_Activate"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__activate_Activate"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Activate")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__ACTIVATE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ACTIVATE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    time.sleep(1)


@then('verify that the initial BE show "Reboot" in the Active column')
def verify_that_the_initial_be_show_reboot_in_the_active_column(driver):
    """verify that the initial BE show "Reboot" in the Active column."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__Initial-Install_Active"]')
    element = driver.find_element_by_xpath('//div[@ix-auto="value__Initial-Install_Active"]')
    assert element.text == 'Reboot', element.text


@then('verify that the default BE has the "Now" in the Active column')
def verify_that_the_default_be_has_the_now_in_the_active_column(driver):
    """verify that the default BE has the "Now" in the Active column."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__default_Active"]')
    element = driver.find_element_by_xpath('//div[@ix-auto="value__default_Active"]')
    assert element.text == 'Now', element.text


@then('reboot the system, wait for login, and login')
def reboot_the_system_wait_for_login_and_login(driver):
    """reboot the system, wait for login, and login."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__power"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__power"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="option__Restart"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="option__Restart"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Restart")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__RESTART"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__RESTART"]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    time.sleep(10)
    assert wait_on_element(driver, 300, '//input[@placeholder="Username"]', 'clickable')
    # this sleep give a little to get ready for more load
    time.sleep(7)
    assert wait_on_element(driver, 20, '//input[@placeholder="Password"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys('testing')
    assert wait_on_element(driver, 7, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('on the Dashboard, click on System on the side menu, click on Boot')
def on_the_dashboard_click_on_system_on_the_side_menu_click_on_boot(driver):
    """on the Dashboard, click on System on the side menu, click on Boot."""
    assert wait_on_element(driver, 30, '//li[contains(.,"Dashboard")]')
    # Gave more time for the UI to load.
    assert wait_on_element(driver, 30, '//span[contains(.,"System Information")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Boot"]')
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]')
    class_attribute = element.get_attribute('class')
    assert 'open' in class_attribute, class_attribute
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Boot"]').click()
    assert wait_on_element(driver, 7, '//li[contains(.,"Boot")]')


@then('verify that the initial BE has "Now/Reboot" in the Active column')
def verify_that_the_initial_be_has_reboot_now_in_the_active_column(driver):
    """verify that the initial BE has "Now/Reboot" in the Active column."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Boot Environments")]')
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__Initial-Install_Active"]')
    element = driver.find_element_by_xpath('//div[@ix-auto="value__Initial-Install_Active"]')
    assert element.text == 'Now/Reboot', element.text


@then('click on the three dots of the default BE, click the Activate button')
def click_on_the_three_dots_of_the_default_be_click_the_activate_button(driver):
    """click on the three dots of the default BE, click the Activate button."""
    assert wait_on_element(driver, 7, '//mat-icon[@ix-auto="options__default"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__default"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__activate_Activate"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__activate_Activate"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Activate")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__ACTIVATE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ACTIVATE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    time.sleep(1)


@then('verify that the default BE show "Reboot" in the Active column')
def verify_that_the_default_be_show_reboot_in_the_active_column(driver):
    """verify that the default BE show "Reboot" in the Active column."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__default_Active"]')
    element = driver.find_element_by_xpath('//div[@ix-auto="value__default_Active"]')
    assert element.text == 'Reboot', element.text


@then('verify that the initial BE has the "Now" in the Active column')
def verify_that_the_initial_be_has_the_now_in_the_active_column(driver):
    """verify that the initial BE has the "Now" in the Active column."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__Initial-Install_Active"]')
    element = driver.find_element_by_xpath('//div[@ix-auto="value__Initial-Install_Active"]')
    assert element.text == 'Now', element.text


@then('verify that the default BE has "Now/Reboot" in the Active column')
def verify_that_the_default_be_has_reboot_now_in_the_active_column(driver):
    """verify that the default BE has "Now/Reboot" in the Active column."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__default_Active"]')
    element = driver.find_element_by_xpath('//div[@ix-auto="value__default_Active"]')
    assert element.text == 'Now/Reboot', element.text
