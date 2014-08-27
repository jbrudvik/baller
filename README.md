# Baller

Baller organizes your configuration files.

Use Baller to create a "ball" for your configuration files. Once you've created a ball for your configuration files, it's easy to install and update them across multiple computers.

Balls contain:

- A `files` subdirectory containing configuration files
- Scripts to manage the configuration files: `install` to home directory, `update` to the latest changes, `uninstall` from home directory
- A `hooks` directory of optional scripts that will be called before/after corresponding ball scripts (e.g., `pre-install`, `post-update`)
- A `README.md` file documenting how to use the configuration files

For a more detailed example, [see an existing ball](https://github.com/jbrudvik/vim-config).

Balls require no dependencies other than Bash and Git.

[![Build status](https://drone.io/github.com/jbrudvik/baller/status.png)](https://drone.io/github.com/jbrudvik/baller/latest)
[![NPM version](http://img.shields.io/npm/v/baller.svg)](https://www.npmjs.org/package/baller)


## Install

    $ npm install -g baller


## Create

There are two ways to create a ball: Create from scratch, or create from existing files. To create a new ball in a new directory:

    $ baller create <name>

This will create a new directory with a README and all of the Baller scripts. The Baller scripts will have no effect, however, until files are added to the `files` subdirectory.

Alternatively, a ball can be created from an existing directory which will be functional immediately:

    $ baller init

This adds a README and the Baller scripts to the current directory and also adds an entry to each of the initial files to `files`.


## Update

Update the current ball to use current versions of Baller scripts:

    $ baller update


## Destroy

Remove all Baller-introduced files and structure from current ball:

    $ baller destroy


## Deploy

Deploy your ball to GitHub:

    $ baller deploy

This will publicly deploy your current working ball to GitHub at `https://github.com/<username>/<ball>`. If this project does not exist, it will be created. Otherwise, the project will be updated.


## Test

    $ npm test


## Example balls

- [https://github.com/jbrudvik/bash-config](https://github.com/jbrudvik/bash-config)
- [https://github.com/jbrudvik/vim-config](https://github.com/jbrudvik/vim-config)
- [https://github.com/jbrudvik/git-config](https://github.com/jbrudvik/git-config)
- [https://github.com/jbrudvik/jshint-config](https://github.com/jbrudvik/jshint-config)
