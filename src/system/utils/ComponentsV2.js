const {
  AttachmentBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  SectionBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  FileBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ContainerBuilder,
  MessageFlags,
} = require('discord.js');

const toArray = (value) => {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
};

const randomCustomId = (prefix = 'cv2') => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const resolveButtonStyle = (style = 'secondary') => {
  if (typeof style === 'number') return style;

  const map = {
    primary: ButtonStyle.Primary,
    secondary: ButtonStyle.Secondary,
    success: ButtonStyle.Success,
    danger: ButtonStyle.Danger,
    link: ButtonStyle.Link,
    premium: ButtonStyle.Premium,
  };

  const normalized = String(style || '').trim().toLowerCase();
  return map[normalized] ?? ButtonStyle.Secondary;
};

const resolveSeparatorSpacing = (spacing = 'small') => {
  if (typeof spacing === 'number') return spacing;

  const map = {
    small: SeparatorSpacingSize.Small,
    large: SeparatorSpacingSize.Large,
  };

  const normalized = String(spacing || '').trim().toLowerCase();
  return map[normalized] ?? SeparatorSpacingSize.Small;
};

const createText = (content = '') => new TextDisplayBuilder().setContent(String(content || ''));

const createButton = (data = {}) => {
  const button = new ButtonBuilder()
    .setStyle(resolveButtonStyle(data.style));

  if (data.label) button.setLabel(String(data.label));
  if (data.emoji) button.setEmoji(data.emoji);

  const style = resolveButtonStyle(data.style);

  if (style === ButtonStyle.Link) {
    if (!data.url) throw new Error('Botão Link precisa de "url".');
    button.setURL(String(data.url));
  } else {
    button.setCustomId(String(data.customId || randomCustomId('btn')));
  }

  if (typeof data.disabled === 'boolean') button.setDisabled(data.disabled);

  return button;
};

const createSelectOption = (data = {}) => {
  const option = new StringSelectMenuOptionBuilder()
    .setLabel(String(data.label || 'Sem título'))
    .setValue(String(data.value || randomCustomId('opt')));

  if (data.description) option.setDescription(String(data.description));
  if (data.emoji) option.setEmoji(data.emoji);
  if (typeof data.default === 'boolean') option.setDefault(data.default);

  return option;
};

const createSelectMenu = (data = {}) => {
  const select = new StringSelectMenuBuilder()
    .setCustomId(String(data.customId || randomCustomId('select')))
    .setPlaceholder(String(data.placeholder || 'Selecione uma opção...'));

  if (Number.isInteger(data.minValues)) select.setMinValues(data.minValues);
  if (Number.isInteger(data.maxValues)) select.setMaxValues(data.maxValues);
  if (typeof data.disabled === 'boolean') select.setDisabled(data.disabled);

  const options = toArray(data.options).map((option) => (
    option instanceof StringSelectMenuOptionBuilder ? option : createSelectOption(option)
  ));

  if (options.length) select.addOptions(options);

  return select;
};

const createActionRow = (components = []) => {
  const row = new ActionRowBuilder();

  const built = toArray(components).filter(Boolean).map((component) => {
    if (
      component instanceof ButtonBuilder ||
      component instanceof StringSelectMenuBuilder
    ) {
      return component;
    }

    if (component.type === 'select' || component.select === true) {
      return createSelectMenu(component);
    }

    return createButton(component);
  });

  if (built.length) row.addComponents(...built);
  return row;
};

const createMediaItem = (data = {}) => {
  const item = new MediaGalleryItemBuilder().setURL(String(data.url || data.URL || ''));

  if (data.description) item.setDescription(String(data.description));
  if (typeof data.spoiler === 'boolean') item.setSpoiler(data.spoiler);

  return item;
};

const createMediaGallery = (items = []) => {
  const gallery = new MediaGalleryBuilder();
  const builtItems = toArray(items).filter(Boolean).map((item) => (
    item instanceof MediaGalleryItemBuilder ? item : createMediaItem(item)
  ));

  if (builtItems.length) gallery.addItems(...builtItems);
  return gallery;
};

const createFileComponent = (url) => new FileBuilder().setURL(String(url));

const createSeparator = (spacing = 'small', divider = true) => (
  new SeparatorBuilder()
    .setSpacing(resolveSeparatorSpacing(spacing))
    .setDivider(Boolean(divider))
);

const createSection = ({ texts = [], button = null } = {}) => {
  const section = new SectionBuilder();

  const textComponents = toArray(texts)
    .filter(Boolean)
    .map((text) => (text instanceof TextDisplayBuilder ? text : createText(text)));

  if (textComponents.length) section.addTextDisplayComponents(...textComponents);

  if (button) {
    section.setButtonAccessory(button instanceof ButtonBuilder ? button : createButton(button));
  }

  return section;
};

class ComponentsV2Builder {
  constructor() {
    this.container = new ContainerBuilder();
    this.attachments = [];
  }

  setAccentColor(color) {
    if (color != null) this.container.setAccentColor(color);
    return this;
  }

  addText(content) {
    this.container.addTextDisplayComponents(createText(content));
    return this;
  }

  addSection(data) {
    this.container.addSectionComponents(createSection(data));
    return this;
  }

  addMedia(items) {
    this.container.addMediaGalleryComponents(createMediaGallery(items));
    return this;
  }

  addFile(url) {
    this.container.addFileComponents(createFileComponent(url));
    return this;
  }

  addSeparator(spacing = 'small', divider = true) {
    this.container.addSeparatorComponents(createSeparator(spacing, divider));
    return this;
  }

  addButtons(buttons = []) {
    this.container.addActionRowComponents(createActionRow(buttons));
    return this;
  }

  addSelectMenu(data = {}) {
    this.container.addActionRowComponents(createActionRow([{ ...data, type: 'select' }]));
    return this;
  }

  addAttachment(file, name) {
    const attachment = file instanceof AttachmentBuilder
      ? file
      : new AttachmentBuilder(file, name ? { name } : undefined);

    this.attachments.push(attachment);
    return this;
  }

  build(options = {}) {
    const extraFlags = Number.isInteger(options.flags) ? options.flags : 0;

    return {
      components: [this.container],
      files: this.attachments,
      flags: MessageFlags.IsComponentsV2 | extraFlags,
    };
  }
}

const ComponentsV2 = {
  builder: () => new ComponentsV2Builder(),
  container: () => new ContainerBuilder(),
  text: createText,
  button: createButton,
  section: createSection,
  mediaItem: createMediaItem,
  mediaGallery: createMediaGallery,
  file: createFileComponent,
  separator: createSeparator,
  row: createActionRow,
  selectOption: createSelectOption,
  selectMenu: createSelectMenu,
  attachment: (file, name) => new AttachmentBuilder(file, name ? { name } : undefined),
  styles: {
    button: ButtonStyle,
    separator: SeparatorSpacingSize,
  },
  classes: {
    AttachmentBuilder,
    TextDisplayBuilder,
    ButtonBuilder,
    SectionBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    FileBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ContainerBuilder,
  },
  messageFlags: MessageFlags,
  composeFlags: (...flags) => {
    const validFlags = flags.filter((value) => Number.isInteger(value));
    return validFlags.reduce((acc, current) => acc | current, MessageFlags.IsComponentsV2);
  },
};

module.exports = ComponentsV2;
