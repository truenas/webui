
import time
import xpaths
from function import (
    is_element_present,
    wait_on_element,
    wait_on_element_disappear
)
from selenium.common.exceptions import ElementClickInterceptedException


def Click_Clear_Input(driver, xpath, value):
    driver.find_element_by_xpath(xpath).click()
    driver.find_element_by_xpath(xpath).clear()
    driver.find_element_by_xpath(xpath).send_keys(value)


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
    assert wait_on_element(driver, 7, xpaths.checkbox.new_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.new_Confirm).click()
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
    assert wait_on_element(driver, 7, xpaths.checkbox.new_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.new_Confirm).click()
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()


def Confirm_Warning(driver):
    assert wait_on_element(driver, 5, xpaths.popup.warning)
    assert wait_on_element(driver, 5, xpaths.checkbox.new_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.new_Confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()
    time.sleep(1)


def Dismiss_All_Alerts(driver):
    if wait_on_element(driver, 5, '//span[contains(.,"notifications")]//span[not(contains(text(),"0"))]'):
        assert wait_on_element(driver, 7, xpaths.toolbar.notification_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.toolbar.notification_Button).click()
        assert wait_on_element(driver, 7, xpaths.alert.title)
        assert wait_on_element(driver, 7, '//button[contains(text(),"Dismiss All Alerts")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(text(),"Dismiss All Alerts")]').click()
        assert wait_on_element(driver, 7, '//ix-icon[contains(.,"clear")]', 'clickable')
        driver.find_element_by_xpath('//ix-icon[contains(.,"clear")]').click()


def Encyrpted_Key_Waring(driver):
    assert wait_on_element(driver, 10, '//h1[contains(text(),"WARNING!")]')
    assert wait_on_element(driver, 7, xpaths.button.done, 'clickable')
    driver.find_element_by_xpath(xpaths.button.done).click()


def Go_To_Service(driver):
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 5, xpaths.side_Menu.services, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.services).click()


def HA_Login_Status_Enable(driver):
    assert wait_on_element(driver, 180, xpaths.login.user_Input)
    assert wait_on_element(driver, 240, xpaths.login.ha_Status_Enable)


def Input_Value(driver, xpath, value):
    driver.find_element_by_xpath(xpath).clear()
    driver.find_element_by_xpath(xpath).send_keys(value)


def Leave_Domain(driver, user, password):
    assert wait_on_element(driver, 5, '//h1[text()="Leave Domain"]')
    assert wait_on_element(driver, 5, '//ix-input[@formcontrolname="username"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').send_keys(user)
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').send_keys(password)

    driver.find_element_by_xpath('//mat-dialog-container//button[contains(.,"Leave Domain")]').click()
    assert wait_on_element_disappear(driver, 120, xpaths.popup.please_Wait)


def License_Agrement(driver):
    if wait_on_element(driver, 2, '//h1[contains(.,"End User License Agreement - TrueNAS")]'):
        try:
            assert wait_on_element(driver, 2, '//button[@data-test="button-dialog-confirm"]', 'clickable')
            driver.find_element_by_xpath('//button[@data-test="button-dialog-confirm"]').click()
            if wait_on_element(driver, 2, xpaths.button.close, 'clickable'):
                driver.find_element_by_xpath(xpaths.button.close).click()
        except ElementClickInterceptedException:
            assert wait_on_element(driver, 2, xpaths.button.close, 'clickable')
            driver.find_element_by_xpath(xpaths.button.close).click()
            assert wait_on_element(driver, 2, '//button[@data-test="button-dialog-confirm"]', 'clickable')
            driver.find_element_by_xpath('//button[@data-test="button-dialog-confirm"]').click()


def Login(driver, user, password):
    time.sleep(1)
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


def Restart_SMB_Service(driver):
    assert wait_on_element(driver, 7, xpaths.popup.smb_Restart_Title)
    assert wait_on_element(driver, 5, xpaths.popup.smb_Restart_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.popup.smb_Restart_Button).click()


def Select_Option(driver, xpath):
    assert wait_on_element(driver, 5, xpath, 'clickable')
    driver.find_element_by_xpath(xpath).click()


def Trigger_Failover(driver):
    assert wait_on_element(driver, 60, xpaths.toolbar.ha_Enabled)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Information_Standby_Title)
    assert wait_on_element(driver, 10, xpaths.button.initiate_Failover, 'clickable')
    driver.find_element_by_xpath(xpaths.button.initiate_Failover).click()


def Verify_Degraded_Alert(driver):
    assert wait_on_element(driver, 7, xpaths.toolbar.notification_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.toolbar.notification_Button).click()
    assert wait_on_element(driver, 7, xpaths.alert.title)
    assert wait_on_element(driver, 7, xpaths.alert.degraded_Critical_Level)
    assert wait_on_element(driver, 7, xpaths.alert.degraded_Pool_Text)
    assert wait_on_element(driver, 7, xpaths.alert.close_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.alert.close_Button).click()
    time.sleep(0.5)


def Verify_Degraded_Alert_Is_Gone(driver):
    driver.find_element_by_xpath(xpaths.toolbar.notification_Button).click()
    assert wait_on_element(driver, 7, xpaths.alert.title)
    assert is_element_present(driver, xpaths.alert.degraded_Critical_Level) is False
    assert wait_on_element(driver, 7, xpaths.alert.close_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.alert.close_Button).click()
    time.sleep(0.5)


def Verify_Element_Text(driver, xpath, value):
    element_text = driver.find_element_by_xpath(xpath).text
    assert element_text == value


def Verify_The_Dashboard(driver):
    assert wait_on_element(driver, 5, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)


def Wait_For_Inputable_And_Input_Value(driver, xpath, value):
    assert wait_on_element(driver, 5, xpath, 'inputable')
    driver.find_element_by_xpath(xpath).clear()
    driver.find_element_by_xpath(xpath).send_keys(value)


def Wiped_Unused_Disk(driver):
    disk_list = []
    disk_elements = driver.find_elements_by_xpath(xpaths.disks.all_Disk)
    for disk_element in disk_elements:
        if is_element_present(driver, f'//tr[contains(.,"{disk_element.text}")]//div[contains(text(),"N/A") or contains(text(),"Exported")]'):
            disk_list.append(disk_element.text)
    print(disk_list)
    for disk in disk_list:
        print(xpaths.disks.disk_Expander(disk))
        assert wait_on_element(driver, 7, xpaths.disks.disk_Expander(disk), 'clickable')
        driver.find_element_by_xpath(xpaths.disks.disk_Expander(disk)).click()
        assert wait_on_element(driver, 7, xpaths.disks.wipe_Disk_Button(disk), 'clickable')
        driver.find_element_by_xpath(xpaths.disks.wipe_Disk_Button(disk)).click()
        assert wait_on_element(driver, 7, xpaths.disks.confirm_Box_Title(disk))
        assert wait_on_element(driver, 7, xpaths.disks.wipe_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.disks.wipe_Button).click()
        assert wait_on_element(driver, 7, xpaths.disks.confirm_Box_Title(disk))
        assert wait_on_element(driver, 7, xpaths.checkbox.new_Confirm, 'clickable')
        driver.find_element_by_xpath(xpaths.checkbox.new_Confirm).click()
        assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
        driver.find_element_by_xpath(xpaths.button.Continue).click()
        assert wait_on_element(driver, 10, xpaths.progress.progressbar)
        assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
        assert wait_on_element(driver, 15, '//span[contains(.,"Disk Wiped successfully")]')
        assert wait_on_element(driver, 5, xpaths.button.close, 'clickable')
        driver.find_element_by_xpath(xpaths.button.close).click()
        assert wait_on_element_disappear(driver, 7, xpaths.disks.confirm_Box_Title(disk))
