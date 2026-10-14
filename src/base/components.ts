import {
    type ComponentData,
    type ContainerData,
    type CreateFileOptions,
    type FileSource,
    type MediaGallerySource,
    type SectionData,
    type ThumbnailData,
    isAnySelectMenuBuilder,
    isAttachment
} from "#base/protocols/components"
import {
    ActionRowBuilder,
    type AnyComponentBuilder,
    Attachment,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    type ColorResolvable,
    ContainerBuilder,
    FileBuilder,
    type LinkButtonComponentData,
    MediaGalleryBuilder,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    ThumbnailBuilder,
    resolveColor
} from "discord.js"

export function createRow<Component extends AnyComponentBuilder>(
    ...components: Component[]
) {
    return new ActionRowBuilder<Component>({ components })
}

export function createLinkButton(
    data: Omit<LinkButtonComponentData, "style" | "type">
) {
    if (!data.label) data.label = data.url
    return new ButtonBuilder({
        style: ButtonStyle.Link,
        ...data
    })
}

export function createTextDisplay(content: string) {
    return new TextDisplayBuilder({
        content
    })
}

export function createMediaGallery(
    ...items: (MediaGallerySource | MediaGallerySource[])[]
): MediaGalleryBuilder {
    return new MediaGalleryBuilder({
        items: items
            .flat()
            .filter((v) => v !== null && v !== undefined)
            .map((item) => {
                if (typeof item === "string") {
                    return { media: { url: item } }
                }
                if (isAttachment(item)) {
                    return { media: { url: `attachment://${item.name}` } }
                }
                return item
            })
    })
}

export function createFile(
    source: FileSource,
    options: CreateFileOptions = {}
): FileBuilder {
    const prefix = "attachment://"
    const url =
        source instanceof AttachmentBuilder || source instanceof Attachment
            ? `${prefix}${source.name}`
            : source

    return new FileBuilder({
        spoiler: options.spoiler,
        file: {
            ...options,
            url
        }
    })
}

export function createSeparator(
    divider?: boolean,
    large?: boolean
): SeparatorBuilder {
    return new SeparatorBuilder({
        divider: divider,
        spacing: large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small
    })
}

export function createThumbnail(data: ThumbnailData): ThumbnailBuilder {
    const thumbnail = new ThumbnailBuilder()

    if (typeof data === "string") {
        return thumbnail.setURL(data)
    }
    if (data instanceof AttachmentBuilder || data instanceof Attachment) {
        return thumbnail
            .setURL(`attachment://${data.name}`)
            .setSpoiler(data.spoiler)
    }
    return new ThumbnailBuilder(data)
}

export function createSection(data: SectionData): SectionBuilder {
    const section = new SectionBuilder()

    if (data.button) {
        section.setButtonAccessory(data.button)
    }
    if (data.thumbnail) {
        section.setThumbnailAccessory(createThumbnail(data.thumbnail))
    }

    if (Array.isArray(data.content)) {
        section.addTextDisplayComponents(data.content.map(createTextDisplay))
    } else {
        section.addTextDisplayComponents(createTextDisplay(data.content))
    }
    return section
}

export function createComponents(...items: ComponentData[]) {
    return items
        .filter((value) => value !== null && value !== undefined)
        .filter((value) => typeof value !== "boolean")
        .map((component) => {
            if (typeof component === "string") {
                return createTextDisplay(component)
            }

            if (Array.isArray(component)) {
                return createRow(...component)
            }

            if (component instanceof ButtonBuilder) {
                return createRow(component)
            }

            if (isAnySelectMenuBuilder(component)) {
                return createRow(component)
            }

            if (isAttachment(component)) {
                return createMediaGallery(component)
            }

            return component
        })
}

export function createContainer(
    color: ColorResolvable | false,
    ...items: (ContainerData | false)[]
): ContainerBuilder {
    const container = new ContainerBuilder()

    if (color) container.setAccentColor(resolveColor(color))

    for (const component of items) {
        if (typeof component === "string") {
            container.addTextDisplayComponents(createTextDisplay(component))
        }

        if (component instanceof TextDisplayBuilder) {
            container.addTextDisplayComponents(component)
        }

        if (component instanceof ActionRowBuilder) {
            container.addActionRowComponents(component)
        }

        if (component instanceof FileBuilder) {
            container.addFileComponents(component)
        }

        if (
            isAnySelectMenuBuilder(component) ||
            component instanceof ButtonBuilder
        ) {
            container.addActionRowComponents(createRow(component))
        }

        if (component instanceof SectionBuilder) {
            container.addSectionComponents(component)
        }

        if (component instanceof MediaGalleryBuilder) {
            container.addMediaGalleryComponents(component)
        }

        if (isAttachment(component)) {
            container.addMediaGalleryComponents(createMediaGallery(component))
        }

        if (component instanceof SeparatorBuilder) {
            container.addSeparatorComponents(component)
        }
    }

    return container
}
