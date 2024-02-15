#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const yargs = require('yargs');
const backupenvs = require('./backupenvs.js');
const packageJson = require('./package.json');

// Define os argumentos da linha de comando usando o yargs
const argv = yargs
  .option('config', {
    alias: 'c',
    describe: 'Caminho para o arquivo de configuração JSON'
  })
  .option('envfiles', {
    alias: 'e',
    describe: 'Caminho para a pasta de arquivos .env'
  })
  .option('backup', {
    describe: 'Executar script de backup de arquivos .env'
  })
  .option('version', {
    alias: 'v',
    describe: 'Mostrar versão do pacote',
    boolean: true
  })
  .option('help', {
    alias: 'h',
    describe: 'Mostrar ajuda',
    boolean: true
  })
  .argv;

  if (argv.version) {
    console.log(`Versão do pacote: ${packageJson.version}`);
    process.exit(0);
  }
  
  // Exibe a ajuda se o argumento --help for fornecido
  if (argv.help) {
    yargs.showHelp();
    process.exit(0);
  }
  
// Função para criar uma pasta se ela não existir
function createFolder(path) {
  try {
    fs.mkdirSync(path, { recursive: true });
    console.log(`Pasta criada em: ${path}`);
  } catch (error) {
    console.error(`Falha ao criar pasta: ${error}`);
  }
}

// Função para baixar um repositório Git
function downloadRepository(url, path) {
  try {
    console.log(`Baixando repositório em: ${path} ...`);
    execSync(`git clone ${url} ${path}`);
    console.log(`Download concluído!`);
  } catch (error) {
    console.error(`Falha ao baixar repositório: ${error}`);
  }
}

// Função para copiar arquivos .env para cada repositório
function copyEnvFiles(project, baseFolder, envFilesPath, repoPath) {
  const envFileName = `${project.name}-${repoPath}.env`;
  // Construa o caminho completo para a pasta de arquivos .env
  const envFolderPath = path.resolve(envFilesPath || './envfiles');
  // Construa o caminho completo para o arquivo .env
  const envFilePath = path.join(envFolderPath, envFileName);
  const destinationPath = path.join(baseFolder, project.path, repoPath);
  const destinationEnvPath = path.join(destinationPath, '.env');

  if (fs.existsSync(envFilePath) && fs.existsSync(destinationPath)) {
    fs.copyFileSync(envFilePath, destinationEnvPath);
    console.log(`${envFileName} file copied to ${destinationEnvPath}`);
  } else {
    console.log(`Arquivo .env não encontrado para ${project.name}`);
  }
}

// Função para criar as tarefas VSCode
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

// Função para processar um projeto
function processProject(project, baseFolder, envFilesPath) {
  // Cria a pasta base conforme o config.path, se ainda não existir
  createFolder(baseFolder);

  if (!project.repositories) {
    console.error(`O projeto ${project.name} não possui repositórios definidos.`);
    return;
  }

  // Cria a pasta do projeto conforme project.path
  const projectFolderPath = path.join(baseFolder, project.path);
  createFolder(projectFolderPath);

  // Clone todos os repositórios do projeto
  project.repositories.forEach(repo => {
    const folderDestination = path.join(projectFolderPath, repo.path);
    const urlRepository = repo.repository;

    createFolder(folderDestination);
    downloadRepository(urlRepository, folderDestination);
  });

  // Após clonar todos os repositórios, copie os arquivos .env
  project.repositories.forEach(repo => {
    copyEnvFiles(project, baseFolder, envFilesPath, repo.path);
  });

  const vscodePath = path.join(projectFolderPath, '.vscode');
  createFolder(vscodePath);
  const tasksJsonPath = path.join(vscodePath, 'tasks.json');
  const tasksJsonContent = createTasks(project);

  fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJsonContent, null, 2));
}

// Função para ler o arquivo de configuração JSON
function readConfigJson(configPath) {
  if (!fs.existsSync(configPath)) {
    console.error(`O arquivo de configuração ${configPath} não foi encontrado.`);
    return;
  }

  const configFileContent = require(configPath);

  let baseFolder;
  if (configFileContent.config && configFileContent.config.path) {
    baseFolder = path.resolve(configFileContent.config.path); // Resolvendo o caminho absoluto do diretório base
  } else {
    console.log("Parâmetro 'config.path' não encontrado no arquivo JSON. Usando a pasta padrão './projects'.");
    baseFolder = path.resolve('./projects');
  }

  let envFilesFolder;
  if (argv.envfiles) {
    envFilesFolder = argv.envfiles;
  } else if (configFileContent.config && configFileContent.config.envfiles) {
    envFilesFolder = configFileContent.config.envfiles;
  } else {
    console.log("Parâmetro 'envfiles' não definido no argumento da linha de comando nem no arquivo JSON. Usando a pasta padrão './envfiles'.");
    envFilesFolder = './envfiles';
  }

  createFolder(baseFolder);

  configFileContent.projects.forEach(project => {
    processProject(project, baseFolder, envFilesFolder);
  });
}

// Lê o arquivo de configuração JSON
const configPath = path.resolve(process.cwd(), argv.config || './config.json');

if (argv.backup)
  backupenvs.readConfigJson(configPath)
else
  readConfigJson(configPath);
