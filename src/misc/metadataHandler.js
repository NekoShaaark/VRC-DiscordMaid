import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export async function getAllSubcommandMetadata() {
    const commandsDir = path.join(__dirname, "../commands")
    const metadataEntries = [];

    async function walk(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dir, file.name);
            if (file.isDirectory()) {
                await walk(filePath);
            } else if (file.name.endsWith(".js")) {
                const module = await import(url.pathToFileURL(filePath));
                if (module.commandMetadata) {
                    // Deep clone so we don’t mutate the original
                    const meta = JSON.parse(JSON.stringify(module.commandMetadata));

                    // --- sort root-level subcommands
                    if (meta.subcommands) {
                        meta.subcommands = Object.fromEntries(
                            Object.entries(meta.subcommands).sort(([a], [b]) => a.localeCompare(b))
                        );
                    }

                    // --- sort subcommandGroups + their subcommands
                    if (meta.subcommandGroups) {
                        meta.subcommandGroups = Object.fromEntries(
                            Object.entries(meta.subcommandGroups)
                                .sort(([a], [b]) => a.localeCompare(b)) // sort groups
                                .map(([groupName, groupData]) => {
                                    if (groupData.subcommands) {
                                        groupData.subcommands = Object.fromEntries(
                                            Object.entries(groupData.subcommands)
                                                .sort(([a], [b]) => a.localeCompare(b)) // sort subcommands inside groups
                                        );
                                    }
                                    return [groupName, groupData];
                                })
                        );
                    }

                    metadataEntries.push(meta);
                }
            }
        }
    }

    await walk(commandsDir);
    return metadataEntries;
}


export async function flattenMetadata(metadataEntries) {
    const flatMap = new Map()
    for(const meta of metadataEntries){

        //root command
        const base = meta.name
        flatMap.set(base, {
            name: base,
            category: meta.category,
            type: meta.type ?? null,
            permissions: meta.permissions ?? ["USER"],
            description: meta.description,
            usage: meta.usage ?? null,
            examples: meta.examples ?? [],
            subcommands: [
                //subcommands
                ...(meta.subcommands ? Object.entries(meta.subcommands).map(([sub, data]) => ({
                    name: sub,
                    permissions: data.permissions ?? ["USER"],
                    description: data.description,
                    type: "subcommand"
                })) : []),

                //subcommand groups
                ...(meta.subcommandGroups ? Object.entries(meta.subcommandGroups).map(([group, groupData]) => ({
                    name: group,
                    permissions: groupData.permissions ?? ["USER"],
                    description: groupData.description,
                    type: "group"
                })) : [])
            ]
        })

        // Subcommands directly under the command
        if(meta.subcommands){
            for(const [sub, data] of Object.entries(meta.subcommands)){
                const fullSubcommandName = `${base} ${sub}`
                flatMap.set(`${base} ${sub}`, {
                    name: fullSubcommandName,
                    category: meta.category,
                    description: data.description,
                    usage: data.usage ?? [],
                    examples: data.examples ?? [],
                })
            }
        }

        // Subcommand groups + their subcommands
        if(meta.subcommandGroups){
            for(const [group, groupData] of Object.entries(meta.subcommandGroups)){
                // Add group itself (optional)
                const fullGroupName = `${base} ${group}`;
                flatMap.set(`${base} ${group}`, {
                    name: fullGroupName,
                    category: meta.category,
                    type: meta.type ?? "group",
                    permissions: meta.permissions ?? ["USER"],
                    description: groupData.description,
                    usage: null,
                    examples: [],
                    subcommands: groupData.subcommands ? Object.entries(groupData.subcommands).map(([sub, data]) => ({
                        name: sub,
                        permissions: data.permissions ?? ["USER"],
                        description: data.description,
                    })): []
                })

                if(groupData.subcommands){
                    for(const [sub, data] of Object.entries(groupData.subcommands)){
                        const fullSubcommandName = `${base} ${group} ${sub}`
                        flatMap.set(`${base} ${group} ${sub}`, {
                            name: fullSubcommandName,
                            category: meta.category,
                            permissions: data.permissions ?? ["USER"],
                            description: data.description,
                            usage: data.usage ?? [],
                            examples: data.examples ?? []
                        })
                    }
                }
            }
        }
    }

    return flatMap
}