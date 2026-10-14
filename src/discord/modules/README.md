# Modulos

Crie uma pasta por funcionalidade. Arquivos .ts sao carregados automaticamente no desenvolvimento; o build carrega os .js correspondentes. Exporte helpers normalmente e registre handlers com new Command, new Event ou new Collector.

O nucleo nao importa funcionalidades. Valide configuracoes especificas dentro do proprio modulo. Dependencias entre modulos devem ser declaradas na documentacao do modulo; remova ou ajuste os consumidores antes de excluir uma dependencia.

Para remover um modulo, exclua sua pasta e execute npm run build novamente. Reinicie o bot para sincronizar os comandos. Nao ha recarga de modulos em tempo de execucao.
