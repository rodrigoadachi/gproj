const fs = require('fs');
const path = require('path');

function createFolderIfNotExists(folderPath) {
  const currentDirectory = process.cwd();
  const fullPath = path.join(currentDirectory, folderPath);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

function backupEnvFiles(projectFolder, configFolder, project) {
  const currentDirectory = process.cwd();
  for (const repo of project.repositories) {
    const repoPath = path.join(project.path, repo.path);
    const envFilePath = path.join(repoPath, '.env');
    const projectEnvFilePath = path.join(projectFolder, envFilePath);
    const fullEnvFilePath = path.join(currentDirectory, projectEnvFilePath);

    if (fs.existsSync(fullEnvFilePath)) {
      const backupName = `${project.name}-${repo.path}.env`;
      const backupPath = path.join(configFolder, backupName);
      const fullBackupPath = path.join(currentDirectory, backupPath);

      fs.copyFileSync(fullEnvFilePath, fullBackupPath);
      console.log(`Arquivo .env em ${fullEnvFilePath} copiado para ${fullBackupPath}`);
    }
  }
}

function readConfigJson(configJson) {
  const currentDirectory = process.cwd();
  const jsonData = JSON.parse(fs.readFileSync(configJson, 'utf8'));

  for (const project of jsonData.projects || []) {
    const configFolder = jsonData.config?.envfiles;
    const projectFolder = jsonData.config?.path;
    createFolderIfNotExists(configFolder);
    backupEnvFiles(projectFolder, configFolder, project);
  }
}

module.exports = { readConfigJson };
