# Baller

Baller organizes your configuration files.

Use Baller to create a "ball" for a configuration files. Once you've put your configuration files in a ball, it's easy to install, update, and uninstall your configuration files on all of your different computers. And share with others.


## Install

    $ npm install -g baller


## Create

There are two ways to create a ball: Create from scratch, or create from existing files. To create a new ball in a new directory:

    $ baller create <name>

This will create a new directory with a README and all of the Baller scripts. The Baller scripts will have no effect, however, until files are added to the directory and the file(s) names are added to `files`.

Alternatively, a ball can be created from an existing directory which will be functional immediately:

    $ baller init

This adds a README and the Baller scripts to the current directory and also adds an entry to each of the initial files to `files`.


## Update

To update an existing ball to the latest Baller scripts:

    $ baller update


## Unball

To take an existing ball and remove all Baller-introduced files:

    $ baller unball


## Deploy

To share your ball with others:

    $ baller deploy

This will publicly deploy your current working ball to GitHub at `https://github.com/<username>/<ball>`. If this project does not exist, it will be created. Otherwise, the project will be updated.


## Example balls

- [https://github.com/jbrudvik/bash-config]()
