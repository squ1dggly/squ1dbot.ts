import { UserInstallableCommand } from "@customTypes/commands";

import { userManager } from "@utils/mongo/managers";
import { SlashCommandBuilder } from "discord.js";
import { BetterEmbed } from "djstools";
import jsTools from "jstools";
import configs from "@configs";

export const __command: UserInstallableCommand = {
    builder: new SlashCommandBuilder().setName("wtf").setDescription("Wtf you want?"),

    type: 1,
    integration_types: [0, 1],
    contexts: [0, 1, 2],

    execute: async (client, interaction) => {
        let customReply: { id: number; text: string } | undefined;
        let customsFoundCount: number | undefined;

        const customReplies = jsTools.chance(configs.fuck.chanceForCustom)
            ? configs.fuck.customReplies.find(c => c.userId === interaction.user.id)?.replies
            : undefined;

        if (customReplies?.length) {
            const _customReply = jsTools.choice(customReplies);
            customReply = _customReply;

            const userData = await userManager.global.__fetch(interaction.user.id, {
                projection: { customReplyIdsFound: 1 }
            });
            const alreadyFound = userData?.customReplyIdsFound.includes(_customReply.id);
            customsFoundCount = userData?.customReplyIdsFound.length ?? 0;

            if (!alreadyFound) {
                customsFoundCount++;
                userManager.global.__update(interaction.user.id, { $push: { customReplyIdsFound: _customReply.id } });
            }
        }

        const reply = !customReply ? jsTools.choice(configs.fuck.generalReplies) : undefined;

        // Create the embed ( wtf )
        const embed_wtf = new BetterEmbed({
            color: customReply
                ? "#FFCB47"
                : ["DarkRed", "Orange", "Greyple", "Aqua", "Navy", "White", "DarkButNotBlack", "LuminousVividPink"],
            author: customReply
                ? { text: `Custom Reply ${customReply.id}`, hyperlink: jsTools.choice(configs.fuck.customReplyLinks) }
                : "WTF?",
            description: customReply?.text || reply,
            footer: customReply ? `found ${customsFoundCount}/${customReplies?.length}` : undefined
        });

        // Reply to the interaction with the embed
        return embed_wtf.send(interaction);
    }
};
