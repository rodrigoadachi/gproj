const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function deleteFoldersRecursively(directoryPath, folderNames) {
  fs.readdirSync(directoryPath).forEach(item => {
    const itemPath = path.join(directoryPath, item);
    if (fs.lstatSync(itemPath).isDirectory()) {
      if (folderNames.includes(item)) {
        // Remove the desired folder
        const deleteCommand = process.platform === 'win32' ? `rmdir /s /q "${itemPath}"` : `rm -rf "${itemPath}"`;
        execSync(deleteCommand);
        console.log(`Pasta removida: ${itemPath}`);
      } else {
        // If it is not the desired folder, continue the recursive search
        deleteFoldersRecursively(itemPath, folderNames);
      }
    } else {
      if (['package-lock.json', 'yarn.lock', 'composer.lock'].includes(item)) {
        // Remove the desired file
        fs.unlinkSync(itemPath);
        console.log(`Arquivo removido: ${itemPath}`);
      }
    }
  });
}

module.exports = { deleteFoldersRecursively };
