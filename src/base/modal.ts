import {
    APIFileUploadComponent,
    Attachment,
    Collection,
    ComponentType,
    FileUploadBuilder,
    LabelBuilder,
    LabelComponentData,
    ModalData,
    TextDisplayBuilder,
    TextDisplayComponentData,
    TextInputBuilder,
    TextInputComponentData,
    TextInputStyle
} from "discord.js"

type ModalComponents =
    | LabelBuilder
    | TextDisplayBuilder
    | string
    | null
    | boolean
    | undefined

type ResolveModalData =
    | { fields: { fields: Collection<string, ModalData> } }
    | { fields: Collection<string, ModalData> }
    | Collection<string, ModalData>

type ModalFieldsRecord = Record<string, string | string[] | boolean | null>

export function modalFieldsToRecord<const T = ModalFieldsRecord>(
    data: ResolveModalData
): T
export function modalFieldsToRecord<const T = ModalFieldsRecord>(
    data: ResolveModalData,
    parse: (record: ModalFieldsRecord) => T
): T
export function modalFieldsToRecord<const T = ModalFieldsRecord>(
    data: ResolveModalData,
    parse?: (record: ModalFieldsRecord) => T
): ModalFieldsRecord | T {
    const collection =
        "fields" in data
            ? "fields" in data.fields
                ? data.fields.fields
                : data.fields
            : data

    const record = collection.reduce((acc, data) => {
        if (data.type === ComponentType.TextInput) {
            acc[data.customId] = data.value
            return acc
        }
        if (data.type === ComponentType.FileUpload) {
            //@ts-ignore
            const attachments = data.attachments as
                | Collection<string, Attachment>
                | undefined
            acc[data.customId] = Array.from(attachments?.values() ?? []).map(
                (data) => data.url
            )
            return acc
        }
        if (data.type === ComponentType.CheckboxGroup) {
            acc[data.customId] = Array.from(data.values)
            return acc
        }
        if (data.type === ComponentType.Checkbox) {
            acc[data.customId] = data.value
            return acc
        }
        if (data.type === ComponentType.RadioGroup) {
            acc[data.customId] = data.value
            return acc
        }
        acc[data.customId] = Array.from(data.values ?? [])
        return acc
    }, {} as ModalFieldsRecord)

    return parse ? parse(record) : record
}

type ModalFields = (LabelComponentData | TextDisplayComponentData)[]

function isDefined<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined
}

export function createModalFields(
    ...components: ModalComponents[]
): ModalFields {
    return components
        .filter((v) => isDefined(v) && typeof v !== "boolean")
        .map((data) => {
            if (typeof data === "string")
                return {
                    type: ComponentType.TextDisplay,
                    content: data
                } satisfies TextDisplayComponentData
            return data.data as unknown as LabelComponentData
        })
}

type CreateInputData = Partial<Omit<TextInputComponentData, "type" | "label">>

export function createTextInput(data: CreateInputData): TextInputBuilder {
    data.style ??= TextInputStyle.Short
    if ("label" in data) delete data.label
    return new TextInputBuilder(data)
}

type FileUploadData = {
    customId?: string
    minValues?: number
    maxValues?: number
    required?: boolean
    id?: number
}

export function createFileUpload(data: FileUploadData): FileUploadBuilder
export function createFileUpload(
    customId: string,
    required?: boolean,
    maxValues?: number,
    minValues?: number
): FileUploadBuilder
export function createFileUpload(
    customId: string,
    maxValues?: number,
    minValues?: number
): FileUploadBuilder
export function createFileUpload(
    arg: FileUploadData | string,
    argB?: boolean | number,
    argC?: number,
    argD?: number
): FileUploadBuilder {
    if (typeof arg === "object") {
        return new FileUploadBuilder({
            custom_id: arg.customId,
            max_values: arg.maxValues,
            min_values: arg.minValues,
            required: arg.required,
            id: arg.id
        })
    }

    const custom_id = arg
    let required: boolean | undefined
    let max_values: number | undefined
    let min_values: number | undefined

    if (typeof argB === "boolean") {
        required = argB
        max_values = argC
        min_values = argD
    } else if (typeof argB === "number") {
        max_values = argB
        min_values = argC
    }

    const data: Partial<APIFileUploadComponent> = { custom_id }

    if (isDefined(required)) data.required = required
    if (isDefined(max_values)) data.max_values = max_values
    if (isDefined(min_values)) data.min_values = min_values

    return new FileUploadBuilder(data)
}
