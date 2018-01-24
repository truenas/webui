# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

from source import *
from selenium.webdriver.common.keys import Keys
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementNotVisibleException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains


import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest


xpaths = {
        'navAccount': "//*[@id='nav-1']/div/a[1]",
        'submenuUser': "//*[@id='1-1']",
        'submenuGroup': "//*[@id='1-0']",
        'newUser': "//*[@id='1']/form-input/div/" 
        "md-input-container/div/div[1]/div/input",
        'primaryGroupcheckbox': "//*[@id='2']/form-checkbox/"
        "div/md-checkbox/label/div",
        'primaryGroupdropdown': "//*[@id='3']"
        "/form-select/div/md-select/div",
        'newUserName': "//*[@id='7']/form-input/"
        "div/md-input-container/div/div[1]/div/input",
        'newUserPass': "//*[@id='9']/form-input/"
        "div/md-input-container/div/div[1]/div/input",
        'newUserPassConf': "//*[@id='10']/form-input/div/"
        "md-input-container/div/div[1]/div/input",
        'permitSudocheckbox': "//*[@id='13']/form-checkbox/"
        "div/md-checkbox/label/div",
        'deleteConfirm': "/html/body/div[3]/div[3]/div[2]/md-dialog-container/"
        "confirm-dialog/div[1]/md-checkbox/label/div",
        'fabTrigger': "//*[@id='entity-table-component']/div[1]/"
        "app-entity-table-add-actions/div/smd-fab-speed-dial",
        'fabAction': "//*[@id='entity-table-component']/div[1]/"
        "app-entity-table-add-actions/div/smd-fab-speed-dial"
        "/div/smd-fab-actions/button"
        }


class create_user_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_nav_acc_user(self):
        # Click  Account menu
        print (" navigating to the user submenu")
        a = driver.find_element_by_xpath(xpaths['navAccount'])
        a.click()
        # allowing the button to load
        time.sleep(1)
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # get the ui element
        ui_element=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/app-breadcrumb/div/ul/li[2]/a")
        # get the weather data
        page_data=ui_element.text
        print ("the Page now is: " + page_data)
        # assert response
        self.assertTrue("User" in page_data)

    def test_02_create_newuser(self):
        print (" creating a new user with create new primary group")
        # cancelling the tour
        if self.is_element_present(By.XPATH, "/html/body/div[5]/div[1]/button"):
            driver.find_element_by_xpath("/html/body/div[5]/div[1]/button").click()
        # scroll down to find hover tab
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        # Perform hover to show menu
        hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
        hover = ActionChains(driver).move_to_element(hover_element)
        hover.perform()
        time.sleep(1)
        # Click create new user option
        driver.find_element_by_xpath(xpaths['fabAction']).click()
        # Enter New Username
        driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusername)
        # Enter User Full name
        driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfname)
        # Enter Password
        driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
        # Enter Password Conf
        driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
        # Click on create new User button
        driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-user-form/entity-form/md-card/div/form/md-card-actions/button[1]").click()
        # check if there is a generic error when making a duplicate user, and print the error
        self.error_check()

    def test_03_create_newuser_primarygroup_uncheck(self):
        time.sleep(2)
        print (" creating a new user without creating a primary group")
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # scroll down to find hover tab
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        # Perform hover to show menu
        hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
        hover = ActionChains(driver).move_to_element(hover_element)
        hover.perform()
        time.sleep(1)
        # Click create new user option
        driver.find_element_by_xpath(xpaths['fabAction']).click()
        # Enter New Username
        driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusernameuncheck)
        # uncheck create primary group  Checkbox
        driver.find_element_by_xpath(xpaths['primaryGroupcheckbox']).click()
        # click on primary group dropdownlist
        driver.find_element_by_xpath(xpaths['primaryGroupdropdown']).click()
        # select the element from the dropdown list by using selectlist function
        self.selectlist("wheel")
        # driver.find_element_by_xpath("/html/body/div[3]/div[2]/div/div/md-option[3]").click()
        # Enter User Full name
        driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfnameuncheck)
        # Enter Password
        driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
        # Enter Password Conf
        driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
        # Click on create new User button
        driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-user-form/entity-form/md-card/div/form/md-card-actions/button[1]").click()
        # check if there is a generic error when making a duplicate user, and print the error
        self.error_check()

    def test_04_create_superuser(self):
        print (" creating a super user with root access")
        time.sleep(2)
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # scroll down to find hover tab
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        # Perform hover to show menu
        hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
        hover = ActionChains(driver).move_to_element(hover_element)
        hover.perform()
        time.sleep(1)
        # Click create new user option
        driver.find_element_by_xpath(xpaths['fabAction']).click()
        # Enter New Username
        driver.find_element_by_xpath(xpaths['newUser']).send_keys(superusername)
        # Enter User Full name
        driver.find_element_by_xpath(xpaths['newUserName']).send_keys(superuserfname)
        # Enter Password
        driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(superuserpassword)
        # Enter Password Conf
        driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(superuserpassword)
        # check Permit Sudo Checkbox
        driver.find_element_by_xpath(xpaths['permitSudocheckbox']).click()
        # Click on create new User button
        driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-user-form/entity-form/md-card/div/form/md-card-actions/button[1]").click()
        # check if there is a generic error when making a duplicate user, and print the error
        self.error_check()
        # check if the the user list is loaded after addding a new user

    def test_05_create_duplicateuser(self):
        print (" creating a duplicate user")
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # cancelling the tour
        if self.is_element_present(By.XPATH,"/html/body/div[4]/div[1]/button"):
            driver.find_element_by_xpath("/html/body/div[4]/div[1]/button").click()

        # scroll down to find hover tab
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        # Perform hover to show menu
        hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
        hover = ActionChains(driver).move_to_element(hover_element)
        hover.perform()
        time.sleep(1)
        # Click create new user option
        driver.find_element_by_xpath(xpaths['fabAction']).click()
        # Enter New Username
        driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusername)
        # Enter User Full name
        driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfname)
        # Enter Password
        driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
        # Enter Password Conf
        driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
        # Click on create new User button
        driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-user-form/entity-form/md-card/div/form/md-card-actions/button[1]").click()
        # check if there is a generic error when making a duplicate user, and print the error
        self.error_check()
        time.sleep(20)


    # Next step-- To check if the new user is present in the list via automation


    #method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    def error_check(self):
        if self.is_element_present(By.XPATH,"/html/body/div[4]/div/div[2]/md-dialog-container/error-dialog/div[1]/p"):
            ui_element=driver.find_element_by_xpath("/html/body/div[4]/div/div[2]/md-dialog-container/error-dialog/div[1]/p")
            error_element=ui_element.text
            print (error_element)
            driver.find_element_by_xpath("/html/body/div[4]/div/div[2]/md-dialog-container/error-dialog/div[2]/button").click()

    def delete(self, name):
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # click on the item per page option
        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[3]/md-paginator/div[1]/md-select/div").click()
        # click select the highest number i.e 100
        driver.find_element_by_xpath("/html/body/div[3]/div[2]/div/div/md-option[4]").click()
        # wait till the list is loaded
        time.sleep(5)
        index = 0
        ui_text = "null"
        for x in range(0, 5):
            if self.is_element_present(By.XPATH, "/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-user-list/entity-table/div/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(x) + "]/datatable-body-row/div[2]/datatable-body-cell[1]/div/div"):
                ui_element=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-user-list/entity-table/div/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(x) + "]/datatable-body-row/div[2]/datatable-body-cell[1]/div/div")
                ui_text = ui_element.text
            if (ui_text == name):
                index = x
                break
            ui_element = " "

        # click on the 3 dots
        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(index) + "]/datatable-body-row/div[2]/datatable-body-cell[7]/div/app-entity-table-actions/div/md-icon").click()
        # click on delete option
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div/div/span[2]/button/div").click()
        # click on confirmation checkbox
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[1]/md-checkbox/label/div").click()
        # click on Ok
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[2]/button[1]").click()
        print (newusernameuncheck + " deleted")

    def selectlist(self, element):
        for i in range(0,10):
            if self.is_element_present(By.XPATH, "/html/body/div[4]/div[2]/div/div/md-option[" + str(i) + "]"):
                dropdown_el = driver.find_element_by_xpath("/html/body/div[4]/div[2]/div/div/md-option[" + str(i) + "]")
                dropdown_text = dropdown_el.text
                if dropdown_text == element:
                    dropdown_el.click()
                    break



    @classmethod
    def tearDownClass(inst):
        pass

def run_create_user_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(create_user_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
