

import time
import xpaths
from function import (
    is_element_present,
    wait_on_element,
    wait_on_element_disappear
)


def Close_Common_Warning(driver):
    assert wait_on_element(driver, 5, xpaths.popup.warning)
    assert wait_on_element(driver, 5, xpaths.button.close, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close).click()


def Combobox_Input_And_Select(driver, xpath, value):
    assert wait_on_element(driver, 5, xpath, 'inputable')
    driver.find_element_by_xpath(xpath).clear()
    driver.find_element_by_xpath(xpath).send_keys(value)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.combobox_Option(value), 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.combobox_Option(value)).click()


def Confirm_Creating_Pool(driver):
    assert wait_on_element(driver, 10, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.checkbox.old_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_Confirm).click()
    assert wait_on_element(driver, 7, xpaths.pool_manager.create_Pool_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.pool_manager.create_Pool_Button).click()


def Confirm_Failover(driver):
    assert wait_on_element(driver, 5, '//h1[text()="Initiate Failover"]')
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@class,"confirm-checkbox")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[contains(@class,"confirm-checkbox")]').click()
    assert wait_on_element(driver, 5, '//button[span/text()=" Failover "]', 'clickable')
    driver.find_element_by_xpath('//button[span/text()=" Failover "]').click()
    time.sleep(10)


def Confirm_Single_Disk(driver):
    assert wait_on_element(driver, 10, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.checkbox.old_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_Confirm).click()
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()


def Go_To_Service(driver):
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 5, xpaths.side_Menu.services, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.services).click()


def Login(driver, user, password):
    driver.find_element_by_xpath(xpaths.login.user_Input).clear()
    driver.find_element_by_xpath(xpaths.login.user_Input).send_keys(user)
    driver.find_element_by_xpath(xpaths.login.password_Input).clear()
    driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(password)
    assert wait_on_element(driver, 5, xpaths.login.signin_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.login.signin_Button).click()


def Login_If_Not_On_Dashboard(driver, user, password):
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


def Leave_Domain(driver, user, password):
    assert wait_on_element(driver, 5, '//h1[text()="Leave Domain"]')
    assert wait_on_element(driver, 5, '//ix-input[@formcontrolname="username"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').send_keys(user)
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').send_keys(password)

    driver.find_element_by_xpath('//mat-dialog-container//button[contains(.,"Leave Domain")]').click()
    assert wait_on_element_disappear(driver, 120, xpaths.popup.please_Wait)


def Input_Value(driver, xpath, value):
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys(value)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select)


def Wait_For_Inputable_And_Input_Value(driver, xpath, value):
    assert wait_on_element(driver, 5, xpath, 'inputable')
    driver.find_element_by_xpath(xpath).clear()
    driver.find_element_by_xpath(xpath).send_keys(value)


def Verify_The_Dashboard(driver):
    assert wait_on_element(driver, 5, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)


def Verify_Element_Text(driver, xpath, value):
    element_text = driver.find_element_by_xpath(xpath).text
    assert element_text == value
