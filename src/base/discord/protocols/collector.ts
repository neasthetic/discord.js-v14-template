import type {
    AnySelectMenuInteraction,
    ButtonInteraction,
    CacheType,
    ChannelSelectMenuInteraction,
    Collection,
    MentionableSelectMenuInteraction,
    MessageComponentInteraction,
    ModalMessageModalSubmitInteraction,
    ModalSubmitInteraction,
    RoleSelectMenuInteraction,
    StringSelectMenuInteraction,
    UserSelectMenuInteraction
} from "discord.js"

export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

type Dictionary<R extends string> = R extends `[${infer K}]`
    ? Record<K, string[]>
    : Record<R, string>

export type Params<Path> = Path extends `/${string}`
    ? never
    : Path extends `${string}/`
      ? never
      : Path extends `${infer Segment}/${infer Rest}`
        ? Segment extends `:${infer Param}`
            ? Dictionary<Param> & Params<Rest>
            : Params<Rest>
        : Path extends `:${infer Param}`
          ? Dictionary<Param>
          : {}

export enum CollectorType {
    Row = "Row",
    Modal = "Modal",
    ModalComponent = "Modal component",
    Button = "Button",
    Select = "Select menu",
    StringSelect = "String select menu",
    UserSelect = "User select menu",
    RoleSelect = "Role select menu",
    ChannelSelect = "Channel select menu",
    MentionableSelect = "Mentionable select menu",
    All = "Component or modal"
}

export type GetInteraction<T, C extends CacheType> = T extends CollectorType.Row
    ? MessageComponentInteraction<C>
    : T extends CollectorType.Modal
      ? ModalSubmitInteraction<C>
      : T extends CollectorType.ModalComponent
        ? ModalMessageModalSubmitInteraction<C>
        : T extends CollectorType.Button
          ? ButtonInteraction<C>
          : T extends CollectorType.Select
            ? AnySelectMenuInteraction<C>
            : T extends CollectorType.StringSelect
              ? StringSelectMenuInteraction<C>
              : T extends CollectorType.UserSelect
                ? UserSelectMenuInteraction<C>
                : T extends CollectorType.RoleSelect
                  ? RoleSelectMenuInteraction<C>
                  : T extends CollectorType.ChannelSelect
                    ? ChannelSelectMenuInteraction<C>
                    : T extends CollectorType.MentionableSelect
                      ? MentionableSelectMenuInteraction<C>
                      : T extends CollectorType.All
                        ?
                              | ButtonInteraction<C>
                              | AnySelectMenuInteraction<C>
                              | ModalSubmitInteraction<C>
                        : never

export type CollectorSubitem = Collection<
    string,
    CollectorData<string, unknown, CacheType>
>

export type CollectorData<I, T, C extends CacheType = CacheType> = {
    id: I
    type: T
    cache?: C
    run(
        interaction: GetInteraction<T, C>,
        params: Prettify<Params<I>>
    ): Promise<any>
}
