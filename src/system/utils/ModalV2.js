const {
  ModalBuilder,
  LabelBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
  FileUploadBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  ChannelType,
} = require('discord.js');

const toArray = (value) => {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
};

const randomId = (prefix = 'modalv2') => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const makeStringOptions = (options = []) => (
  toArray(options).map((option) => {
    if (option instanceof StringSelectMenuOptionBuilder) return option;

    const built = new StringSelectMenuOptionBuilder()
      .setLabel(String(option?.label || 'Sem título'))
      .setValue(String(option?.value || randomId('opt')));

    if (option?.description) built.setDescription(String(option.description));
    if (option?.emoji) built.setEmoji(option.emoji);
    if (typeof option?.default === 'boolean') built.setDefault(option.default);

    return built;
  })
);

const applyCommonSelect = (select, data = {}) => {
  select.setCustomId(String(data.customId || randomId('select')));
  if (data.placeholder) select.setPlaceholder(String(data.placeholder));
  if (Number.isInteger(data.minValues)) select.setMinValues(data.minValues);
  if (Number.isInteger(data.maxValues)) select.setMaxValues(data.maxValues);
  if (typeof data.disabled === 'boolean') select.setDisabled(data.disabled);
  return select;
};

const buildInnerComponent = (field = {}) => {
  const type = String(field.type || 'text').trim().toLowerCase();

  if (type === 'text') {
    const style = String(field.style || 'short').trim().toLowerCase() === 'paragraph'
      ? TextInputStyle.Paragraph
      : TextInputStyle.Short;

    const input = new TextInputBuilder()
      .setCustomId(String(field.customId || randomId('input')))
      .setStyle(style)
      .setRequired(field.required !== false);

    if (field.placeholder) input.setPlaceholder(String(field.placeholder));
    if (field.value) input.setValue(String(field.value));
    if (Number.isInteger(field.minLength)) input.setMinLength(field.minLength);
    if (Number.isInteger(field.maxLength)) input.setMaxLength(field.maxLength);

    return { method: 'setTextInputComponent', component: input };
  }

  if (type === 'file') {
    const upload = new FileUploadBuilder()
      .setCustomId(String(field.customId || randomId('file')))
      .setRequired(field.required === true);

    if (Number.isInteger(field.minValues)) upload.setMinValues(field.minValues);
    if (Number.isInteger(field.maxValues)) upload.setMaxValues(field.maxValues);

    return { method: 'setFileUploadComponent', component: upload };
  }

  if (type === 'string-select') {
    const select = applyCommonSelect(new StringSelectMenuBuilder(), field);
    const options = makeStringOptions(field.options);
    if (options.length) select.addOptions(options);
    return { method: 'setStringSelectMenuComponent', component: select };
  }

  if (type === 'user-select') {
    const select = applyCommonSelect(new UserSelectMenuBuilder(), field);
    if (Array.isArray(field.defaultUsers) && field.defaultUsers.length) {
      select.setDefaultUsers(...field.defaultUsers);
    }
    return { method: 'setUserSelectMenuComponent', component: select };
  }

  if (type === 'role-select') {
    const select = applyCommonSelect(new RoleSelectMenuBuilder(), field);
    if (Array.isArray(field.defaultRoles) && field.defaultRoles.length) {
      select.setDefaultRoles(...field.defaultRoles);
    }
    return { method: 'setRoleSelectMenuComponent', component: select };
  }

  if (type === 'channel-select') {
    const select = applyCommonSelect(new ChannelSelectMenuBuilder(), field);
    if (Array.isArray(field.channelTypes) && field.channelTypes.length) {
      select.setChannelTypes(...field.channelTypes);
    }
    if (Array.isArray(field.defaultChannels) && field.defaultChannels.length) {
      select.setDefaultChannels(...field.defaultChannels);
    }
    return { method: 'setChannelSelectMenuComponent', component: select };
  }

  if (type === 'mentionable-select') {
    const select = applyCommonSelect(new MentionableSelectMenuBuilder(), field);
    if (Array.isArray(field.defaultValues) && field.defaultValues.length) {
      select.setDefaultValues(...field.defaultValues);
    }
    return { method: 'setMentionableSelectMenuComponent', component: select };
  }

  throw new Error(`Tipo de campo de modal não suportado: ${type}`);
};

class ModalV2Builder {
  constructor() {
    this.modal = new ModalBuilder();
  }

  setCustomId(customId) {
    this.modal.setCustomId(String(customId || randomId('modal')));
    return this;
  }

  setTitle(title) {
    this.modal.setTitle(String(title || 'Modal'));
    return this;
  }

  addTextDisplay(content) {
    this.modal.addTextDisplayComponents(new TextDisplayBuilder().setContent(String(content || '')));
    return this;
  }

  addField(field = {}) {
    const label = new LabelBuilder().setLabel(String(field.label || 'Campo'));

    if (field.description) {
      label.setDescription(String(field.description));
    }

    const built = buildInnerComponent(field);
    label[built.method](built.component);

    this.modal.addLabelComponents(label);
    return this;
  }

  addFields(fields = []) {
    toArray(fields).forEach((field) => this.addField(field));
    return this;
  }

  build() {
    return this.modal;
  }
}

const ModalV2 = {
  builder: () => new ModalV2Builder(),
  createId: randomId,
  channelTypes: ChannelType,
  textStyles: TextInputStyle,
  classes: {
    ModalBuilder,
    LabelBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    FileUploadBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    UserSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    MentionableSelectMenuBuilder,
  },
};

module.exports = ModalV2;
