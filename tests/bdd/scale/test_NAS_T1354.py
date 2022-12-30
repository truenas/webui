# coding=utf-8
"""SCALE UI: feature tests."""

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
    when
)
from pytest_dependency import depends


@scenario('features/NAS-T1354.feature', 'Apps Page - Validate removing a Catalog')
def test_apps_page__validate_removing_a_catalog():
    """Apps Page - Validate removing a Catalog."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['App_Catalog'], scope='session')
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
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element_disappear(driver, 30, '//mat-spinner')


@then('when the Apps page loads, open manage catalogs')
def when_the_apps_page_loads_open_manage_catalogs(driver):
    """when the Apps page loads, open manage catalogs."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Catalogs")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Catalogs")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Manage Catalogs")]')


@then('click three dots icon for Truecharts and select delete')
def click_three_dots_icon_for_truecharts_and_select_delete(driver):
    """click three dots icon for Truecharts and select delete."""
    time.sleep(5)  # we have to wait for the page to settle down and the card to fully load
    assert wait_on_element(driver, 10, '//tr[contains(.,"CUSTOMCHART")]//mat-icon[contains(.," more_vert ")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"CUSTOMCHART")]//mat-icon[contains(.," more_vert ")]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="action__CUSTOMCHART_Delete"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__CUSTOMCHART_Delete"]').click()


@then('confirm the confirmation')
def confirm_the_confirmation(driver):
    """confirm the confirmation."""
    assert wait_on_element(driver, 2, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__DELETE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()
    time.sleep(0.5)
    assert wait_on_element_disappear(driver, 25, xpaths.popup.pleaseWait)


@then('confirm deletion is successful')
def confirm_deletion_is_successful(driver):
    """confirm deletion is successful."""
    assert wait_on_element_disappear(driver, 10, '//div[text()="CUSTOMCHART"]')
    assert is_element_present(driver, '//div[text()="CUSTOMCHART"]') is False
