import { readdir } from "node:fs/promises"
import { extname, join } from "node:path"
import { pathToFileURL } from "node:url"

export async function loadDirectory(
    dirname: string,
    validExtensions: string[] = [".js", ".ts"],
    excludeFolders: string[] = []
) {
    const files: string[] = []
    async function scan(directory: string, optional = false) {
        const entries = await readdir(directory, { withFileTypes: true }).catch(error => {
            if (optional && error.code === "ENOENT") return []
            throw error
        })
        for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
            const filename = join(directory, entry.name)
            if (entry.isDirectory()) {
                if (!excludeFolders.includes(entry.name)) await scan(filename)
            } else if (!entry.name.endsWith(".d.ts") && validExtensions.includes(extname(entry.name))) {
                files.push(filename)
            }
        }
    }
    await scan(dirname, true)
    const modules: unknown[] = []
    for (const filename of files) {
        try {
            modules.push(await import(pathToFileURL(filename).href))
        } catch (error) {
            throw new Error("Falha ao carregar " + filename, { cause: error })
        }
    }
    return modules
}
