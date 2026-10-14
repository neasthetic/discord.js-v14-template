import {
    type APIUnfurledMediaItem,
    type ActionRowBuilder,
    Attachment,
    AttachmentBuilder,
    type ButtonBuilder,
    ChannelSelectMenuBuilder,
    type ContainerBuilder,
    type FileBuilder,
    type MediaGalleryBuilder,
    type MediaGalleryItemData,
    MentionableSelectMenuBuilder,
    type MessageActionRowComponentBuilder,
    RoleSelectMenuBuilder,
    type SectionBuilder,
    type SeparatorBuilder,
    StringSelectMenuBuilder,
    type TextDisplayBuilder,
    type ThumbnailComponentData,
    UserSelectMenuBuilder
} from "discord.js"

export type ContainerData =
    | string
    | Attachment
    | AttachmentBuilder
    | ButtonBuilder
    | ActionRowBuilder<MessageActionRowComponentBuilder>
    | FileBuilder
    | TextDisplayBuilder
    | SeparatorBuilder
    | SectionBuilder
    | MediaGalleryBuilder

export type ComponentData = ContainerData | ContainerBuilder

export type AnySelectMenuBuilder =
    | StringSelectMenuBuilder
    | UserSelectMenuBuilder
    | RoleSelectMenuBuilder
    | ChannelSelectMenuBuilder
    | MentionableSelectMenuBuilder

export function isAnySelectMenuBuilder(
    value: unknown
): value is AnySelectMenuBuilder {
    return (
        value instanceof StringSelectMenuBuilder ||
        value instanceof UserSelectMenuBuilder ||
        value instanceof RoleSelectMenuBuilder ||
        value instanceof ChannelSelectMenuBuilder ||
        value instanceof MentionableSelectMenuBuilder
    )
}

export function isAttachment(
    value: unknown
): value is Attachment | AttachmentBuilder {
    return value instanceof Attachment || value instanceof AttachmentBuilder
}

export type MediaGallerySource =
    | MediaGalleryItemData
    | string
    | Attachment
    | AttachmentBuilder
    | null
    | undefined

export type FileSource = string | Attachment | AttachmentBuilder

export type CreateFileOptions = Omit<APIUnfurledMediaItem, "url"> & {
    spoiler?: boolean
}

export type ThumbnailData =
    | Partial<Omit<ThumbnailComponentData, "type">>
    | Attachment
    | AttachmentBuilder
    | string

export type SectionAcessoryData =
    | {
          button?: never
          thumbnail: ThumbnailData
      }
    | {
          button: ButtonBuilder
          thumbnail?: never
      }

export type SectionData = SectionAcessoryData & {
    content: string | string[]
}
