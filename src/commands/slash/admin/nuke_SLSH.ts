import { GuildSlashCommand } from "@customTypes/commands";

import {
    ChannelType,
    Collection,
    CommandInteraction,
    GuildBasedChannel,
    Message,
    SlashCommandBuilder,
    TextChannel
} from "discord.js";
import { BetterEmbed, awaitConfirm, dTConfig } from "@utils/discordTools";
import jt from "@utils/jsTools";

async function fetchChannelMessages(
    channel: TextChannel & GuildBasedChannel,
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

async function cmd_nukeMessages(
    interaction: CommandInteraction<"cached">,
    channel: TextChannel & GuildBasedChannel,
    ignorePinned: boolean
) {
    // Let the user know we're fetching the messages
    const reply = await interaction.editReply({
        content: "`⏳` Getting channel messages. This might take a second..."
    });

    /* Fetch all the messages in the channel */
    const twoWeeksAgo = jt.parseTime("-2w", { fromNow: true });
    const messages = (await fetchChannelMessages(channel)).filter(m => {
        return m.id !== reply.id && m.deletable && m.createdTimestamp >= twoWeeksAgo && (ignorePinned ? !m.pinned : true);
    });
    if (!messages.size) {
        return interaction.editReply({
            content: `I couldn't find any deletable messages in ${channel.toString()}.`
        });
    }

    // Ask for delete confirmation
    const confirmed = await awaitConfirm(interaction, {
        allowedParticipants: interaction.user,
        messageContent: jt.chance(25) ? "If you ask me, I think you should just delete the whole server, tbh. 🤷" : "",
        embed: new BetterEmbed({
            color: "Yellow",
            title: "⚠️ Carefully rethink your life choices...",
            description: `You are about to delete ***EVERY MESSAGE*** (${messages.size} of 'em) in ${channel.toString()}.`
        })
    });
    if (!confirmed) return reply;

    // Delete the messages
    await Promise.all(jt.chunk(Array.from(messages.values()), 100).map(chunk => channel.bulkDelete(chunk)));

    // Create the embed ( Nuke Messages )
    const embed_nukeMessages = new BetterEmbed({
        title: "Nuke Complete 💣",
        thumbnailURL: "https://c.tenor.com/WUZwFbmOnfwAAAAC/tenor.gif",
        description: `Deleted ${messages.size} ${messages.size === 1 ? "message" : "messages"} in ${channel}.`,
        timestamp: true
    });

    // Send the embed
    return embed_nukeMessages.send(interaction.channel!, { deleteAfter: dTConfig.timeouts.ERROR_MESSAGE });
}

async function cmd_nukeChannel(interaction: CommandInteraction<"cached">, channel: TextChannel & GuildBasedChannel) {
    // Ask for delete confirmation
    const confirmed = await awaitConfirm(interaction, {
        allowedParticipants: interaction.user,
        messageContent: jt.chance(25) ? "Now isn't the time for renovation. Why don't you go touch some grass instead?" : "",
        embed: new BetterEmbed({
            color: "Yellow",
            title: "⚠️ Carefully rethink your life choices...",
            description: `You are about to completely replace ${channel.toString()} with a brand new channel.`
        })
    });
    if (!confirmed) return;

    // Make a new channel
    const newChannel = await channel.guild.channels.create({
        name: channel.name,
        type: ChannelType.GuildText,
        topic: channel.topic || "",
        parent: channel.parent,
        nsfw: channel.nsfw,
        permissionOverwrites: channel.permissionOverwrites.cache,
        defaultAutoArchiveDuration: channel.defaultAutoArchiveDuration,
        rateLimitPerUser: channel.rateLimitPerUser
    });

    // Delete the old channel
    await channel.delete().catch(() => null);

    // Create the embed ( Nuke Channel )
    const embed_nukeChannel = new BetterEmbed({
        title: "Nuke Complete 💣",
        thumbnailURL: "https://c.tenor.com/WUZwFbmOnfwAAAAC/tenor.gif",
        description: `Channel **${channel.name}** has been nuked and replaced with ${newChannel.toString()}.`,
        timestamp: true
    });

    // Send the embed
    return embed_nukeChannel.send(newChannel, { deleteAfter: dTConfig.timeouts.ERROR_MESSAGE });
}

export const __command: GuildSlashCommand = {
    category: "Admin",
    options: {
        emoji: "💣",
        guildOnly: true,
        deferReply: true,
        requiredUserPerms: ["ManageMessages", "ManageChannels"],
        requiredClientPerms: ["ManageMessages", "ManageChannels"]
    },

    builder: new SlashCommandBuilder()
        .setName("nuke")
        .setDescription("Delete all messages newer than 2 weeks in a channel.")
        .addStringOption(option =>
            option
                .setName("type")
                .setDescription("The type of nuking to perform")
                .addChoices([
                    { name: "Messages", value: "message" },
                    { name: "Messages (Ignore Pinned)", value: "message-ignorePinned" },
                    { name: "Channel", value: "channel" }
                ])
                .setRequired(true)
        )
        .addChannelOption(option => option.setName("channel").setDescription("The channel to nuke")),

    execute: async (client, interaction) => {
        const channel = interaction.options.get("channel")?.channel || interaction.channel;

        if (channel?.type !== ChannelType.GuildText) {
            return interaction.editReply({
                content: "This command can only be used for text channels."
            });
        }

        switch (interaction.options.get("type", true).value) {
            case "message":
                return cmd_nukeMessages(interaction, channel, false);
            case "message-ignorePinned":
                return cmd_nukeMessages(interaction, channel, true);
            case "channel":
                return cmd_nukeChannel(interaction, channel);
        }
    }
};
