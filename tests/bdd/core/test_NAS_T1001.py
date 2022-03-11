# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
import pytest

pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1001.feature', 'Wipe one disk not in a pool')
def test_wipe_one_disk_not_in_a_pool(driver):
    """Wipe one disk not in a pool."""


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


@when('you see the dashboard')
def you_see_the_dashboard(driver):
    """you see the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click Storage on the side menu and click Disks')
def click_storage_on_the_side_menu_and_click_disks(driver):
    """click Storage on the side menu and click Disks."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Disks"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Disks"]').click()


@then('when the Disks page appears, click name to sort in alphabetical order')
def when_the_disks_page_appears_click_name_to_sort_in_alphabetical_order(driver):
    """when the Disks page appears, click name to sort in alphabetical order."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Disks")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"Name")]')
    ada0 = ''
    while ada0 != 'ada0':
        driver.find_element_by_xpath('//span[contains(.,"Name")]').click()
        ada0 = driver.find_element_by_xpath('(//datatable-body-cell[2]/div/div)[1]').text


@then('when all disks appear in alphabetical order, click on the ada3 disk arrow')
def when_all_disks_appear_in_alphabetical_order_click_on_the_ada3_disk_arrow(driver):
    """when all disks appear in alphabetical order, click on the ada3 disk arrow."""
    # Verify disk are sorted
    disk_list = {1: 'ada0', 2: 'ada1', 3: 'ada2', 4: 'ada3'}
    for num in list(disk_list.keys()):
        disk = driver.find_element_by_xpath(f'(//datatable-body-cell[2]/div/div)[{num}]').text
        assert disk == disk_list[num]
    assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ada3"]')
    driver.find_element_by_xpath('//a[@ix-auto="expander__ada3"]').click()


@then('click the WIPE button')
def click_the_wipe_button(driver):
    """click the WIPE button."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__WIPE_ada3_ada3"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__WIPE_ada3_ada3"]').click()


@then('The Wipe Disk ada3 widget should appear')
def the_wipe_disk_ada3_widget_should_appear(driver):
    """The Wipe Disk ada3 widget should appear."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Wipe Disk ada3")]')


@then('select the Quick Method and click WIPE')
def select_the_quick_method_and_click_wipe(driver):
    """select the Quick Method and click WIPE."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Method"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Method"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Method_Quick"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Method_Quick"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__WIPE"]').click()


@then('check to confirm, and click continue')
def check_to_confirm_and_click_continue(driver):
    """check to confirm, and click continue."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Wipe Disk ada3")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('Disk Wiped successfully should appear')
def disk_wiped_successfully_should_appear(driver):
    """Disk Wiped successfully should appear."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Disk Wiped successfully")]')


@then('click close')
def click_close(driver):
    """click close."""
    driver.find_element_by_xpath('//button[contains(.,"CLOSE")]').click()
