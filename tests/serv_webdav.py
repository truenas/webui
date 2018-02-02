# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 3

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

xpaths = { 'navService': "//*[@id='nav-8']/div/a[1]",
           'turnoffConfirm': "/html/body/div[5]/div[3]/div/mat-dialog-container/app-confirm/div[2]/button[1]",
          'status': "/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/service[14]/mat-card/div[2]/div[3]/button"
        }


class configure_webdav_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    def test_01_turnon_webdav (self):
        print (" turning on the webdav service")
        # Click Service Menu
        driver.find_element_by_xpath(xpaths['navService']).click()

        # check if the Services page is open
        time.sleep(1)
        # get the ui element
        ui_element_page=driver.find_element_by_xpath("//*[@id='breadcrumb-bar']/ul/li/a")
        # get the weather data
        page_data=ui_element_page.text
        print ("the Page now is: " + page_data)
        # assert response
        self.assertTrue("Services" in page_data)

        # scroll down
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        self.status_change("17", "start")

    def test_02_configure_webdav(self):
        print (" configuring webdav service")
        time.sleep(1)
        # click on configure button
        driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/service[17]/mat-card/div[2]/div[3]/button").click()
        time.sleep(1)
        # Enter password newuserpassword
        driver.find_element_by_xpath("//*[@id='webdav_password']/mat-input-container/div/div[1]/div/input").clear()
        driver.find_element_by_xpath("//*[@id='webdav_password']/mat-input-container/div/div[1]/div/input").send_keys(newuserpassword)
        # Enter password confirmation newuserpassword
        driver.find_element_by_xpath("//*[@id='webdav_password2']/mat-input-container/div/div[1]/div/input").send_keys(newuserpassword)
        # Click on save button
        driver.find_element_by_xpath("//*[@id='save_button']").click()
        # Next step-- To check if the new user is present in the list via automation

    def test_03_turnoff_webdav (self):
        print (" turning off the webdav service")
        # Click Service Menu
        driver.find_element_by_xpath(xpaths['navService']).click()
        # scroll down
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        self.status_change("17", "stop")
        time.sleep(10)

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
        ui_element_status=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/service[" + str(which) + "]/mat-card/div[2]/div[1]/mat-chip")
        # get the status data
        status_data=ui_element_status.text
        print ("current status is: " + status_data)
        if to == "start":
            if status_data == "STOPPED":
                # Click on the afp toggle button
                driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/service[" + str(which) + "]/mat-card/div[2]/div[1]/button").click()
                time.sleep(1)
                print ("status has now changed to running")
            else:
                print ("the status is already " + status_data)
        elif to == "stop":
            if status_data == "RUNNING":
                #Click on the afp toggle button
                driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/service[" + str(which) + "]/mat-card/div[2]/div[1]/button").click()
                time.sleep(1)
                # re-confirming if the turning off the service
                if self.is_element_present(By.XPATH,xpaths['turnoffConfirm']):
                    driver.find_element_by_xpath(xpaths['turnoffConfirm']).click()
            else: 
                print ("the status is already" + status_data)



    @classmethod
    def tearDownClass(inst):
        pass

def run_configure_webdav_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(configure_webdav_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
