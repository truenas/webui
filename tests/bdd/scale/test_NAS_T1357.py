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
import pytest
from pytest_dependency import depends
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1357.feature', 'Apps Page - Validate deleting a container image')
def test_apps_page__validate_deleting_a_container_image():
    """Apps Page - Validate deleting a container image."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['App_Container'], scope='session')
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


@then('Stop nextcloud from running')
def stop_nextcloud_from_running(driver):
    """Stop nextcloud from running."""
    assert wait_on_element(driver, 10, '//h1[text()="Applications"]')
    assert wait_on_element_disappear(driver, 120, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 60, '//strong[text()="nextcloud-test"]')
    assert wait_on_element(driver, 45, '//mat-card[contains(.,"nextcloud")]//span[contains(.,"Stop")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"nextcloud")]//span[contains(.,"Stop")]').click()


@then('Verify the application has stopped')
def verify_the_application_has_stopped(driver):
    """Verify the application has stopped."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Stopping")]')
    assert wait_on_element_disappear(driver, 180, '//h1[contains(.,"Stopping")]')
    assert wait_on_element(driver, 15, '//mat-card[contains(.,"nextcloud-test")]//span[contains(.,"STOPPED ")]')
    # Give a break to the system
    time.sleep(5)


@then('open available applications')
def open_available_applications(driver):
    """open available applications."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()


@then('when the Apps page loads, open Manager Docker Images')
def when_the_apps_page_loads_open_manager_docker_images(driver):
    """when the Apps page loads, open Manager Docker Images."""
    assert wait_on_element_disappear(driver, 60, '//mat-spinner')
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Docker Images")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Docker Images")]').click()
    time.sleep(1)


@then('click the three dots icon for nextcloud')
def click_the_three_dots_icon_for_nextcloud(driver):
    """click the three dots icon for nextcloud."""
    assert wait_on_element(driver, 10, '//th[text()="Tags"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"Items per page:")]')
    if wait_on_element(driver, 3, '//div[contains(text(),"nextcloud")]'):
        assert wait_on_element(driver, 20, '//tr[contains(.,"nextcloud")]//mat-icon[contains(.,"more_vert")]', 'clickable')
        driver.find_element_by_xpath('//tr[contains(.,"nextcloud")]//mat-icon[contains(.,"more_vert")]').click()
    else:
        assert wait_on_element(driver, 20, '//button[@aria-label="Next page"]', 'clickable')
        driver.find_element_by_xpath('//button[@aria-label="Next page"]').click()
        assert wait_on_element(driver, 5, '//div[contains(text(),"nextcloud")]')
        assert wait_on_element(driver, 5, '//tr[contains(.,"nextcloud")]//mat-icon[contains(.,"more_vert")]', 'clickable')
        driver.find_element_by_xpath('//tr[contains(.,"nextcloud")]//mat-icon[contains(.,"more_vert")]').click()


@then('click delete')
def click_delete(driver):
    """click delete."""
    assert wait_on_element(driver, 20, '//button//span[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(.,"Delete")]').click()


@then('confirm')
def confirm(driver):
    """confirm."""

    assert wait_on_element(driver, 2, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    wait_on_element(driver, 10, '//button[@ix-auto="button__DELETE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()


@then('confirm image is deleted')
def confirm_image_is_deleted(driver):
    """confirm image is deleted."""
    assert wait_on_element(driver, 10, xpaths.popup.pleaseWait)
    assert wait_on_element_disappear(driver, 35, xpaths.popup.pleaseWait)
    assert wait_on_element_disappear(driver, 15, '//tr[contains(.,"nextcloud")]')
