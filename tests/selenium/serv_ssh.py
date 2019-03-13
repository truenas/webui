# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

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


xpaths = { 'navService' : '//*[@id="nav-8"]/div/a[1]',
          'turnoffConfirm' : '//*[contains(text(), "OK")]',
          'configButton' : '/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/div[14]/entity-card/div[1]/div/mat-card[1]/div/div[2]/div[3]/button',
          'rootCheckbox' : '//*[@id="ssh_rootlogin"]/mat-checkbox/label/div'
         }

class conf_ssh_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass


    def test_01_turnon_ssh (self):
        try:
            # click Service Menu
            driver.find_element_by_xpath(xpaths['navService']).click()
            # allowing the button to load
            time.sleep(1)
            print (" turning on the ssh service")
            # scroll down
            driver.find_element_by_tag_name('body').send_keys(Keys.END)
            time.sleep(2)
            function.status_change(driver, self, "14", "start")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_02_checkif_ssh_on (self):
        try:
            print (" check if ssh turned on")
            time.sleep(2)
            #status check
            function.status_check(driver, "14")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_03_configure_ssh(self):
        try:
            print (" configuring ssh service with root access")
            time.sleep(2)
            # click on configure button
            driver.find_element_by_xpath(xpaths['configButton']).click()
            # uncheck on Login as Root with Passsword
            driver.find_element_by_xpath('//*[@id="ssh_rootlogin"]/mat-checkbox/label/div').click()
            # click on save button
            driver.find_element_by_xpath('//*[@id="save_button"]').click()
            time.sleep(5)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_04_turnoff_ssh(self):
        try:
            # click Service Menu
            driver.find_element_by_xpath(xpaths['navService']).click()
            # allowing the button to load
            time.sleep(1)
            print (" turning off the ssh service")
            # scroll down
            driver.find_element_by_tag_name('html').send_keys(Keys.END)
            time.sleep(2)
            function.status_change(driver, self, "14", "stop")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_05_checkif_ssh_off (self):
        try:
            print (" check if ssh turned on")
            time.sleep(2)
            #status check
            function.status_check(driver, "14")
            time.sleep(10)
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


    def status_change(self, which, to):
        print ("executing the status change function with input " + which + " + " + to)
        # get the ui element
        ui_element_status=driver.find_element_by_xpath('/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/div[' + str(which) + ']/entity-card/div[1]/div/mat-card[1]/div/div[2]/div[1]/mat-chip')
        # get the status data
        status_data=ui_element_status.text
        buttonToggle = driver.find_element_by_xpath('/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/div[' + str(which) + ']/entity-card/div[1]/div/mat-card[1]/div/div[2]/div[1]/button')
        if to == "start":
            if status_data == "STOPPED":
                # Click on the toggle button
                buttonToggle.click()
                time.sleep(1)
                print ("status has now changed to running")
            else:
                print ("the status is already " + status_data)
        elif to == "stop":
            if status_data == "RUNNING":
                #Click on the toggle button
                buttonToggle.click()
                time.sleep(1)
                # re-confirming if the turning off the service
                if self.is_element_present(By.XPATH,xpaths['turnoffConfirm']):
                    driver.find_element_by_xpath(xpaths['turnoffConfirm']).click()
            else:
                print ("the status is already" + status_data)


    @classmethod
    def tearDownClass(inst):
        pass


def run_conf_ssh_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(conf_ssh_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
