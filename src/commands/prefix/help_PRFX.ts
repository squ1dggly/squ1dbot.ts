import { PrefixCommand } from "@customTypes/commands";

import { BetterEmbed, PageNavigator } from "@utils/discordTools";
import jt from "@utils/jsTools";

const categoryIcons: { [key: string]: string } = {
    Fun: "🎉",
    Utility: "⚙️"
};

const config = {
    maxPageLength: 10
};

export const __command: PrefixCommand = {
    name: "help",
    description: "View a list of my commands.",
    category: "Utility",
    options: { hidden: true },

    execute: async (client, message, { prefix }) => {
        // Get the current prefix commands and filter out ones that are set to be hidden
        let commands = jt.unique(
            [...client.commands.prefix.all.values()].filter(cmd => !cmd?.options?.hidden),
            "name"
        );

        /* error */
        if (!commands.length) {
            return await message.reply({
                content: "There are no commands available.",
                allowedMentions: { repliedUser: false }
            });
        }

        // Parse command categories
        let categoryNames = jt
            .unique(
                commands.map(cmd => {
                    let _name = cmd?.category || "";
                    let _icon = _name in categoryIcons ? categoryIcons[_name] : null;
                    return { name: _name, icon: _icon };
                }),
                "name"
            )
            // Sort names alphabetically
            .sort((a, b) => a.name.localeCompare(b.name));

        /* - - - - - { Format Commands into List } - - - - - */
        const commandList: { name: string; category?: string; formatted: string }[] = [];
        const categoryEmbeds = [];

        // Iterate through each command
        /*! NOTE: the design of the commands in the list can be edited here */
        for (const command of commands) {
            let listEntry = "- $ICON**$PREFIX$NAME**"
                .replace("$ICON", command.options?.emoji ? `${command.options?.emoji} ` : "")
                .replace("$PREFIX", prefix)
                .replace("$NAME", command.name);

            /* - - - - - { Extra Command Options } - - - - - */
            let extraDetails = [];

            // Add the command description, if it exists
            if (command?.description) extraDetails.push(` - *${command.description}*`);

            // Add the command aliases, if any
            if (command?.aliases?.length)
                extraDetails.push(` - aliases: ${command.aliases.map(a => `\`${a}\``).join(", ")}`);

            // Add an example of how the command's used, if provided
            if (command?.usage) extraDetails.push(` - usage: \`${command.usage}\``);

            // Append the extra details to the original string
            if (extraDetails.length) listEntry += `\n${extraDetails.join("\n")}`;

            // Append the list entry
            commandList.push({
                name: command.name,
                category: command.category,
                formatted: listEntry
            });
        }

        // Iterate through each category and make an embed for it
        for (let category of categoryNames) {
            // Get all the commands for the current category
            let _commands = commandList.filter(cmd => cmd.category === category.name);
            if (!_commands.length) continue;

            // Sort command names alphabetically
            _commands.sort((a, b) => a.name.localeCompare(b.name));

            // Split commands by max page length
            let _command_groups = jt.chunk(_commands, config.maxPageLength);

            /* - - - - - { Create the Embed Page } - - - - - */
            let embeds = [];

            // Iterate through each command group and create an embed for it
            for (let i = 0; i < _command_groups.length; i++) {
                let group = _command_groups[i];

                // Create the embed ( Help Page )
                /*! NOTE: the design of the embed can be edited here */
                let embed = new BetterEmbed({
                    title: `Help`,
                    description: group.map(cmd => cmd.formatted).join("\n"),
                    footer: `Page ${i + 1} of ${_command_groups.length} • Category: $ICON$NAME`
                        .replace("$ICON", category.icon ? `${category.icon} ` : "")
                        .replace("$NAME", category.name)
                });

                // Append the page to the embeds array
                embeds.push(embed);
            }

            // Append the array to the embed category array
            if (embeds.length) categoryEmbeds.push(embeds);
        }

        /* - - - - - { Page Navigation } - - - - - */
        const pageNav = new PageNavigator({
            allowedParticipants: message.author,
            pages: PageNavigator.resolveEmbedsToPages(categoryEmbeds)
        });

        pageNav.addSelectMenuOptions(...categoryNames.map(cat => ({ emoji: cat.icon, label: cat.name })));

        return await pageNav.send(message, { allowedMentions: { repliedUser: false } });
    }
};