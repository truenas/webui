# Author: Rishabh Chauhan
# License: BSD
# Location for tests of FreeNAS new GUI

from os import getcwd

# ACCOUNTS
# username for the machine
username = "root"
# password for the machine
password = "testing"

# new user with create primary group check
newusername = "usernas"
# new user full name
newuserfname = "user nas"
# new user email
newuseremail = "test@ixsystems.com"
# userpassword
newuserpassword = "abcd1234"
# usergroupname
newgroupname = "groupnas"

# new user with create primary group UNcheck
newusernameuncheck = "usernasuncheck"
# new user full name
newuserfnameuncheck = "user nasuncheck"


# new user with sudo permit
superusername = "supernas"

superuserfname = "super nas"

superuserpassword = "abcd1234"

supergroupname = "supergroupnas"


# STORAGE
pool1 = "testPool1"
pool2 = "testPool2"


results_xml = getcwd() + '/results/'
