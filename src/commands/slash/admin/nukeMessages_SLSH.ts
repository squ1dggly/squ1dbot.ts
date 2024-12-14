import { GuildSlashCommand } from "@customTypes/commands";

import { Collection, GuildTextBasedChannel, Message, SlashCommandBuilder } from "discord.js";
import { BetterEmbed, awaitConfirm, dTConfig } from "@utils/discordTools";
import jt from "@utils/jsTools";

async function fetchChannelMessages(
    channel: GuildTextBasedChannel,
    lastMessage?: Message,
    cachedMessages?: Collection<string, Message>
): Promise<Collection<string, Message>> {
    const _messages = await channel.messages.fetch({ limit: 100, before: lastMessage?.id || undefined }).catch(() => null);

    if (!_messages || !_messages.size) {
        return cachedMessages?.size ? cachedMessages : new Collection();
    }

    // Merge collections, if applicable
    cachedMessages = cachedMessages
        ? cachedMessages.merge(
              _messages,
              x => ({ keep: true, value: x }),
              y => ({ keep: true, value: y }),
              (x, _) => ({ keep: true, value: x })
          )
        : _messages;

    // Run it back
    return await fetchChannelMessages(channel, _messages.last(), cachedMessages);
}

export const __command: GuildSlashCommand = {
    category: "Admin",
    options: {
        emoji: "💣",
        guildOnly: true,
        guildAdminOnly: true,
        deferReply: true,
        requiredClientPerms: ["ManageMessages"]
    },

    builder: new SlashCommandBuilder()
        .setName("nuke-messages")
        .setDescription("Delete all messages newer than 2 weeks in a channel.")
        .addChannelOption(option => option.setName("channel").setDescription("The channel to nuke"))
        .addBooleanOption(option => option.setName("keep-pins").setDescription("Whether to keep pinned messages")),

    execute: async (client, interaction) => {
        const channel = interaction.options.get("channel")?.channel || interaction.channel;
        const keepPins = (interaction.options.get("keep-pins")?.value as boolean) || false;

        // Make sure the channel is text-based
        if (!channel?.isTextBased()) {
            return interaction.reply({ content: "This command can only be used in a text channel.", ephemeral: true });
        }

        // Let the user know we're fetching the messages
        const reply = await interaction.editReply({
            content: "`⏳` Getting channel messages. This might take a second..."
        });

        /* Fetch all the messages in the channel */
        const twoWeeksAgo = jt.parseTime("-2w", { fromNow: true });
        const messages = (await fetchChannelMessages(channel)).filter(m => {
            return m.id !== reply.id && m.deletable && m.createdTimestamp >= twoWeeksAgo && (keepPins ? !m.pinned : true);
        });
        if (!messages.size) {
            return interaction.editReply({
                content: `I couldn't find any deletable messages in ${channel.toString()}.`
            });
        }

        // Ask for delete confirmation
        const confirmed = await awaitConfirm(interaction, {
            allowedParticipants: interaction.user,
            messageContent: "If you ask me, I think you should just delete the whole server, tbh. 🤷",
            embed: new BetterEmbed({
                color: "Yellow",
                title: "⚠️ Carefully rethink your life choices...",
                description: `You are about to delete ***EVERY MESSAGE*** (${messages.size} of 'em) in ${channel.toString()}.`
            })
        });
        if (!confirmed) return reply;

        // Delete the messages
        await Promise.all(jt.chunk(Array.from(messages.values()), 100).map(chunk => channel.bulkDelete(chunk)));

        // Create the embed ( Nuke )
        const embed_nuke = new BetterEmbed({
            title: "Nuke Complete 💣",
            thumbnailURL: "https://c.tenor.com/WUZwFbmOnfwAAAAC/tenor.gif",
            description: `Deleted ${messages.size} ${messages.size === 1 ? "message" : "messages"} in ${channel}.`,
            timestamp: true
        });

        // Send the embed
        return await embed_nuke.send(interaction.channel!, { deleteAfter: dTConfig.timeouts.ERROR_MESSAGE });
    }
};
