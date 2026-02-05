const { ApplicationCommandType } = require('discord.js');

class ApplicationCommand {
  /**
   * @param {Object} options
   * @param {Object} options.command - Dados do comando (name, description, type, options, etc.)
   * @param {Function} options.run - Função de execução do comando
   * @param {Function} [options.autocomplete] - Autocomplete (opcional)
   */
  constructor(options = {}) {
    if (!options.command || typeof options.command !== 'object') {
      throw new Error('ApplicationCommand precisa de um objeto "command".');
    }

    const { command, run, autocomplete } = options;

    this.command = {
      type: ApplicationCommandType.ChatInput,
      ...command,
    };

    this.name = this.command.name;
    this.description = this.command.description;
    this.type = this.command.type;
    this.options = this.command.options || [];

    this.run = run;
    this.autocomplete = autocomplete;
  }

  toJSON() {
    return {
      ...this.command,
      run: this.run,
      autocomplete: this.autocomplete,
    };
  }
}

module.exports = ApplicationCommand;