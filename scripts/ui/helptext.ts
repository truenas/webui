export const mockExamples = `
The mock command sets mock related configurations through the use of json files.
The repo includes some files for common configurations developers might need for testing.
Developers can also create custom config files. See examples below...

EXAMPLES:

  * Load a custom or included configuration file (guided)

  % ui mock | ui m

  * Generating a custom config file (guided)

  The --generate option will provide a series of prompts that results in the creation of a config.json file.
  After finishing the guided install, it will create the file with the provided selections in src/assets/mock/configs

    % ui mock --generate OR ui m -g
`

export const mockEnclosureExamples = `
EXAMPLES:

  * Retrieve a list of mockable controller models

    % ui mock-opt -M OR ui mock-opt --showcontrollers

  * Retrieve a list of mockable expansion shelf models

    % ui mock-opt -S OR ui mock-opt --showshelves

  * Set the controller model to mock

    % ui mock-opt -m OR ui mock-opt --model

  * Set the expansion shelf models to mock

    NOTE: It will except no argument or empty string to specify no shelves.
    Specifying shelves must be done via a comma separated string

    % ui mock-opt -s 'es24,es24' OR ui mock-opt --shelves 'es24,es24'

  * Enable mock functionality

    % ui mock-opt -e OR ui mock-opt --enable

  * Disable mock functionality

    % ui mock-opt -d OR ui mock-opt --disable

  * Complete configuration example that creates an M50 with two ES24 shelves

    % ui mock-opt -e -m m50 -s 'es24,es24' -a default

`

export const mockDiskExamples = `
The mock-disk command allows developers to mock unassigned disks

EXAMPLES:

  * Create 150 x 12TB disks that are not assigned to any pool

  % ui mock-disk --disksize 12 --diskrepeats 150

  * Create 150 x 12TB disks that are not assigned to any pool using abbreviated syntax

  % ui md -s 12 -r 150
`
export const mockPoolExamples = `
The mock-pool command allows developers to mock a single pool with data topology.
This command offers some different options to update certain aspects of the pool
The most useful option however is the --vdevscenario option. This removes the need
to manually specify every aspect and instead state typical conditions that need to
be tested for.

Supported scenarios include:

- Uniform (default)
- MixedDiskCapacity
- MixedVdevCapacity
- MixedVdevLayout
- MixedVdevWidth
- NoRedundancy


EXAMPLES:

  * Enable mock pool

  % ui mock-pool -e

  * Create 3 x two way mirrors using all 4TB disks

  % ui mock-pool --vdevscenario Uniform --vdevdisksize 4 --vdevrepeats 3

  * Create vdevs with mixed layouts (first vdev is different and subsequent vdevs honor the mock configuration settings)

  % ui mock-pool -v MixedVdevLayout -l Raidz3 -r 150

  * Create vdevs with mixed widths (first vdev has one extra member disk. Subsequent vdevs honor the mock configuration settings)

  % ui mock-pool -v MixedVdevWidth -r 150
`
