import type {
    ApplicationCommandType,
    AutocompleteInteraction,
    CacheType,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
    MessageApplicationCommandData,
    MessageContextMenuCommandInteraction,
    UserApplicationCommandData,
    UserContextMenuCommandInteraction
} from "discord.js"

type Name<N extends string> = N extends ""
    ? never
    : N extends `${string} ${string}`
      ? never
      : N extends Lowercase<N>
        ? N
        : never

type Cached<D> = D extends false ? "cached" : CacheType

type CommandProps<
    N extends string,
    T,
    D extends boolean = false
> = T extends ApplicationCommandType.ChatInput
    ? ChatInputApplicationCommandData & {
          name: Name<N>
          autocomplete?(interaction: AutocompleteInteraction<Cached<D>>): void
          run(interaction: ChatInputCommandInteraction<Cached<D>>): Promise<any>
      }
    : T extends ApplicationCommandType.Message
      ? MessageApplicationCommandData & {
            run(
                interaction: MessageContextMenuCommandInteraction<Cached<D>>
            ): Promise<any>
        }
      : T extends ApplicationCommandType.User
        ? UserApplicationCommandData & {
              run(
                  interaction: UserContextMenuCommandInteraction<Cached<D>>
              ): Promise<any>
          }
        : never

export type CommandData<
    N extends string,
    T extends ApplicationCommandType,
    D extends boolean = false
> = CommandProps<N, T, D> & {
    name: string
    direct?: D
    global?: boolean
}
