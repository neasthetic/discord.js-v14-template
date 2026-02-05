const path = require('path');
const dotenv = require('dotenv');
const Logger = require('../utils/Logger');
require('colors');

const ENV_Path = path.resolve(__dirname, '../../../.env'); 
const Result = dotenv.config({ path: ENV_Path });

if (Result.error) {
  Logger.warn('[ENV]'.yellow, '.env não encontrado. Usando variáveis de ambiente do sistema.');
}

const VARS = {};
const source = { ...process.env };

for (const [key, value] of Object.entries(source)) {
  let parsedValue = value;
  
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;

  VARS[key] = parsedValue;
}

module.exports = VARS;

