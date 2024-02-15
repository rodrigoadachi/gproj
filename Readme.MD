# gproj

## Descrição

gproj é um pacote npm que permite organizar seus repositórios em pastas por projeto, cria tasks para o vscode e ajuda com os backups dos arquivos .env

## Instalação

Para instalar o gproj globalmente, você pode usar o seguinte comando:

```bash
npm install -g gproj
```

## Configuração

O gproj usa um arquivo de configuração JSON para…

Exemplo de arquivo de configuração config.json:

```
{
  "config": {
    "path": "./projects", << Pasta base onde serão organizados os repositórios
    "envfiles": "./envfiles" << Pasta onde serão armazenados os arquivos env
  },
  "projects": [
    {
      "name": "client-projeto", << Nome do projeto
      "path": "client/projeto", << Pasta do projeto
      "repositories": [
        {
          "path": "api", << Pasta que será criada dentro do projeto para este repositório
          "repository": "git@ssh....." << Caminho do repositório
        },
        ... << Pode adicionar mais repositórios
      ],
      "tasks": [ << Tasks é uma ferramenta do VSCode para automatizar os processos
        {
          "label": "setupNodeEnv", << Nome da tarefa
          "command": "cd ./api; yarn install", << Comando de execução da tarefa
          "group": "install" << Grupo de terminais
        },
        {
          "label": "api",
          "command": "cd ./api; yarn start:dev",
          "group": "api",
          "dependsOn": ["setupNodeEnv"] << Dependencia
        },
        ... << Pode adicionar mais tasks
      ]
    }
    ... << Pode adicionar mais projetos
}
```

## Uso

Aqui estão alguns exemplos de como você pode usar o gproj:

Na pasta onde está o arquivo conf.json você pode rodar o comando abaixo onde ele iniciará a organizar as pastas, baixar os repositórios apontados no arquivo de configuração e aplicará os arquivos .env

```
gproj 
```

Você também pode passar argumentos para o gproj da seguinte maneira:

```
gproj --config ./myConfigFile.json --envfiles ./backup/envs
```

--config << Caminho do arquivo de configuração, caso não passe este argumento, procurará o config.json

--envfiles << Caminho da pasta de backup dos arquivos de variáveis de ambiente, por padrão buscará no arquivo de configuração, caso não tenha sido definido procurará por ./envfiles

Você também pode passar o argumento --backup para fazer o backup de seus arquivos .env

```
gproj --backup
```

Você pode usar o argumento --clean para remover pastas e arquivos de bloqueio.

```
gproj --clean
```

## Contribuição

Contribuições são sempre bem-vindas. Veja CONTRIBUTING.md para informações sobre como contribuir para este projeto.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE.md para mais detalhes.
