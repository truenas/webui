# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import time
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
    when,
    parsers
)
from pytest_dependency import depends


@pytest.mark.dependency(name='nopeer1_zvol')
@scenario('features/NAS-T1138.feature', 'Create a 1gb zvol call nopeer1 for the no peer iscsi test case')
def test_create_a_1gb_zvol_call_nopeer1_for_the_no_peer_iscsi_test_case():
    """Create a 1gb zvol call nopeer1 for the no peer iscsi test case."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the FreeNAS URL and logged in."""
    depends(request, ['tank_pool'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on Storage in the side menu')
def you_should_be_on_the_dashboard_click_on_storage_in_the_side_menu(driver):
    """you should be on the dashboard, click on Storage in the side menu."""
    """you should be on the dashboard, click on Storage in the side menu and click the tank three dots and add dataset."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    time.sleep(1)
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@then('click on the tank three dots button, select Add Zvol, and the Add Zvol page should open')
def click_on_the_tank_three_dots_button_select_add_zvol_and_the_add_zvol_page_should_open(driver):
    """click on the tank three dots button, select Add Zvol, and the Add Zvol page should open."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Zvol"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Zvol"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 5, '//h3[text()="Add Zvol"]')


@then(parsers.parse('input {name} for Zvol Name and "{zvol_1G_size}" for Zvol Size, click the SUBMIT button,'))
def input_nopeer1_for_zvol_name_and_1_gib_for_zvol_size_click_the_submit_button(driver, name, zvol_1G_size):
    """input {name} for Zvol Name and "{zvol_size}" for Zvol Size, click the SUBMIT button,."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Zvol name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Zvol name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Zvol name"]').send_keys(name)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Size for this zvol"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').send_keys(zvol_1G_size)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('Please wait should appear, And the nopeer1 zvol should be created')
def please_wait_should_appear_and_the_nopeer1_zvol_should_be_created(driver):
    """Please wait should appear, And the nopeer1 zvol should be created."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, '//div[contains(.,"nopeer1")]')
    # return to dashboard
    assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    time.sleep(1)
