const fs = require('fs');
const path = require('path');

function backupEnvFiles(projectFolder, configFolder, project) {
  for (const repo of project.repositories) {
    const repoPath = path.join(project.path, repo.path);
    const envFilePath = path.join(repoPath, '.env');
    const projectEnvFilePath = path.join(projectFolder, envFilePath);

    if (fs.existsSync(projectEnvFilePath)) {
      const backupName = `${project.name}-${repo.path}.env`;
      const backupPath = path.join(configFolder, backupName);

      fs.copyFileSync(projectEnvFilePath, backupPath);
      console.log(`Arquivo .env em ${projectEnvFilePath} copiado para ${backupPath}`);
    }
  }
}

function readConfigJson(configJson) {
  const jsonData = JSON.parse(fs.readFileSync(configJson, 'utf8'));

  for (const project of jsonData.projects || []) {
    const configFolder = jsonData.config?.envfiles || './envfiles';
    backupEnvFiles(jsonData.config?.path, configFolder, project);
  }
}

module.exports = { readConfigJson };