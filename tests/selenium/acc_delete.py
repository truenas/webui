# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 11

import function
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

#error handling/screenshotsave
import sys
import traceback
import os
cwd = str(os.getcwd())

import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest


xpaths = {
        'navAccount' : '//*[@id="nav-1"]/div/a[1]',
        'submenuUser' : '//*[@id="1-1"]',
        'submenuGroup' : '//*[@id="1-0"]',
        'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
        'deleteButton': '//*[contains(@name, "ok_button")]'
        }

class delete_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_00_nav_acc_user(self):
        try:
            # Click  Account menu
            print (" navigating to the user submenu")
            # allowing the button to load
            time.sleep(1)
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuUser']).click()
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("User" in page_data)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_01_01_delete_user(self):
        try:
            print (" deleting a user: " + newusername)
            time.sleep(2)
            function.user_delete(driver, self, "user", newusername)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_01_02_delete_user(self):
        try:
            print (" deleting a user: " + newusernameuncheck)
            time.sleep(2)
            function.user_delete(driver, self, "user", newusernameuncheck)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_01_03_delete_user(self):
        try:
            print (" deleting a user: " + superusername)
            time.sleep(2)
            function.user_delete(driver, self, "user", superusername)
            time.sleep(2)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_01_04_delete_user(self):
        try:
            print (" deleting a user: unas (suggested by UI)" )
            time.sleep(2)
            function.user_delete(driver, self, "user", "unas")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")





    def test_02_00_nav_acc_group(self):
        try:
            # Click  Account menu
            print (" navigating to the group submenu")
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuGroup']).click()
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Group" in page_data)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_02_01_delete_group(self):
        try:
            print (" deleting a group: " + newusername)
            time.sleep(2)
            function.user_delete(driver, self, "group", newusername)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_02_02_delete_group(self):
        try:
            print (" deleting a group: " + superusername)
            time.sleep(2)
            function.user_delete(driver, self, "group", superusername)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_02_03_delete_group(self):
        try:
            print (" deleting a group: " + newgroupname)
            time.sleep(2)
            function.user_delete(driver, self, "group", newgroupname)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_02_04_delete_group(self):
        try:
            print (" deleting a group: " + supergroupname)
            time.sleep(2)
            function.user_delete(driver, self, "group", supergroupname)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_03_close_navAccount(self):
        try:
            print (" closing account menu")
            driver.find_element_by_xpath(xpaths['navAccount']).click()
            time.sleep(20)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    # Next step-- To check if the new user is present in the list via automation


    # method to test if an element is present
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
        if self.is_element_present(By.XPATH,'/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p'):
            ui_element=driver.find_element_by_xpath('/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p')
            error_element=ui_element.text
            print (error_element)
            driver.find_element_by_xpath('/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[2]/button').click()

    def delete(self, type, name):
        # the convention is set in such a way tha a single funtion can cleanup both type:user/group, name:name of the group or user
        # path plugs in the xpath of user or group , submenu{User/Group}
        # num specifies the column of the 3 dots which is different in user/group
        # delNum speifies the option number where del is after clicking on the 3 dots
        if (type == "user"):
            num = 6
            delNum = 1
            path = "User"
            plug = "bsdusr_username"
#            ED_DEL = "DELETE"
        elif (type == "group"):
            num = 5
            delNum = 2
            path = "Group"
            plug = "bsdgrp_group"
#            ED_DEL = "Delete"

        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenu' + path]).click()
        # wait till the list is loaded
        time.sleep(2)
        index = 1
        ui_text = "null"
        if (self.is_element_present(By.XPATH, '//*[@id="' + plug + '_' + name  + '\"]' )):
            print ("username/groupname- " + name + " exists")

            for x in range(0, 10):
                if self.is_element_present(By.XPATH, '//*[@id="entity-table-component"]/div[6]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div'):
                    ui_element=driver.find_element_by_xpath('//*[@id="entity-table-component"]/div[6]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div')
                    ui_text = ui_element.text
                if (ui_text == name):
                    index = x
                    break
                ui_element = " "

            print ("index, delNum, num: " + str(x) + ", " + str(delNum) + "," + str(num))
            time.sleep(1)

            # click on the 3 dots
            driver.find_element_by_xpath('//*[@id="entity-table-component"]/div[6]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[' + str(num) + ']/div/app-entity-table-actions/div/mat-icon').click()
            time.sleep(1)
            # click on delete option


#            driver.find_element_by_xpath('//*[@id="action_button_Delete"]').click()
            driver.find_element_by_xpath('//*[@id="action_button_Delete"]').click()

            if (driver.find_element_by_xpath(xpaths['confirmCheckbox'])):
                driver.find_element_by_xpath(xpaths['confirmCheckbox']).click()
                time.sleep(1)
                print ("clicking delete once")
                driver.find_element_by_xpath(xpaths['deleteButton']).click()
                time.sleep(20)
        else:
            print ("username/groupname- " + name + " does not exists..skipping")


    @classmethod
    def tearDownClass(inst):
        pass

def run_delete_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(delete_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
