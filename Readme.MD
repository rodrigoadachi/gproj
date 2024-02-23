# gproj

## Description

gproj is an npm package that allows you to organize your repositories into project folders, create tasks for vscode, and help with backups of .env files.

## Installation

To install gproj globally, you can use the following command:

```bash
npm install -g gproj
```

## Configuration

gproj uses a JSON configuration file to...

Example of a config.json configuration file:

```
{
  "config": {
    "path": "./projects", << Base folder where repositories will be organized
    "envfiles": "./envfiles" << Folder where env files will be stored
  },
  "projects": [
    {
      "name": "client-project", << Project name
      "path": "client/project", << Project folder
      "repositories": [
        {
          "path": "api", << Folder that will be created inside the project for this repository
          "repository": "git@ssh....." << Repository path
        },
        ... << You can add more repositories
      ],
      "tasks": [ << Tasks is a VSCode tool to automate processes
        {
          "label": "setupNodeEnv", << Task name
          "command": "cd ./api; yarn install", << Task execution command
          "group": "install" << Terminal group
        },
        {
          "label": "api",
          "command": "cd ./api; yarn start:dev",
          "group": "api",
          "dependsOn": ["setupNodeEnv"] << Dependency
        },
        ... << You can add more tasks
      ]
    }
    ... << You can add more projects
  ]
}
```

## Usage

Here are some examples of how you can use gproj:

In the folder where the conf.json file is located, you can run the command below which will start organizing the folders, download the repositories pointed to in the configuration file and apply the .env files

```
gproj 
```

You can also pass arguments to gproj as follows:

```
gproj --config ./myConfigFile.json --envfiles ./backup/envs
```

--config << Path to the configuration file, if you don't pass this argument, it will look for config.json

--envfiles << Path to the backup folder of environment variable files, by default it will look in the configuration file, if it is not defined it will look for ./envfiles

You can also pass the --backup argument to backup your .env files

```
gproj --backup
```

You can use the --clean argument to remove folders and lock files.

```
gproj --clean
```

## Contributing

Contributions are always welcome. See CONTRIBUTING.md for information on how to contribute to this project.

## Licença

This project is licensed under the MIT license. See the LICENSE.md file for more details.