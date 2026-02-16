const fs = require('fs');
const path = require('path');
const settings = require('../settings.js');
const Logger = require('../utils/Logger');
const ApplicationCommand = require('../structures/ApplicationCommand');
const PrefixCommand = require('../structures/PrefixCommand');
const Event = require('../structures/Event');


const DEFAULT_MODULES_PATH = path.resolve(__dirname, '../../modules');

function Plural(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

const READY_EVENT = 'clientReady';
const isClientReady = (client) => (typeof client.isReady === 'function' ? client.isReady() : Boolean(client.readyAt));

const registerSlashCommands = async (client, commands, context = '') => {
  try {
    const registerType = settings.COMMANDS.TYPE;
    
    // REGISTRO GLOBAL
    if (registerType === 'GLOBAL') {
      Logger.info(`(SLASH) Registrando ${commands.length} comandos globalmente...`);
      await client.application.commands.set(commands);
      Logger.success(`(SLASH) Comandos globais registrados com sucesso!`);
      return;
    }

    // REGISTRO POR GUILD (Permite múltiplos servidores)
    const allowedGuilds = settings.COMMANDS.SERVER_GUILDS || [];
    
    if (!allowedGuilds.length) {
      Logger.warn('(SLASH) Modo GUILD ativado mas nenhum servidor configurado em COMMANDS.SERVER_GUILDS.');
      return;
    }

    await new Promise(r => setTimeout(r, 1200));
    console.log("\n")
    Logger.system(`(SLASH) Iniciando sincronização em ${allowedGuilds.length} servidores restritos.`);

    for (const guildId of allowedGuilds) {
        if (!guildId) continue;
        
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          Logger.warn(`(SLASH) Servidor ${guildId} não encontrado ou bot sem acesso.`);
          continue;
        }
    
        await guild.commands.set(commands).then(() => {
            Logger.success(`(SLASH) Sincronizado em: ${guild.name} (${guild.id})`);
        }).catch(err => {
            Logger.error(`(SLASH) Falha em ${guild.id}: ${err.message}`);
        });
    }

  } catch (err) {
    Logger.error(`(SLASH) Erro fatal no registro de comandos: ${err.message}`);
  }
};


const syncCommands = (client, commands, context = '') => {
  if (!commands || !commands.length) {
    Logger.warn('(SLASH) Nenhum comando disponível para sincronizar.');
    return Promise.resolve();
  }

  if (isClientReady(client)) {
    return registerSlashCommands(client, commands, context);
  }

  return new Promise((resolve) => {
    const handler = () => {
      registerSlashCommands(client, commands, context).finally(resolve);
    };
    client.once(READY_EVENT, handler);
  });
};

// ---------------------------------------------------------------------------------------------------------------------
// CARREGAMENTO DE COMANDOS SLASH DE CADA MÓDULO
// ---------------------------------------------------------------------------------------------------------------------
function LoadCommands(client, commandsPath, moduleName) {
  let count = 0;
  if (!fs.existsSync(commandsPath)) return count;

  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.resolve(commandsPath, file);
    try {
      const cmdImport = require(filePath);
      let cmd = cmdImport;

      if (cmdImport instanceof ApplicationCommand) {
        cmd = cmdImport;
      } else if (typeof cmdImport === 'function' && cmdImport.prototype instanceof ApplicationCommand) {
        cmd = new cmdImport();
      }

      // Suporte ao formato "command"
      const meta = cmd?.command || cmd;

      if (!meta || typeof meta !== 'object' || !meta.name || typeof meta.name !== 'string') {
        Logger.warn(`[${moduleName}] Comando inválido em ${file}: deve ter 'name' como string.`);
        continue;
      }

      client.slashCommands.set(meta.name, cmd);
      count++;
    } catch (err) {
      Logger.error(`[${moduleName}] Erro ao carregar comando ${file}: ${err.message}`);
    }
  }
  return count;
}

function LoadPrefixCommands(client, commandsPath, moduleName) {
  let count = 0;
  if (!fs.existsSync(commandsPath)) return count;

  const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.resolve(commandsPath, file);
    try {
      const cmdImport = require(filePath);
      let cmd = cmdImport;

      if (cmdImport instanceof PrefixCommand) {
        cmd = cmdImport;
      } else if (typeof cmdImport === 'function' && cmdImport.prototype instanceof PrefixCommand) {
        cmd = new cmdImport();
      }

      const meta = cmd?.command || cmd;
      const commandName = String(meta?.name || '').trim().toLowerCase();
      const run = meta?.run;

      if (!commandName || typeof run !== 'function') {
        Logger.warn(`[${moduleName}] Prefix command inválido em ${file}: precisa de name e run.`);
        continue;
      }

      const normalizedCommand = {
        ...meta,
        name: commandName,
        aliases: Array.isArray(meta.aliases)
          ? meta.aliases.map(alias => String(alias).trim().toLowerCase()).filter(Boolean)
          : [],
      };

      client.prefixCommands.set(commandName, normalizedCommand);

      for (const alias of normalizedCommand.aliases) {
        client.prefixAliases.set(alias, commandName);
      }

      count++;
    } catch (err) {
      Logger.error(`[${moduleName}] Erro ao carregar prefix command ${file}: ${err.message}`);
    }
  }

  return count;
}

// ---------------------------------------------------------------------------------------------------------------------
// CARREGAMENTO DE EVENTOS
// ---------------------------------------------------------------------------------------------------------------------
function LoadEvents(client, eventsPath, moduleName) {
  let count = 0;
  if (!fs.existsSync(eventsPath)) return count;

  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.resolve(eventsPath, file);
    try {
      const modImport = require(filePath);
      let mod = modImport;
      let eventName, handler, once = false;

      if (typeof mod === 'function') {
        eventName = file.replace(/\.js$/, '');
        handler = mod.bind(null, client);
      } else if (typeof mod === 'object' && mod.name && typeof mod.execute === 'function') {
        eventName = mod.name;
        handler = mod.execute.bind(mod, client);
        once = Boolean(mod.once);
      } else if ((modImport instanceof Event) || (typeof modImport === 'function' && modImport.prototype instanceof Event)) {
        const ev = modImport instanceof Event ? modImport : new modImport();
        eventName = ev.data?.event || ev.event;
        handler = (ev.data?.run || ev.run).bind(null, client);
        once = Boolean(ev.data?.once || ev.once);
      } else if (typeof mod === 'object' && mod.event && typeof mod.run === 'function') {
        eventName = mod.event;
        handler = mod.run.bind(null, client);
        once = Boolean(mod.once);
      } else {
        Logger.warn(`[${moduleName}] Evento inválido em ${file}: deve ser função, classe ou objeto com execute.`);
        continue;
      }

      if (once) client.once(eventName, handler);
      else client.on(eventName, handler);

      count++;
    } catch (err) {
      Logger.error(`[${moduleName}] Erro ao carregar evento ${file}: ${err.message}`);
    }
  }
  return count;
}

// ---------------------------------------------------------------------------------------------------------------------
// CARREGAMENTO DE SCRIPTS
// ---------------------------------------------------------------------------------------------------------------------
function loadScripts(client, scriptsPath, moduleName) {
  let count = 0;
  if (!fs.existsSync(scriptsPath)) return count;

  const files = fs.readdirSync(scriptsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.resolve(scriptsPath, file);
    try {
      const script = require(filePath);

      if (script == null) {
        continue;
      }

      if (typeof script === 'object' && Object.keys(script).length === 0) {
        continue;
      }

      if (typeof script !== 'function') {
        Logger.warn(
          `[${moduleName}] Script inválido em ${file}: deve exportar uma função (module.exports = function (client) { ... }).`.yellow
        );
        continue;
      }

      script(client);
      count++;
    } catch (err) {
      Logger.error(
        `[${moduleName}] Erro ao executar script ${file} (${filePath}):`.red,
        err.message
      );
    }
  }

  return count;
}

// ---------------------------------------------------------------------------------------------------------------------
// LOADER PRINCIPAL
// ---------------------------------------------------------------------------------------------------------------------
module.exports = (client, modulesPath = DEFAULT_MODULES_PATH, reload = false) => {
  if (!client.slashCommands) client.slashCommands = new Map();
  if (!client.prefixCommands) client.prefixCommands = new Map();
  if (!client.prefixAliases) client.prefixAliases = new Map();
  const prefixCommandsEnabled = Boolean(settings?.COMMANDS?.PREFIX_COMMANDS_ENABLED);

  client.syncSlashCommands = (reason = 'manual') => {
    const commands = Array.from(client.slashCommands?.values?.() || [])
      .map(cmd => cmd?.command || cmd?.data || cmd)
      .filter(Boolean);
    return syncCommands(client, commands, reason);
  };

  if (client.__modulesLoaded && !reload) {
    Logger.info('[MÓDULOS] Módulos já carregados. Use reload=true para recarregar.');
    return;
  }

  client.__modulesLoaded = true;

  if (!fs.existsSync(modulesPath)) {
    Logger.error('(ERRO) Pasta de módulos não encontrada em:', modulesPath);
    return;
  }

  const perModuleSummary = [];
  let totalCmds = 0, totalPrefixCmds = 0, totalEvents = 0, totalScripts = 0;

  // -------------------------------------------------------------------------------------------------------------------
  // CARREGAMENTO DOS MÓDULOS
  // -------------------------------------------------------------------------------------------------------------------
  const entries = fs.readdirSync(modulesPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const moduleName of entries) {
    const base = path.join(modulesPath, moduleName);

    const moduleCmds = LoadCommands(client, path.join(base, 'commands'), moduleName);
    const modulePrefixCmds = prefixCommandsEnabled
      ? (
        LoadPrefixCommands(client, path.join(base, 'prefix'), moduleName) +
        LoadPrefixCommands(client, path.join(base, 'prefixCommands'), moduleName)
      )
      : 0;
    const moduleEvents = LoadEvents(client, path.join(base, 'events'), moduleName);
    const moduleScripts = loadScripts(client, path.join(base, 'scripts'), moduleName);

    totalCmds += moduleCmds;
    totalPrefixCmds += modulePrefixCmds;
    totalEvents += moduleEvents;
    totalScripts += moduleScripts;

    perModuleSummary.push({ moduleName, moduleCmds, modulePrefixCmds, moduleEvents, moduleScripts });
  }

  console.log(`\n${'[MÓDULOS]'.green.bold} Carregamento concluído em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  
  let modulesNumberList = 1;
  perModuleSummary.forEach(m => {

    console.log(
      ` ${String(modulesNumberList++).white}. ${m.moduleName.white}: ` +
      `${Plural(m.moduleCmds, 'comando', 'comandos').gray.bold}, ` +
      `${Plural(m.modulePrefixCmds, 'prefix', 'prefixes').gray.bold}, ` +
      `${Plural(m.moduleEvents, 'evento', 'eventos').gray.bold}, ` +
      `${Plural(m.moduleScripts, 'script', 'scripts').gray.bold}`
    );
  });

  console.log(
    ` ${'TOTAL:'.cyan.bold} ` +
    `${Plural(totalCmds, 'comando', 'comandos')}, ` +
    `${Plural(totalPrefixCmds, 'prefix', 'prefixes')}, ` +
    `${Plural(totalEvents, 'evento', 'eventos')}, ` +
    `${Plural(totalScripts, 'script', 'scripts')}\n`
  );

  client.syncSlashCommands('carregamento inicial');

  // 🔁 Função de reload opcional
  client.reloadModules = () => {
    Object.keys(require.cache).forEach(key => {
      if (key.includes(modulesPath)) delete require.cache[key];
    });
    client.slashCommands.clear();
    client.prefixCommands.clear();
    client.prefixAliases.clear();
    client.__modulesLoaded = false;
    module.exports(client, modulesPath, true);
  };
};
