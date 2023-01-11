# coding=utf-8
"""SCALE UI: feature tests."""

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
)


@scenario('features/NAS-T1101.feature', 'Wipe disks not in a pool')
def test_wipe_disks_not_in_a_pool():
    """Wipe disks not in a pool."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the TrueNAS URL and logged in."""
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
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the dashboard, click Storage on the side menu')
def on_the_dashboard_click_storage_on_the_side_menu(driver):
    """on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@then('on the Storage Dashboard page, click the Disks button')
def on_the_storage_dashboard_page_click_the_disks_button(driver):
    """on the Storage Dashboard page, click the Disks button."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 10, xpaths.storage.disks_button, 'clickable')
    driver.find_element_by_xpath(xpaths.storage.disks_button).click()


@then('the Disks page shoule appears')
def the_disks_page_shoule_appears(driver):
    """the Disks page shoule appears,."""
    assert wait_on_element(driver, 7, xpaths.disks.title)


@then('expand N/A pool disks, click wipe select quick press Wipe and confirm, then close when finished')
def expand_na_pool_disks_click_wipe_select_quick_press_wipe_and_confirm_then_close_when_finished(driver):
    """expand N/A pool disks, click wipe select quick press Wipe and confirm, then close when finished."""
    disk_list = []
    disk_elements = driver.find_elements_by_xpath(xpaths.disks.all_disk)
    for disk_element in disk_elements:
        if is_element_present(driver, f'//tr[contains(.,"{disk_element.text}")]//div[contains(text(),"N/A") or contains(text(),"Exported")]'):
            disk_list.append(disk_element.text)

    for disk in disk_list:
        assert wait_on_element(driver, 7, xpaths.disks.disk_expander(disk), 'clickable')
        driver.find_element_by_xpath(xpaths.disks.disk_expander(disk)).click()
        assert wait_on_element(driver, 7, xpaths.disks.wipe_disk_button(disk), 'clickable')
        driver.find_element_by_xpath(xpaths.disks.wipe_disk_button(disk)).click()
        assert wait_on_element(driver, 7, xpaths.disks.confirm_box_title(disk))
        assert wait_on_element(driver, 7, xpaths.disks.wipe_button, 'clickable')
        driver.find_element_by_xpath(xpaths.disks.wipe_button).click()
        assert wait_on_element(driver, 7, xpaths.disks.confirm_box_title(disk))
        assert wait_on_element(driver, 7, xpaths.checkbox.old_confirm, 'clickable')
        driver.find_element_by_xpath(xpaths.checkbox.old_confirm).click()
        assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
        driver.find_element_by_xpath(xpaths.button.Continue).click()
        assert wait_on_element(driver, 10, xpaths.progress.progressbar)
        assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
        assert wait_on_element(driver, 15, '//span[contains(.,"Disk Wiped successfully")]')
        assert wait_on_element(driver, 5, xpaths.button.close, 'clickable')
        driver.find_element_by_xpath(xpaths.button.close).click()
        assert wait_on_element_disappear(driver, 7, xpaths.disks.confirm_box_title(disk))
