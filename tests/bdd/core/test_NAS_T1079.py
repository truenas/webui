# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver.common.keys import Keys
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
    parsers
)


@scenario('features/NAS-T1079.feature', 'Creating and Editing a Zvol')
def test_creating_and_editing_a_zvol(driver):
    """Creating and Editing a Zvol."""


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
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Storage on the side menu, click on Pools')
def on_the_dashboard_click_on_storage_on_the_side_menu_click_on_pools(driver):
    """on the dashboard, click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('on the Pools page, click on the tank three dots button, and select Add Zvol')
def on_the_pools_page_click_on_the_tank_three_dots_button_and_select_add_zvol(driver):
    """on the Pools page, click on the tank three dots button, and select Add Zvol."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__tank"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Add Zvol"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Zvol"]').click()


@then(parsers.parse('on the Add Zvol page input {zvol_name} for Zvol Name and "{zvol_size}" for Zvol Size'))
def on_the_add_zvol_page_input_testzvol_for_zvol_name_and_3_gib_for_zvol_size(driver, zvol_name, zvol_size):
    """on the Add Zvol page input testzvol for Zvol Name and "3 GiB" for Zvol Size."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Add Zvol")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Zvol name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Zvol name"]').send_keys(zvol_name)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Size for this zvol"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').send_keys(zvol_size)


@then('set compression level to lz4 and ZFS Deduplication to Off')
def set_compression_level_to_lz4_and_zfs_deduplication_to_off(driver):
    """set compression level to lz4 and ZFS Deduplication to Off."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Compression level"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Compression level"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Compression level_lz4 (recommended)"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Compression level_lz4 (recommended)"]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__ZFS Deduplication"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__ZFS Deduplication"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__ZFS Deduplication_Off"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__ZFS Deduplication_Off"]').click()


@then(parsers.parse('click the SUBMIT button, {zvol_name} zvol should be created and in the Tank list'))
def click_the_submit_button_testzvol_zvol_should_be_created_and_in_the_tank_list(driver, zvol_name):
    """click the SUBMIT button, testzvol zvol should be created and in the Tank list."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, f'//span[contains(.,"{zvol_name}")]')


@then('click on the testzvol 3 dots button, select Edit Zvol')
def click_on_the_testzvol_3_dots_button_select_edit_zvol(driver):
    """click on the testzvol 3 dots button, select Edit Zvol."""
    assert wait_on_element(driver, 5, '//mat-icon[@ix-auto="options__testzvol"]')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__testzvol"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__testzvol_Edit Zvol"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__testzvol_Edit Zvol"]').click()


@then(parsers.parse('on the Edit Zvol page, change the Zvol Size to "{zvol_size}", then click SAVE'))
def on_the_edit_zvol_page_change_the_zvol_size_to_4_gib_then_click_save(driver, zvol_size):
    """on the Edit Zvol page, change the Zvol Size to "4 GiB", then click SAVE."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Edit Zvol")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Size for this zvol"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').send_keys(Keys.CONTROL + "a")
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').send_keys(zvol_size)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Please wait")]')


@then(parsers.parse('the {zvol_name} should be saved and show the new size'))
def the_testzvol_should_be_saved_and_show_the_new_size(driver, zvol_name):
    """the testzvol should be saved and show the new size."""
    # td ix-auto="value__testzvol_used_parsed" span
    assert wait_on_element(driver, 5, f'//span[contains(.,"{zvol_name}")]')
    element = driver.find_element_by_xpath('//td[@ix-auto="value__testzvol_used_parsed"]/span')
    assert '4.0' in element.text
