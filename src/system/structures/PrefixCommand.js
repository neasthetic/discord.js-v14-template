class PrefixCommand {
  /**
   * @param {Object} options
   * @param {string} options.name - Nome principal do comando prefixado
   * @param {string[]} [options.aliases] - Aliases opcionais
   * @param {string} [options.description] - Descrição do comando
   * @param {Function} options.run - Função de execução (client, message, args)
   */
  constructor(options = {}) {
    if (!options || typeof options !== 'object') {
      throw new Error('PrefixCommand precisa de um objeto de configuração.');
    }

    if (!options.name || typeof options.name !== 'string') {
      throw new Error('PrefixCommand precisa de um "name" válido.');
    }

    if (typeof options.run !== 'function') {
      throw new Error('PrefixCommand precisa de uma função "run".');
    }

    this.name = options.name.trim().toLowerCase();
    this.aliases = Array.isArray(options.aliases)
      ? options.aliases.map((alias) => String(alias).trim().toLowerCase()).filter(Boolean)
      : [];
    this.description = String(options.description || '').trim();
    this.run = options.run;
  }

  toJSON() {
    return {
      name: this.name,
      aliases: this.aliases,
      description: this.description,
      run: this.run,
    };
  }
}

module.exports = PrefixCommand;
