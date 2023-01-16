# coding=utf-8
"""SCALE UI: feature tests."""

import time
import xpaths
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
)
import pytest
from pytest_dependency import depends
pytestmark = [pytest.mark.debug_test]


@pytest.mark.dependency(name='App_initial_setup')
@scenario('features/NAS-T1285.feature', 'Apps Page Validation')
def test_apps_page_validation():
    """Apps Page Validation."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
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
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.apps, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.apps).click()


@then('when Choose a pool for Apps appear, select a pool')
def when_choose_a_pool_for_apps_appear_select_pool(driver):
    """when Choose a pool for Apps appear, select pool."""
    assert wait_on_element(driver, 10, xpaths.applications.title)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, xpaths.chossePoolForApp.title)
    assert wait_on_element(driver, 5, xpaths.chossePoolForApp.pool_select, 'clickable')
    driver.find_element_by_xpath(xpaths.chossePoolForApp.pool_select).click()
    assert wait_on_element(driver, 7, xpaths.chossePoolForApp.tankPool_option, 'clickable')
    driver.find_element_by_xpath(xpaths.chossePoolForApp.tankPool_option).click()
    assert wait_on_element(driver, 7, xpaths.button.choose, 'clickable')
    driver.find_element_by_xpath(xpaths.button.choose).click()
    assert wait_on_element_disappear(driver, 60, xpaths.popup.configuring)


@then('the Available Applications Tab loads')
def the_available_applications_tab_loads(driver):
    """the Available Applications Tab loads."""
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_on_element(driver, 7, '//h3[contains(.,"minio")]')


@then('verify the setting slide out works')
def verify_the_setting_slide_out_works(driver):
    """verify the setting slide out works."""
    assert wait_on_element(driver, 10, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()
    assert wait_on_element(driver, 10, xpaths.button.advanced_settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.advanced_settings).click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"Kubernetes Settings")]')
    assert wait_on_element(driver, 10, '//div[@class="ix-slidein-title-bar"]//mat-icon[contains(.,"cancel")]', 'clickable')
    driver.find_element_by_xpath('//div[@class="ix-slidein-title-bar"]//mat-icon[contains(.,"cancel")]').click()


@then('open the Installed Applications page')
def open_the_installed_applications_page(driver):
    """open the Installed Applications page."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"No Applications Installed")]')


@then('open the Manage Docker Images Page')
def open_the_manage_docker_images_page(driver):
    """open the Manage Docker Images Page."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Docker Images")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Docker Images")]').click()
    # seems like sometimes zfs-driver is present.
    assert wait_on_element(driver, 5, '//h3[contains(.,"No Docker Images")]') or wait_on_element(driver, 5, '//div[contains(.,"rancher")]')


@then('open the Manage Catalogs Page')
def open_the_manage_catalogs_page(driver):
    """open the Manage Catalogs Page."""
    assert wait_on_element(driver, 10, xpaths.applications.manageCatalogs_tab, 'clickable')
    driver.find_element_by_xpath(xpaths.applications.manageCatalogs_tab).click()
    assert wait_on_element(driver, 7, '//div[contains(.,"https://github.com/truenas/charts.git")]')
