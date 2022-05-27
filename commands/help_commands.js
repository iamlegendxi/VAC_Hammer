const settings = require('../bot_settings');
const colors = require('../data/colors');
const { MessageEmbed } = require('discord.js');

module.exports = {

    displayHelpMenu: async function displayHelpMenu(message, args) {
        if (!args[1]) {
            await showDefaultHelpMenu(message);
            return true;
        }
        let helpTarget = args[1].toLowerCase();
        if (NON_ADMIN_HELP[helpTarget]) {
            await message.channel.send({ embeds: [NON_ADMIN_HELP[helpTarget]] });
            return true;
        }
        else if (ADMIN_HELP[helpTarget]) {
            await message.guild.fetch();
            if (!(message.member.roles.cache.some(r => (r.name === "Admin" || r.name === "Transactions")))) {
                await message.channel.send("You must be an admin to view the admin help menu.");
                return false;
            }
            await message.channel.send({ embeds: [ADMIN_HELP[helpTarget]] });
            return true;
        }
        await showDefaultHelpMenu(message);
        return true;
    },

    displayDates: async function displayDates(message) {
        return await message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(colors.vdc_default)
                .setTitle("Dates")
                .setDescription(`\`\`\`${DATES}\`\`\``)
                .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
                .setTimestamp()
                .setFooter({ text: "Dates are subject to change.", iconURL: settings.vdc_default })]
        });
    }
}

const DATES = "Combines: 4/29, 4/30, 5/4, 5/6, 5/7\n" +
    "Signups Close: 5/4 at 11:59pm EST\n" +
    "Draft Order Lottery: 5/8\n" +
    "Offseason Transactions: 5/9 - 5/10\n\n" +
    "VDC Draft: 5/11\n\n" +
    "Preseason Matches: 5/13, 5/18, 5/20\n\n" +
    "Match Day 1: 5/25";

const NON_ADMIN_HELP = {
    "hivac": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("hivac")
        .setDescription("Says hi to the bot, causing them to say hi back :)")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usage:", "``?hivac``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "roster": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("roster [team]")
        .setDescription("Searches for a team, then displays a roster for that team.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usage:", "``?roster hitmen``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "franchises": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("franchises")
        .setDescription("Displays a list of all active franchises in the server, alongside their respective abbreviations.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usage:", "``?franchises``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "teams": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("teams [franchise]")
        .setDescription("Displays all teams and their respective tiers within a franchise.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usage:", "``?teams hg``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "dates": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("dates")
        .setDescription("Displays important dates such as combines, draft, preseason, etc.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usage:", "``?dates``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "captains": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("captains [team?] [tier?]")
        .setDescription("Displays a list of captains. List can be narrowed with a franchise abbreviation or a tier name.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usage:", "``?captains\n?captains hg\n?captains advanced``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "fa": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("fa [tier]")
        .setDescription("Displays a list of free agents in the specified tier.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usage:", "``?fa contender``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url })
}

const ADMIN_HELP = {
    "transactions": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("Transaction Commands")
        .setDescription("Below is a list of all current transaction commands.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Commands:", "``makeDE\nretire\nsign\ncut\nsub\nunsub\nshowsubs\ntoggleDraftMode\ndraft\ntrade\nmovePermFA\nretireWithRole\nmoveIR\npromote``", false)
        .setFooter({ text: "Help Menu", iconURL: settings.vdc_icon_url }),

    "makede": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("makeDE [@user] [nickname?]")
        .setDescription("Makes a target member a draft eligible player. If a nickname is provided, the user will have that nickname for their duration as a player.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Requirements:", "``-User is not already draft eligible or a free agent\n-Nickname is less than 28 characters in length``", false)
        .addField("Example Usages:", "``?makeDE @Legend#4270\n?makeDE @xNolan#0001 Nolan``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "retire": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("retire [@user] [args?]")
        .setDescription("Retires a player from the league, removing all league roles. Optional arguments include ``-player`` which removes only player roles, " +
            ", ``-gm`` which removes only GM roles, or both.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usages:", "``?retire @Shusho#4595\n?retire @Spence#6132 -player -gm``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "sign": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("sign [@user] [franchise] [tier]")
        .setDescription("Signs a player to the specified team. Franchise must be the franchise's abbreviation (e.g. HG, OS, etc).")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Requirements:", "``-User is not already signed to a franchise\n-User must be a normal free agent``", false)
        .addField("Example Usages:", "``?sign @Legend#4270 hg elite``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "cut": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("cut [@user] [franchise] [tier]")
        .setDescription("Cuts a player from the specified team. Franchise must be the franchise's abbreviation (e.g. HG, OS, etc).")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Requirements:", "``-User must be signed to that team``", false)
        .addField("Example Usages:", "``?cut @Legend#4270 hg elite``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "sub": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("sub [@user] [franchise] [tier]")
        .setDescription("Subs in a player to the specified team. Franchise must be the franchise's abbreviation (e.g. HG, OS, etc)" +
            " and the day must be a match day (as configured in bot_settings.json). Players will be automatically unsubbed at midnight after matches.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Requirements:", "``-User must be a free agent of any kind``", false)
        .addField("Example Usages:", "``?sub @Legend#4270 hg elite``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "unsub": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("unsub [@user]")
        .setDescription("Un-subs a player from the specified team. " +
            "Remember that players are automatically unsubbed at midnight after match days.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Requirements:", "``-User must be subbed in for a team member``", false)
        .addField("Example Usages:", "``?unsub @Legend#4270``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "showsubs": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("showsubs")
        .setDescription("Shows a list of all active substitutes.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usages:", "``?showsubs``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "toggledraftmode": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("toggleDraftMode [season] [tier]")
        .setDescription("Toggles draft mode within the server. Players can be drafted with ``?draft`` and other transaction commands will not work." +
            " Also, other draft modes cannot be toggled while one is still enabled.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usages:", "``?showsubs 1 elite``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "draft": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("draft [@user] [franchise] [round] [pick]")
        .setDescription("Drafts a player to the specified team. Franchise must be the franchise's abbreviation (e.g. HG, OS, etc).")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Requirements:", "``-User is not already signed to a franchise\n-User must be a free agent or draft eligible\nDraft mode must be enabled``", false)
        .addField("Example Usages:", "``?draft @Legend#4270 hg 1 1``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "trade": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("trade [franchise] [receives] for [franchise] [receives]")
        .setDescription("Posts a trade between two franchises. Franchise must be the franchise's abbreviation (e.g. HG, OS, etc)." +
            " **__TRADE CONTENTS MUST BE SEPARATED BY A COMMA__.**")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usages:", "``?trade os @Legend#4270 for hg @Spence#6132, Season 2 2nd Round Pick, Season 1 1st Round Pick (4)``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention.", iconURL: settings.vdc_icon_url }),

    "moverfa": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("moveRFA [@user] [tier] [nickname?]")
        .setDescription("Moves a player to restricted free agency with the specified nickname (if provided)." +
            " If the user is a restricted free agent already, they are promoted to normal free agency.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usages:", "``?moveRFA @Legend#4270 advanced\n?moveRFA @Legend#4270 advanced Badmin``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "retirewithrole": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("retireWithRole [@role]")
        .setDescription("Retires all users who have the specified role.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Example Usages:", "``?retireWithRole @Not Enough Games``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention. ... denotes a varaible number of args", iconURL: settings.vdc_icon_url }),

    "moveir": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("moveIR [@player]")
        .setDescription("Moves a player to inactive reserve, or activates them from it if they have the role.")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Requirements:", "``-User is signed to a franchise``", false)
        .addField("Example Usages:", "``?moveIR @Legend#4270``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

    "promote": new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("promote [@user] [tier]")
        .setDescription("Promotes a player to the specified tier (relegations are possible with this command but will look weird for now)")
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Requirements:", "``-User is signed to a franchise``", false)
        .addField("Example Usages:", "``?promote @Legend#4270 master``", false)
        .setFooter({ text: "? denotes an optional field. @ denotes a user or role mention", iconURL: settings.vdc_icon_url }),

}

async function showDefaultHelpMenu(message) {
    const defaultHelpMenu = new MessageEmbed()
        .setColor(colors.vdc_default)
        .setTitle("Command Menu")
        .setDescription("To view the help menu for an individual command, type ``?help [command]`` (e.g. ``?help hivac``")
        .setTimestamp()
        .setAuthor({ name: "VDC Help Menu", iconURL: settings.vdc_icon_url })
        .addField("Roster", "``franchises\nroster\nteams``", true)
        .addField("Transaction", "``Use ?help transaction to view a list of transaction commands``", true)
        .addField("Misc.", "``hivac\ndates``")
        .setFooter({ text: "Help Menu", iconURL: settings.vdc_icon_url });

    await message.channel.send({ embeds: [defaultHelpMenu] });
}