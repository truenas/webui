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
    depends(request, ['App_Nextcloud'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the Dashboard, click on Apps on the side menu')
def on_the_dashboard_click_on_apps_on_the_side_menu(driver):
    """on the Dashboard, click on Apps on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 10, xpaths.side_Menu.apps, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.apps).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('on the Application page stop nextcloud from running')
def on_the_application_page_stop_nextcloud_from_running(driver):
    """on the Application page stop nextcloud from running."""
    assert wait_on_element(driver, 10, xpaths.applications.title)
    assert wait_on_element_disappear(driver, 120, xpaths.progress.spinner)
    assert wait_on_element(driver, 60, '//strong[text()="nextcloud-test"]')
    assert wait_on_element(driver, 45, '//mat-card[contains(.,"nextcloud")]//span[contains(.,"Stop")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"nextcloud")]//span[contains(.,"Stop")]').click()


@then('verify the nextcloud has stopped')
def verify_the_nextcloud_has_stopped(driver):
    """verify the nextcloud has stopped."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Stopping")]')
    assert wait_on_element_disappear(driver, 180, '//h1[contains(.,"Stopping")]')
    assert wait_on_element(driver, 15, '//mat-card[contains(.,"nextcloud-test")]//span[contains(.,"STOPPED ")]')
    # Give a break to the system
    time.sleep(5)


@then('click on Manager Docker Images tap')
def click_on_manager_docker_images_tap(driver):
    """click on Manager Docker Images tap."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Docker Images")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Docker Images")]').click()
    time.sleep(1)


@then('click on the three dots icon for nextcloud, then click delete')
def click_on_the_three_dots_icon_for_nextcloud_then_click_delete(driver):
    """click on the three dots icon for nextcloud, then click delete."""
    assert wait_on_element(driver, 10, '//th[contains(.,"Tags")]')

    assert wait_on_element(driver, 5, '//td[contains(text(),"nextcloud")]')
    assert wait_on_element(driver, 20, '//tr[contains(.,"nextcloud")]//ix-icon[contains(.,"more_vert")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"nextcloud")]//ix-icon[contains(.,"more_vert")]').click()

    assert wait_on_element(driver, 20, '//a[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//a[contains(.,"Delete")]').click()


@then('on the Delete box check confirm and Force delete then click Delete')
def on_the_delete_box_check_confirm_and_force_delete_then_click_delete(driver):
    """on the Delete box check confirm and Force delete then click Delete."""
    assert wait_on_element(driver, 20, '//h1[text()="Delete"]')
    assert wait_on_element(driver, 2, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 2, xpaths.checkbox.force, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.force).click()
    wait_on_element(driver, 10, xpaths.button.delete, 'clickable')
    driver.find_element_by_xpath(xpaths.button.delete).click()


@then('verify the nextcloud image is deleted')
def verify_the_nextcloud_image_is_deleted(driver):
    """verify the nextcloud image is deleted."""
    assert wait_on_element_disappear(driver, 35, '//h1[text()="Delete"]')
    assert wait_on_element_disappear(driver, 15, '//tr[contains(.,"nextcloud")]')
