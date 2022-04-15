var settings = require('../bot_settings');
var franchises = require('../data/test_franchises');
var colors = require('../data/colors');
var cron = require('cron');
const { MessageEmbed } = require('discord.js');

module.exports = {

    execute: async function execute(message, args) {
        var cmd_type = args[0].replace("?", "");
        if (draftMode) {
            if (!(cmd_type.toLowerCase().includes("draft"))) {
                await message.channel.send("Draft mode is enabled, so only draft commands are allowed. Do ?toggleDraftMode [season] [tier] to disable this.");
                return false;
            }
        }
        else if (cmd_type.toLowerCase().includes("draft")) {
            await message.channel.send("Draft mode is not enabled.");
            return false;
        }
        try {
            return await COMMANDS[cmd_type](message, args.slice(1));
        } catch (error) {
            throw error;
        }
    },

    exists: function exists(cmd_type) {
        if (!cmd_type) return false;
        return (COMMANDS[cmd_type] ? true : false);
    }
}

//key should be a user id as a string, and value should be an array with the franchise json and the GuildMember object
var subsList = {};
var draftMode = false;
var draftTier = "";

//default: 59 59 23 * * ${settings.match_days.day1},${settings.match_days.day2}
var clearSubs = new cron.CronJob(`59 59 23 * * ${settings.match_days.day1},${settings.match_days.day2}`, async () => {

    if (subsList == {}) return;

    for (var s in subsList) {
        let targetUser = subsList[s][0];

        await targetUser.guild.fetch();

        await targetUser.roles.remove(targetUser.roles.cache.find(r => r.id === subsList[s][1].role_id));
        console.log(`Automatically unsubbed player: ${s}`);
        postTransaction("UNSUB", `<@${targetUser.user.id}> has finished their time as a substitute.`,
            subsList[s][1], null, targetUser.guild.channels.cache.find(c => c.id === settings.channels.transaction_channel_id));
    }

    subsList = {};

});

const COMMANDS = {

    "makeDE": async (message, args) => {
        if (!args[0]) return false;
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = await message.guild.members.cache.get(targetId);
        let desiredNickname = (args[1] ? args.slice(1).join(' ') : targetMember.user.username);
        if (desiredNickname.length > 28) {
            await message.channel.send("Error: desired nickname is too long.")
            return false;
        }
        let deRole = await message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.de_role_name);

        await (targetMember.guild.fetch());

        if (targetId === settings.server_owner_id) {
            await message.channel.send("Cannot modify nickname for this user.")
            return false;
        }

        if (targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.de_role_name) ||
            targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.fa_role_name)) {
            await message.channel.send("Member is already eligible to be drafted.")
            return false;
        }

        await targetMember.roles.add(deRole);
        await targetMember.setNickname(`DE | ${desiredNickname}`);
        return true;
    },

    "retire": async (message, args) => {
        let secondaryArgs = args.slice(1).join(' ');
        let player_roles = settings.roles.player_retireable; let gm_roles = settings.roles.gm_retireable;
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = message.guild.members.cache.get(targetId);
        if (!secondaryArgs) secondaryArgs = "-player -gm"; //defaults to both

        if (secondaryArgs.includes("-player")) {
            await removeRoles(player_roles, message, targetMember)
        }

        if (secondaryArgs.includes("-gm")) {
            await removeRoles(gm_roles, message, targetMember);
        }

        await (targetMember.guild.fetch());

        //keep nickname if user is a GM, FA, or AGM
        if (!(targetMember.roles.cache.some((r) => {
            return r.name === settings.roles.player_retireable.fa_role_name
                || r.name === settings.roles.gm_retireable.gm_role_name || r.name === settings.roles.gm_retireable.agm_role_name
        })
            && targetMember.nickname.includes('|'))) {
            targetMember.setNickname(targetMember.nickname.split('|')[1].trim());
        }
        await message.channel.send("o7");
        return true;
    },

    "sign": async (message, args) => {
        if (!args[1] && !args[2]) {
            await message.channel.send("Missing arguments. Proper syntax is: ?sign [@player] [abbreviation] [tier]");
            return false;
        }
        let abbrev = args[1].toLowerCase(); let tier = args[2].toLowerCase();
        let targetRole = message.guild.roles.cache.find(r => r.id === franchises[abbrev].role_id)
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = message.guild.members.cache.get(targetId);
        let transactionChannel = message.guild.channels.cache.find(r => r.id === settings.channels.transaction_channel_id);

        // if (!(targetMember.nickname) || !(targetMember.nickname.includes('|'))) { //target isn't in the league?
        //     throw "User should have a nickname and is trying to be cut.";
        // }

        await (targetMember.guild.fetch());

        if (!(targetMember.user.id != franchises[abbrev].gm_id)) { //GMs can never be free agents and will always be signed to a franchise

            for (var x of Object.keys(franchises)) {
                let f = await message.guild.roles.cache.find(r => r.id === franchises[x].role_id);
                if (targetMember.roles.cache.some(r => r.id === f.id)) {
                    await message.channel.send("User is already signed to a franchise.")
                    return false;
                }
            }

            if (!(targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.fa_role_name))) {
                await message.channel.send("User is not a free agent.")
                return false;
            }

        }

        if (franchises[abbrev].teams[tier] == "") {
            await message.channel.send("This franchise does not have a team configured for the specified tier.");
            return false;
        }

        //if it reaches this point, the user should be available to sign

        await targetMember.roles.add(targetRole);
        await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.fa_role_name));

        //tier should already be assigned to a player
        console.log(`<@${targetMember.user.id}> was signed by the ${franchises[abbrev].teams[tier]}!`)
        //transactionChannel.send(`<@${targetMember.user.id}> was signed by the ${franchises[abbrev].teams[tier]}!`);
        await postTransaction("SIGN", `<@${targetMember.user.id}> was signed by the ${franchises[abbrev].teams[tier]}!`, franchises[abbrev], tier, transactionChannel);

        let desiredName = (targetMember.nickname && targetMember.nickname.includes('|')) ? targetMember.nickname.split('|')[1].trim() : targetMember.user.username;
        await targetMember.setNickname(`${abbrev.toUpperCase()} | ${desiredName}`);
        // await targetMember.setNickname(`${abbrev.toUpperCase()} | ${targetMember.nickname.split('|')[1].trim()}`);
        return true;

    },

    "cut": async (message, args) => {
        if (!args[1] && !args[2]) {
            await message.channel.send("Missing arguments. Proper syntax is: ?cut [@player] [abbreviation] [tier]");
            return false;
        }
        let abbrev = args[1].toLowerCase(); let tier = args[2].toLowerCase();
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = message.guild.members.cache.get(targetId);
        let faRole = message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.fa_role_name);
        let transactionChannel = message.guild.channels.cache.find(r => r.id === settings.channels.transaction_channel_id);

        if (!(targetMember.nickname) || !(targetMember.nickname.includes('|'))) { //target isn't in the league?
            throw "User should have a nickname and is trying to be cut.";
        }

        await targetMember.guild.fetch();

        if (!(targetMember.roles.cache.some(r => r.name === franchises[abbrev].name))) {
            await message.channel.send("User is not a member of that franchise, check your command syntax and try again.");
            return false;
        }

        await targetMember.roles.remove(targetMember.roles.cache.find(r => r.name === franchises[abbrev].name));
        await targetMember.roles.add(faRole);
        console.log(`<@${targetMember.user.id}> was cut by the ${franchises[abbrev].teams[tier]}!`);
        //transactionChannel.send(`<@${targetMember.user.id}> was cut by the ${franchises[abbrev].teams[tier]}!`);
        await postTransaction("CUT", `<@${targetMember.user.id}> was cut by the ${franchises[abbrev].teams[tier]}!`, franchises[abbrev], tier, transactionChannel);
        if (!(targetMember.user.id == franchises[abbrev].gm_id))
            await targetMember.setNickname(`FA | ${targetMember.nickname.split('|')[1].trim()}`);
        return true;

    },

    "sub": async (message, args) => {
        if (!args[1] && !args[2]) {
            await message.channel.send("Missing arguments. Proper syntax is: ?sub [@player] [abbreviation] [tier]");
            return false;
        }
        let abbrev = args[1].toLowerCase(); let tier = args[2].toLowerCase();
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = message.guild.members.cache.get(targetId);
        let targetRole = message.guild.roles.cache.find(r => r.id === franchises[abbrev].role_id);
        let transactionChannel = message.guild.channels.cache.find(r => r.id === settings.channels.transaction_channel_id);

        await targetMember.guild.fetch();

        if (!(targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.fa_role_name))) {
            await message.channel.send("User is not registered for the league, or is missing the Free Agent role.");
            return false;
        }

        //Check today's date, and if it's not a match day, the command fails  (unsure if this is needed but it's better to be safe than sorry)
        var today = new Date();

        if (!(today.getDay() == settings.match_days.day1 || today.getDay() == settings.match_days.day2)) {
            await message.channel.send("Sub transactions must be completed on a match day.");
            return false;
        }

        for (var x of Object.keys(franchises)) {
            if (targetMember.roles.cache.some(r => r.id === franchises[x].role_id)) {
                await message.channel.send(`Player is already signed to the ${franchises[x].name}`);
                return false;
            }
        }

        if (!(clearSubs.running)) clearSubs.start();

        //necessary checks are done, we're good to process the sub
        await targetMember.roles.add(targetRole);
        subsList[targetMember.user.id] = [targetMember, franchises[abbrev]];
        await postTransaction("SUB", `<@${targetMember.user.id}> has signed a temporary contract with the ${franchises[abbrev].teams[tier]}!`,
            franchises[abbrev], tier, transactionChannel);
        return true;
    },

    "unsub": async (message, args) => { //should only be used if automatic sub release fails
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = message.guild.members.cache.get(targetId);

        await targetMember.guild.fetch();

        await targetMember.roles.remove(targetMember.roles.cache.find(r => r.id === subsList[targetId][1].role_id));
        delete subsList[targetMember.user.id];
        console.log(`Manually unsubbed player: ${targetMember.user.id}`);
        postTransaction("UNSUB", `<@${targetMember.user.id}> has finished their time as a substitute.`,
            subsList[targetId][1], null, targetMember.guild.channels.cache.find(c => c.id === settings.channels.transaction_channel_id));

        return true;
    },

    "showsubs": async (message, args) => {

        const subsEmbed = new MessageEmbed()
            .setColor("#611010")
            .setTitle("List of active substitutes");
        var msg = "```";

        for (var s in subsList) {
            msg = msg + subsList[s][0].nickname + " (" + s + ")\n";
        }

        msg = msg + "```";
        subsEmbed.setDescription(msg);
        await message.channel.send({ embeds: [subsEmbed] });

        return true;
    },

    "toggleDraftMode": async (message, args) => {

        console.log(draftTier);
        if (!args[0] || !args[1]) {
            await message.channel.send("Missing arguments. Proper syntax is: ?toggleDraftMode [season] [tier]");
            return false;
        }
        else if (draftTier != "" && args[1] != draftTier) {
            await message.channel.send(`Cannot begin the ${args[1]} draft without first ending the ${draftTier} draft.`);
            return false;
        }
        let season = args[0];
        let tier = args[1];
        let transactionChannel = message.guild.channels.cache.find(c => c.id === settings.channels.transaction_channel_id);
        const draftEmbed = new MessageEmbed()
            .setColor(colors[tier])
            .setTitle(`The Season ${season} ${tier} draft has now ${draftMode ? "ended" : "started"}!`)
            .setTimestamp();

        draftTier = draftMode ? "" : tier;
        draftMode = !draftMode;
        await transactionChannel.send({ embeds: [draftEmbed] });
        return true;
    },

    "draft": async (message, args) => {
        if (!args[0] || !args[1] || !args[2]) {
            await message.channel.send("Missing arguments. Proper syntax is: ?draft [@player] [abbreviation] [pick]");
            return false;
        }
        let franchiseAbbrev = args[1];
        let pick = args[2];
        let targetRole = message.guild.roles.cache.find(r => r.id === franchises[franchiseAbbrev].role_id);
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = message.guild.members.cache.get(targetId);
        let transactionChannel = message.guild.channels.cache.find(c => c.id === settings.channels.transaction_channel_id);

        await targetMember.guild.fetch();

        if (!(targetMember.roles.cache.some(r => (r.name === settings.roles.player_retireable.de_role_name) ||
            (r.name === settings.roles.player_retireable.fa_role_name)))) {
            await message.channel.send("Player is not draft eligible or is missing the required roles.");
            return false;
        }

        if (!targetRole) {
            message.channel.send("No such franchise or franchise role exists.");
            return false;
        }

        //player can be drafted if this point is reached

        await targetMember.roles.add(targetRole);
        await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.de_role_name));
        await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.fa_role_name));
        await targetMember.setNickname(`${franchiseAbbrev.toUpperCase()} | ${targetMember.nickname.split('|')[1].trim()}`);
        postTransaction("DRAFT", `With pick number ${pick} in  the draft, the ${franchises[franchiseAbbrev].teams[draftTier]} select <@${targetMember.user.id}>`,
            franchises[franchiseAbbrev], draftTier, transactionChannel);
        return true;

    }

}

async function removeRoles(jsonObj, message, targetMember) {
    for (var x of Object.keys(jsonObj)) {
        let targetRole = targetMember.roles.cache.find(r => r.name === jsonObj[x]);
        if (!targetRole) continue;
        let removed = await targetMember.roles.remove(targetRole);
        if (removed) console.log(`Role removed from user ${targetMember.user.id}:  ${targetRole.name} (if they had it)`)
    }
    for (var x of Object.keys(franchises)) {
        let targetRole = targetMember.roles.cache.find(r => r.name === franchises[x].name);
        if (!targetRole) continue;
        let removed = await targetMember.roles.remove(targetRole);
        if (removed) console.log(`Role removed from user ${targetMember.user.id}:  ${targetRole.name} (if they had it)`)
    }
    //todo: assign former gm/player
}

async function postTransaction(type, contents, franchise, tier, channel, tradeContents = {}) {
    try {
        const transaction_embed = new MessageEmbed()
            .setColor(tier ? colors.tier[tier] : "#808080")
            .setTitle("🚨🚨 TRANSACTION ALERT 🚨🚨")
            .setDescription(contents)
            .setThumbnail(franchise ? franchise.image : "")
            .setTimestamp()
            .setFooter({ text: `Type: ${type}` });
        if (tradeContents != {} && type == "TRADE") {
            //post trade contents
        }

        else if (tier && franchise) {
            transaction_embed.addFields(
                { name: 'Team', value: `${franchise.teams[tier]}`, inline: true },
                { name: 'Franchise', value: `${franchise.name}`, inline: true },
                { name: 'GM', value: `<@${franchise.gm_id}>`, inline: true })
        }

        await channel.send({ embeds: [transaction_embed] });
    } catch (error) {
        console.error(`An error occurred while trying to post a transaction:\n\n ${error}`)
        throw error;
    }

}