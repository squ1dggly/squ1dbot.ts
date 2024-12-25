import { GuildSlashCommand } from "@customTypes/commands";

import { GuildMember, SlashCommandBuilder } from "discord.js";
import { BetterEmbed, PageNavigator } from "@utils/discordTools";
import { guildManager, userManager } from "@utils/mongo";
import jt from "@utils/jsTools";

import configs from "@configs";

function getKeyPermissions(guildMember: GuildMember): string[] {
    const keyPermissions = [
        { key: "Administrator", value: "Admin" },
        { key: "ManageMessages", value: "Messages" },
        { key: "ManageChannels", value: "Channels" },
        { key: "ManageGuild", value: "Guild" },
        { key: "ManageRoles", value: "Roles" },
        { key: "BanMembers", value: "Ban" },
        { key: "KickMembers", value: "Kick" },
        { key: "MentionEveryone", value: "Mention Everyone" }
    ];

    // Get the permissions of the member
    const member_permissions = guildMember.permissions.toArray();

    // Filter out permissions that are not in the keyPermissions array
    const member_keyPerms = member_permissions
        .map(p => {
            const idx = keyPermissions.findIndex(kp => kp.key === p);

            if (idx >= 0) return `\`${keyPermissions[idx].value}\``;
        })
        // Filter out empty values
        .filter(p => p) as string[];

    // Return the alphabetically sorted permissions array
    return member_keyPerms.sort((a, b) => a.localeCompare(b));
}

export const __command: GuildSlashCommand = {
    category: "Admin",
    options: { emoji: "👤", guildOnly: true, guildAdminOnly: true, deferReply: true },

    builder: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("View information about a user in the server.")
        .addUserOption(option => option.setName("user").setDescription("The user to view info about")),

    execute: async (client, interaction) => {
        const member = interaction.options.get("user", true).member || interaction.member;

        /* - - - - - { Info Embed } - - - - - */
        // const memberWarns = 
    }
};
