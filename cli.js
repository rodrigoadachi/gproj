#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const yargs = require('yargs');
const backupenvs = require('./backupenvs.js');
const cleanfolders = require('./cleanfolders.js');
const packageJson = require('./package.json');

const argv = yargs
  .option('config', {
    alias: 'c',
    describe: 'Path to the JSON configuration file'
  })
  .option('envfiles', {
    alias: 'e',
    describe: 'Path to the .env files folder'
  })
  .option('backup', {
    describe: 'Run .env files backup script'
  })
  .option('clean', {
    alias: 'cls',
    describe: 'Remove folders and lock files',
    boolean: true
  })
  .option('help', {
    alias: 'h',
    describe: 'Show help',
    boolean: true
  })
  .argv;

  if (argv.version) {
    console.log(`Package version: ${packageJson.version}`);
    process.exit(0);
  }
  
  if (argv.help) {
    yargs.showHelp();
    process.exit(0);
  }
  
  
function createFolder(path) {
  try {
    fs.mkdirSync(path, { recursive: true });
    console.log(`Folder created at: ${path}`);
  } catch (error) {
    console.error(`Failed to create folder: ${error}`);
  }
}

function downloadRepository(url, path) {
  try {
    console.log(`Downloading repository to: ${path} ...`);
    execSync(`git clone ${url} ${path}`);
    console.log(`Download complete`);
  } catch (error) {
    console.error(`Failed to download repository: ${error}`);
  }
}

function copyEnvFiles(project, baseFolder, envFilesPath, repoPath) {
  const envFileName = `${project.name}-${repoPath}.env`;
  const envFolderPath = path.resolve(envFilesPath || './envfiles');
  const envFilePath = path.join(envFolderPath, envFileName);
  const destinationPath = path.join(baseFolder, project.path, repoPath);
  const destinationEnvPath = path.join(destinationPath, '.env');

  if (fs.existsSync(envFilePath) && fs.existsSync(destinationPath)) {
    fs.copyFileSync(envFilePath, destinationEnvPath);
    console.log(`${envFileName} file copied to ${destinationEnvPath}`);
  } else {
    console.log(`.env file not found for ${project.name}`);
  }
}

function createTasks(project) {
  const tasksJson = {
    version: "2.0.0",
    configurations: {
      type: "node",
      runtimeVersion: "14.21.3",
      request: "launch",
      name: "Launch",
      preLaunchTask: ""
    },
    presentation: {
      echo: false,
      reveal: "always",
      focus: false,
      panel: "dedicated",
      showReuseMessage: true
    },
    tasks: []
  };

  const dependencies = new Set();
  const dependsOnSet = new Set();

  project.tasks.forEach(task => {
    const taskEntry = {
      label: task.label,
      type: "shell",
      command: task.command,
      isBackground: true,
      problemMatcher: [],
      presentation: {},
      dependsOn: task.dependsOn || []
    };

    if (task.group) {
      taskEntry.presentation.group = task.group;
    }

    if (task.dependsOn) {
      dependsOnSet.add(...task.dependsOn);
    }

    tasksJson.tasks.push(taskEntry);
    dependencies.add(task.label);
  });

  dependencies.forEach(dep => dependsOnSet.delete(dep));

  const createTerminalsEntry = {
    label: "Create terminals",
    dependsOn: [...dependencies],
    group: {
      kind: "build",
      isDefault: true
    },
    runOptions: {
      runOn: "folderOpen"
    }
  };

  tasksJson.tasks.push(createTerminalsEntry);

  return tasksJson;
}

function processProject(project, baseFolder, envFilesPath) {
  createFolder(baseFolder);
  if (!project.repositories) {
    console.error(`O projeto ${project.name} não possui repositórios definidos.`);
    return;
  }

  const projectFolderPath = path.join(baseFolder, project.path);
  createFolder(projectFolderPath);

  project.repositories.forEach(repo => {
    const folderDestination = path.join(projectFolderPath, repo.path);
    const urlRepository = repo.repository;

    createFolder(folderDestination);
    downloadRepository(urlRepository, folderDestination);
  });

  project.repositories.forEach(repo => {
    copyEnvFiles(project, baseFolder, envFilesPath, repo.path);
  });

  const vscodePath = path.join(projectFolderPath, '.vscode');
  createFolder(vscodePath);
  const tasksJsonPath = path.join(vscodePath, 'tasks.json');
  const tasksJsonContent = createTasks(project);

  fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJsonContent, null, 2));
}

function readConfigJson(configPath) {
  if (!fs.existsSync(configPath)) {
    console.error(`Configuration file ${configPath} not found.`);
    return;
  }

  const configFileContent = require(configPath);

  let baseFolder;
  if (configFileContent.config && configFileContent.config.path) {
    baseFolder = path.resolve(configFileContent.config.path);
  } else {
    console.log("Parameter 'config.path' not found in JSON file. Using the default folder './projects'.");
    baseFolder = path.resolve('./projects');
  }

  let envFilesFolder;
  if (argv.envfiles) {
    envFilesFolder = argv.envfiles;
  } else if (configFileContent.config && configFileContent.config.envfiles) {
    envFilesFolder = configFileContent.config.envfiles;
  } else {
    console.log("Parameter 'envfiles' not defined in the command line argument or JSON file. Using the default folder './envfiles'.");
    envFilesFolder = './envfiles';
  }

  createFolder(baseFolder);

  configFileContent.projects.forEach(project => {
    processProject(project, baseFolder, envFilesFolder);
  });
}

const configPath = path.resolve(process.cwd(), argv.config || './config.json');
let jsonData;

try {
  jsonData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error('Error reading configuration file. Check if the file is not empty and is well formatted.');
  process.exit(1);
}

if (!jsonData || Object.keys(jsonData).length === 0) {
  console.error('The configuration file is empty. Please provide a valid configuration file.');
  process.exit(1);
}


if (argv.backup)
  backupenvs.readConfigJson(configPath)
else if (argv.clean) {
  const jsonData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const targetDirectory = jsonData.config?.path || './projects';
  const foldersToDelete = ['node_modules', 'vendor'];
  cleanfolders.deleteFoldersRecursively(targetDirectory, foldersToDelete);
}
 else
  readConfigJson(configPath);
