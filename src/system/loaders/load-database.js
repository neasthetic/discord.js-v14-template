const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const settings = require('../settings.js');
const config = require('./load-env.js');
const Logger = require('../utils/Logger');

async function LoadSchemas(basePath, db, isLocal) {
  if (!fs.existsSync(basePath)) {
    return;
  }

  const modules = fs.readdirSync(basePath);

  for (const moduleName of modules) {
    const modulePath = path.join(basePath, moduleName);
    const schemaDir = path.join(modulePath, 'schemas');

    if (!fs.existsSync(schemaDir)) {
      continue;
    }

    const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.js'));

    if (!schemaFiles.length) {
      continue;
    }

    for (const file of schemaFiles) {
      const fullPath = path.join(schemaDir, file);
      try {
        const schema = require(fullPath);
        const exported = schema.default || schema;

        if (isLocal && exported.createTable) {
          exported.createTable(db);
        } else if (!isLocal && exported.mongo) {
          exported.mongo();
        } else {
           // Logger.warn(`[SCHEMA] Arquivo ignorado (sem método válido): ${file}`);
        }
      } catch (err) {
        Logger.error(`[SCHEMA] Erro ao carregar ${file}: ${err.message}`);
        process.exit(1);
      }
    }
  }
}

async function ConnectDatabase() {

  if (settings.USE_DATABASE) {

    try {

      const mongoUri = config.MONGODB_URI || config.MONGO_URI;
      if (!mongoUri) {
        Logger.error('[DATABASE) Nenhuma URI encontrada em MONGODB_URI no .env');
        process.exit(1);
      }

      if (config.MONGO_URI && !config.MONGODB_URI) {
        Logger.warn('[DATABASE) A variável MONGO_URI é legada; renomeie para MONGODB_URI assim que possível.');
      }

      const start = Date.now();
      await mongoose.connect(mongoUri, {
        connectTimeoutMS: 8000,
        serverSelectionTimeoutMS: 8000,
      });

      const took = ((Date.now() - start) / 1000).toFixed(2);
      Logger.success(`(DATABASE) Conectado ao banco de dados MongoDB em ${took}s`);
      global.database = mongoose;

      await LoadSchemas(path.resolve(__dirname, '../../modules'), mongoose, false);
      return mongoose;

    } catch (err) {
      Logger.error(`(DATABASE) Falha crítica ao conectar: ${err.message}`);
      process.exit(1);
    }
  } else {
    Logger.warn('\n\n(DATABASE) Conexão com banco de dados desabilitada nas configurações.');
  }
}

module.exports = ConnectDatabase;
