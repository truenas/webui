# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
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


@pytest.mark.dependency(name='App_Catalog')
@scenario('features/NAS-T1353.feature', 'Apps Page - Validate adding a Catalog')
def test_apps_page__validate__adding_truecharts():
    """Apps Page - Validate  adding TrueCharts."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['App_readd_pool'], scope='session')
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


@when('on the Dashboard, click Apps on the side menu')
def on_the_dashboard_click_apps_on_the_side_menu(driver):
    """on the Dashboard, click Apps on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.apps, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.apps).click()
    assert wait_on_element_disappear(driver, 30, '//mat-spinner')


@then('on Application page, click on the Manage Catalogs tab')
def on_application_page_click_on_the_manage_catalogs_tab(driver):
    """on Application page, click on the Manage Catalogs tab."""
    assert wait_on_element(driver, 10, xpaths.applications.manageCatalogs_tab, 'clickable')
    driver.find_element_by_xpath(xpaths.applications.manageCatalogs_tab).click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Manage Catalogs") and @tabindex="0"]')


@then('click the Add Catalog button and confirm the warning')
def click_add_catalog_and_confirm_the_warning(driver):
    """click Add Catalog and confirm the warning."""
    assert wait_on_element(driver, 10, '//div[text()=" OFFICIAL "]')
    assert wait_on_element(driver, 10, xpaths.button.addCatalog, 'clickable')
    driver.find_element_by_xpath(xpaths.button.addCatalog).click()
    assert wait_on_element(driver, 7, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()


@then('on the Add Catalog box input the name, the repository, the train and branch')
def on_the_add_catalog_box_input_the_name_the_repository_the_train_and_branch(driver):
    """on the Add Catalog box input the name, the repository, the train and branch."""
    assert wait_on_element(driver, 7, xpaths.addCatalog.title)
    assert wait_on_element(driver, 7, xpaths.addCatalog.catalogName_input, 'inputable')
    driver.find_element_by_xpath(xpaths.addCatalog.catalogName_input).clear()
    driver.find_element_by_xpath(xpaths.addCatalog.catalogName_input).send_keys('customchart')
    assert wait_on_element(driver, 7, xpaths.addCatalog.repository_input)
    driver.find_element_by_xpath(xpaths.addCatalog.repository_input).clear()
    driver.find_element_by_xpath(xpaths.addCatalog.repository_input).send_keys('https://github.com/ericbsd/charts-1')
    assert wait_on_element(driver, 7, xpaths.addCatalog.train_input)
    assert wait_on_element(driver, 10, '//mat-chip[contains(text(),"stable")]//mat-icon[text()="cancel"]', 'clickable')
    driver.find_element_by_xpath('//mat-chip[contains(text(),"stable")]//mat-icon[text()="cancel"]').click()
    driver.find_element_by_xpath(xpaths.addCatalog.train_input).send_keys('charts')
    assert wait_on_element(driver, 7, xpaths.addCatalog.branch_input)
    driver.find_element_by_xpath(xpaths.addCatalog.branch_input).clear()
    driver.find_element_by_xpath(xpaths.addCatalog.branch_input).send_keys('master')
    assert wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('confirm that the new catalog is in the catalog list')
def confirm_installation_is_successful(driver):
    """confirm installation is successful."""
    assert wait_on_element(driver, 120, '//div[text()=" CUSTOMCHART "]')
