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
    when,
    parsers
)
from pytest_dependency import depends


@pytest.mark.dependency(name='nopeer1_zvol')
@scenario('features/NAS-T1138.feature', 'Create a 1gb zvol call nopeer1 for the no peer iscsi test case')
def test_create_a_1gb_zvol_call_nopeer1_for_the_no_peer_iscsi_test_case():
    """Create a 1gb zvol call nopeer1 for the no peer iscsi test case."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
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


@when('on the dashboard, click on Storage in the side menu')
def on_the_dashboard_click_on_storage_in_the_side_menu(driver):
    """on the dashboard, click on Storage in the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@then('on the Storage click on the tank Manage Datasets button')
def on_the_storage_click_on_the_tank_manage_datasets_button(driver):
    """on the Storage click on the tank Manage Datasets button."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 5, xpaths.storage.manageDataset_button('tank'), 'clickable')
    driver.find_element_by_xpath(xpaths.storage.manageDataset_button('tank')).click()


@then('on the Datasets page click on the tank tree and click Add Zvol')
def on_the_datasets_page_click_on_the_tank_tree_and_click_add_zvol(driver):
    """on the Datasets page click on the tank tree and click Add Zvol."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_tree_name('tank'))
    driver.find_element_by_xpath(xpaths.dataset.pool_tree('tank')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_selected('tank'))
    assert wait_on_element(driver, 4, xpaths.dataset.addZvol_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.addZvol_button).click()


@then(parsers.parse('on the the Add Zvol page input {zvol_name} for Zvol Name'))
def on_the_the_add_zvol_page_input_nopeer1_for_zvol_name(driver, zvol_name):
    """on the the Add Zvol page input nopeer1 for Zvol Name."""
    assert wait_on_element(driver, 5, xpaths.addZvol.title)
    assert wait_on_element(driver, 5, xpaths.addZvol.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.addZvol.name_input).clear()
    driver.find_element_by_xpath(xpaths.addZvol.name_input).send_keys(zvol_name)


@then(parsers.parse('input "{zvol_size}" for Zvol Size, click the save button'))
def input_1_gib_for_zvol_size_click_the_save_button(driver, zvol_size):
    """input "1 GiB" for Zvol Size, click the save button."""
    assert wait_on_element(driver, 5, xpaths.addZvol.size_input, 'inputable')
    driver.find_element_by_xpath(xpaths.addZvol.size_input).send_keys(zvol_size)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then(parsers.parse('once saved the {zvol_name} volume should be the tank tree'))
def once_saved_the_nopeer1_volume_should_be_the_tank_tree(driver, zvol_name):
    """once saved the nopeer1 volume should be the tank tree."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_name(zvol_name))
