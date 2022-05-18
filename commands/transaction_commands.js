const settings = require('../bot_settings');
const franchises = require('../data/franchises');
const colors = require('../data/colors');
const cron = require('cron');
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
        else if (cmd_type.toLowerCase() == "draft" && !draftMode) {
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
        await postTransaction("UNSUB", `<@${targetUser.user.id}> has finished their time as a substitute.`,
            subsList[s][1], null, targetUser.guild.channels.cache.find(c => c.id === settings.channels.transaction_channel_id));
    }

    subsList = {};

});

const COMMANDS = {

    "makeDE": async (message, args) => {
        if (!args[0]) {
            await message.channel.send("Missing arguments. Proper syntax is ?makeDE [@player] [nickname?]");
            return false;
        };
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = await message.guild.members.cache.get(targetId);
        let desiredNickname = (args[1] ? args.slice(1).join(' ') : targetMember.user.username);
        if (desiredNickname.length > 28) {
            await message.channel.send("Error: desired nickname is too long.")
            return false;
        }
        let deRole = await message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.de_role_name);

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();

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
        await targetMember.roles.add(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.league_role_name));
        await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.default_role_name));
        await targetMember.setNickname(`DE | ${desiredNickname}`);
        return true;
    },

    "retire": async (message, args) => {
        //await message.guild.members.fetch();
        let secondaryArgs = args.slice(1).join(' ');
        let player_roles = settings.roles.player_retireable; let gm_roles = settings.roles.gm_retireable;
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = message.guild.members.cache.get(targetId);
        if (!secondaryArgs) secondaryArgs = "-player -gm"; //defaults to both
        let removeFranchiseRoles = secondaryArgs.includes("-player") && secondaryArgs.includes("-gm");

        if (!targetMember) {
            await message.channel.send("Member does not exist within the guild.");
            return false;
        }

        if (secondaryArgs.includes("-player")) {
            await removeRoles(player_roles, targetMember, removeFranchiseRoles);
            await removeRoles(settings.roles.tier_retireable, targetMember, false);
            await targetMember.roles.add(message.guild.roles.cache.find(r => r.name === "Former Player"));
        }

        if (secondaryArgs.includes("-gm")) {
            if (targetMember.roles.cache.some(r => r.name === settings.roles.gm_retireable.gm_role_name)) {
                await targetMember.roles.add(message.guild.roles.cache.find(r => r.name === "Former GM"));
            }
            await removeRoles(gm_roles, targetMember, removeFranchiseRoles);
        }

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();

        await targetMember.roles.add(message.guild.roles.cache.find(r => r.name === settings.roles.default_role_name));

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

        if (!(targetMember.nickname) || !(targetMember.nickname.includes('|'))) { //target isn't in the league?
            throw "User does not follow the proper nickname syntax and is trying to be signed. Check if they have retired?";
        }

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();

        if (!(targetMember.user.id != franchises[abbrev].gm_id)) { //GMs can never be free agents and will always be signed to a franchise

            for (var x of Object.keys(franchises)) {
                let f = message.guild.roles.cache.find(r => r.id === franchises[x].role_id);
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
        await targetMember.roles.add(message.guild.roles.cache.find(r => r.name.toLowerCase() === tier))
        await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.fa_role_name));

        //tier should already be assigned to a player
        console.log(`<@${targetMember.user.id}> was signed by the ${franchises[abbrev].teams[tier]}!`)
        //transactionChannel.send(`<@${targetMember.user.id}> was signed by the ${franchises[abbrev].teams[tier]}!`);
        await postTransaction("SIGN", `<@${targetMember.user.id}> (${targetMember.nickname.split('|')[1].trim()}) was signed by the ${franchises[abbrev].teams[tier]}!`,
         franchises[abbrev], tier, transactionChannel);

        // let desiredName = (targetMember.nickname && targetMember.nickname.includes('|')) ? targetMember.nickname.split('|')[1].trim() : targetMember.user.username;
        // await targetMember.setNickname(`${abbrev.toUpperCase()} | ${desiredName}`);
        await targetMember.setNickname(`${abbrev.toUpperCase()} | ${targetMember.nickname.split('|')[1].trim()}`);
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

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();

        if (!(targetMember.roles.cache.some(r => r.name === franchises[abbrev].name))) {
            await message.channel.send("User is not a member of that franchise, check your command syntax and try again.");
            return false;
        }

        if (!(targetMember.user.id == franchises[abbrev].gm_id)) {
            await targetMember.roles.remove(targetMember.roles.cache.find(r => r.name === franchises[abbrev].name));
            await targetMember.roles.add(faRole);
        }
        console.log(`<@${targetMember.user.id}> (${targetMember.nickname}) was cut by the ${franchises[abbrev].teams[tier]}!`);
        //transactionChannel.send(`<@${targetMember.user.id}> was cut by the ${franchises[abbrev].teams[tier]}!`);
        let targetMemNickname = targetMember.nickname.split('|')[1].trim();
        await postTransaction("CUT", `<@${targetMember.user.id}> (${targetMemNickname}) was cut by the ${franchises[abbrev].teams[tier]}!`, franchises[abbrev], tier, transactionChannel);
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

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();

        if (!(targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.fa_role_name || r.name === settings.roles.player_retireable.permfa_role_name))) {
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
        let targetMemNickname = targetMember.nickname.split('|')[1].trim();
        await postTransaction("SUB", `<@${targetMember.user.id}> (${targetMemNickname}) has signed a temporary contract with the ${franchises[abbrev].teams[tier]}!`,
            franchises[abbrev], tier, transactionChannel);
        return true;
    },

    "unsub": async (message, args) => { //should only be used if automatic sub release fails
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = message.guild.members.cache.get(targetId);

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();

        await targetMember.roles.remove(targetMember.roles.cache.find(r => r.id === subsList[targetId][1].role_id));
        delete subsList[targetMember.user.id];
        console.log(`Manually unsubbed player: ${targetMember.user.id}`);
        await postTransaction("UNSUB", `<@${targetMember.user.id}> has finished their time as a substitute.`,
            subsList[targetId], null, targetMember.guild.channels.cache.find(c => c.id === settings.channels.transaction_channel_id));

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

        if (!args[0] || !args[1]) {
            await message.channel.send("Missing arguments. Proper syntax is: ?toggleDraftMode [season] [tier]");
            return false;
        }
        else if (draftTier != "" && args[1].toLowerCase() != draftTier.toLowerCase()) {
            await message.channel.send(`Cannot begin the ${args[1]} draft without first ending the ${draftTier} draft.`);
            return false;
        }
        let season = args[0];
        let tier = args[1].toLowerCase();
        let transactionChannel = message.guild.channels.cache.find(c => c.id === settings.channels.transaction_channel_id);
        const draftEmbed = new MessageEmbed()
            .setColor(colors[tier])
            .setTitle(`The Season ${season} ${tier.substring(0, 1).toUpperCase() + tier.substring(1).toLowerCase()} draft has now ${draftMode ? "ended" : "started"}!`)
            .setTimestamp();

        draftTier = draftMode ? "" : tier;
        draftMode = !draftMode;
        await transactionChannel.send({ embeds: [draftEmbed] });
        return true;
    },

    "draft": async (message, args) => {
        if (!args[0] || !args[1] || !args[2] || !args[3]) {
            await message.channel.send("Missing arguments. Proper syntax is: ?draft [@player] [abbreviation] [round] [pick]");
            return false;
        }
        let franchiseAbbrev = args[1].toLowerCase();
        let pick = args[3];
        let round = args[2];
        let targetRole = message.guild.roles.cache.find(r => r.id === franchises[franchiseAbbrev].role_id);
        let targetId = (args[0].includes("@") ? args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "") : args[0]);
        await message.guild.members.fetch();
        let targetMember = message.guild.members.cache.get(targetId);
        let transactionChannel = message.guild.channels.cache.find(c => c.id === settings.channels.transaction_channel_id);
        let keeper = false;

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();
        if (!targetRole) {
            message.channel.send("No such franchise or franchise role exists.");
            return false;
        }
        keeper = targetMember.roles.cache.some(r => r.id === targetRole.id); //has to be done after the fetch

        if (!(targetMember.roles.cache.some(r => (r.name === settings.roles.player_retireable.de_role_name) ||
            (r.name === settings.roles.player_retireable.fa_role_name))) && !keeper) {
            await message.channel.send("Player is not draft eligible or is missing the required roles.");
            return false;
        }

        //player can be drafted if this point is reached

        await targetMember.roles.add(targetRole);
        await targetMember.roles.add(message.guild.roles.cache.find(r => r.name.toLowerCase() === draftTier.toLowerCase()));
        await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.de_role_name));
        await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.fa_role_name));
        await targetMember.setNickname(`${franchiseAbbrev.toUpperCase()} | ${targetMember.nickname.split('|')[1].trim()}`);
        let targetMemNickname = targetMember.nickname.split('|')[1].trim()
        await postDraftTransaction(round, pick, 
            `The ${franchises[franchiseAbbrev].teams[draftTier]} ${keeper ? "keep" : "select"} <@${targetMember.user.id}> (${targetMemNickname})`,
            franchises[franchiseAbbrev], draftTier, transactionChannel);
        return true;

    },

    "trade": async (message, args) => {
        let tradeContents = args.join(' ').split("for");
        let transactionChannel = message.guild.channels.cache.find(c => c.id === settings.channels.transaction_channel_id);
        let tradeMessageContents = {};
        let transactionContents = "";

        if (tradeContents.length <= 1) {
            await message.channel.send("Missing arguments. Proper syntax is: ?trade [abbreviation] [tradeContents]" +
                " for [abbreviation] [tradeContents]\n(did you separate the trade contents with a comma?)");
            return false;
        }
        for (let i = 0; i < tradeContents.length; i++) {
            let contents = tradeContents[i].trim().split(' ').slice(1).join(' ').split(',');
            let franchise = franchises[tradeContents[i].toLowerCase().trim().split(' ').slice(0, 1)];

            if (!franchise) {
                await message.channel.send(`One or more of the provided franchises does not exist.`);
                return false;
            }

            tradeMessageContents[`${franchise.name} will receive: `] = "";

            for (let j = 0; j < contents.length; j++) {
                let potentialUserId = contents[j].substring(contents[j].indexOf("@") + 1, contents[j].indexOf(">")).replace("!", "");
                let potentialUser = message.guild.members.cache.get(potentialUserId);
                if (potentialUser) {
                    //player is involved in the trade, we need to remove old roles and add new ones

                    await potentialUser.guild.roles.fetch();
                    await potentialUser.guild.members.fetch();

                    await removeRoles({}, potentialUser, true);
                    await potentialUser.roles.add(franchise.role_id);
                    await potentialUser.setNickname(`${tradeContents[i].trim().split(' ').slice(0, 1)[0].toUpperCase()} | ${potentialUser.nickname.split('|')[1].trim()}`);
                    tradeMessageContents[`${franchise.name} will receive: `] += `<@${potentialUser.user.id}> (${potentialUser.nickname.split('|')[1].trim()})\n`;
                }
                else {
                    tradeMessageContents[`${franchise.name} will receive: `] += `${contents[j].trim()}\n`;
                }
            }
            transactionContents = transactionContents + `${franchise.name} ${i == tradeContents.length - 1 ? " " : "and "}`
        }

        transactionContents = transactionContents + "have agreed to a trade.\n";
        await postTransaction("TRADE", transactionContents, null, null, transactionChannel, tradeMessageContents);

        return true;
    },

    "moveRFA": async (message, args) => {
        if (!args[0]) {
            await message.channel.send("Missing arguments. Proper syntax is ?moveRFA [@player] [nickname?]");
            return false;
        }
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = await message.guild.members.cache.get(targetId);
        let desiredNickname = (args[1] ? args.slice(1).join(' ') : targetMember.user.username);
        let targetRole = message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.permfa_role_name);

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();

        //never make a gm a permfa
        if (targetMember.roles.cache.some(r => r.name === settings.roles.gm_retireable.gm_role_name)) {
            await message.channel.send("Cannot move a general manager to permanent free agency.");
            return false;
        }

        //if the user is not a perm fa already, make them one
        if (!(targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.permfa_role_name))) {
            await removeRoles(settings.roles.player_retireable, targetMember, true);
            await targetMember.roles.add(targetRole);
            await targetMember.roles.add(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.league_role_name));
            await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.default_role_name));
            await targetMember.setNickname(`RFA | ${desiredNickname}`);
            return true;
        }
        else { //the user is a permfa who is being promoted to normal free agency
            await targetMember.roles.remove(targetRole);
            await targetMember.roles.add(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.fa_role_name));
            await targetMember.setNickname(`FA | ${targetMember.nickname.split('|')[1].trim()}`);
            return true;
        }
    },

    "retireWithRole": async (message, args) => {
        if (!args[0]) {
            await message.channel.send("Missing arguments. Proper syntax is ?retireWithRole [@role]");
            return false;
        }
        let failList = [];
        let failCount = 0;
        let role_id = args[0].slice(args[0].includes("!") ? 4 : 3, -1);
        let targetRole = message.guild.roles.cache.get(role_id);
        await targetRole.guild.members.fetch();
        let roleList = await targetRole.members.map(m => m.user.id);

        for (let x in roleList) {
            console.log(failList);
            try {
                let tryRetire = await COMMANDS["retire"](message, [`<@${roleList[x]}>`, "-player", "-gm"]);

                if (!tryRetire) {
                    failList[failCount] = roleList[x];
                    failCount = failCount + 1;
                }
            } catch (e) {
                console.log(e);
                failList[failCount] = roleList[x];
                failCount = failCount + 1;
            }
        }

        if (failCount == 0) {
            await message.channel.send("All users have been retired.");
            return true;
        }

        let failMsg = "The following users were unable to be retired: \n"
        for (let f of failList) {
            failMsg += `<@${f}>\n`
        }
        await message.channel.send(`${failMsg}\n(all other users were retired successfully, if any)`);
        return false;
    },

    "moveIR": async (message, args) => {
        if (!args[0]) {
            await message.channel.send("Missing arguments. Proper syntax is ?moveIR [@player]");
            return false;
        }
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = await message.guild.members.cache.get(targetId);
        let targetRole = message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.ir_role_name);
        let transactionChannel = message.guild.channels.cache.find(r => r.id === settings.channels.transaction_channel_id);

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();

        for (var x of Object.keys(franchises)) {
            if (targetMember.roles.cache.some(r => r.id === franchises[x].role_id)) {
                if (!targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.ir_role_name)) {
                    await targetMember.roles.add(targetRole);
                    postTransaction("IR", `<@${targetMember.user.id}> (${targetMember.nickname.split('|')[1].trim()}) has been placed on Inactive Reserve!`,
                    franchises[x], null, transactionChannel);
                    return true;
                }

                console.log("reached");
                await targetMember.roles.remove(targetRole);
                postTransaction("IR", `<@${targetMember.user.id}> (${targetMember.nickname.split('|')[1].trim()}) has been activated from Inactive Reserve!`,
                franchises[x], null, transactionChannel);
                return true;

            }
        }

        await message.channel.send("Player is not signed to a franchise, and therefore cannot be placed on Inactive Reserve.");
        return false;
    },

    "promote": async (message, args) => {
        if (!args[0] || !args[1]) {
            await message.channel.send("Missing arguments. Proper syntax is ?promote [@player] [tier]");
            return false;
        }
        let tier = args[1].toLowerCase();
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = await message.guild.members.cache.get(targetId);
        let transactionChannel = message.guild.channels.cache.find(r => r.id === settings.channels.transaction_channel_id);

        await targetMember.guild.roles.fetch();
        await targetMember.guild.members.fetch();

        for (var x of Object.keys(franchises)) {
            if (targetMember.roles.cache.some(r => r.id === franchises[x].role_id)) {

                for (var y of Object.keys(settings.roles.tier_retireable)) {
                    await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.tier_retireable[y]));
                }
                
                await targetMember.roles.add(message.guild.roles.cache.find(r => r.name.toLowerCase() === tier.toLowerCase()));
                postTransaction("PROMOTE", `<@${targetMember.user.id}> (${targetMember.nickname.split('|')[1].trim()}) has been promoted to the ${franchises[x].teams[tier]}`,
                franchises[x], tier, transactionChannel);
                return true;
            }
        }

        await message.channel.send("Player is not signed to a franchise, and therefore cannot be promoted to a tier. (did you mean to sub?)");
        return false;

    }

}

async function removeRoles(jsonObj, targetMember, removeFranchiseRoles) {
    for (var x of Object.keys(jsonObj)) {
        let targetRole = targetMember.roles.cache.find(r => r.name === jsonObj[x]);
        if (!targetRole) continue;
        let removed = await targetMember.roles.remove(targetRole);
        if (removed) console.log(`Role removed from user ${targetMember.user.id}:  ${targetRole.name} (if they had it)`)
    }
    if (removeFranchiseRoles) {
        for (var x of Object.keys(franchises)) {
            let targetRole = targetMember.roles.cache.find(r => r.name === franchises[x].name);
            if (!targetRole) continue;
            let removed = await targetMember.roles.remove(targetRole);
            if (removed) console.log(`Role removed from user ${targetMember.user.id}:  ${targetRole.name} (if they had it)`)
        }
    }
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
        if (tradeContents != {} && type.toUpperCase() == "TRADE") {
            for (var x of Object.keys(tradeContents)) {
                transaction_embed.addField(x, tradeContents[x], true);
            }
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

async function postDraftTransaction(round, pick, contents, franchise, tier, channel) {
    try {
        const transaction_embed = new MessageEmbed()
            .setColor(tier ? colors.tier[tier] : "#808080")
            .setTitle(`Round: ${round} | Pick: ${pick} | Tier: ${tier.substring(0, 1).toUpperCase() + tier.substring(1).toLowerCase()}`)
            .setDescription(contents)
            .setThumbnail(franchise ? franchise.image : "")
            .setTimestamp();
        transaction_embed.addFields(
            { name: 'Team', value: `${franchise.teams[tier]}`, inline: true },
            { name: 'Franchise', value: `${franchise.name}`, inline: true },
            { name: 'GM', value: `<@${franchise.gm_id}>`, inline: true })


        await channel.send({ embeds: [transaction_embed] });
    } catch (error) {
        console.error(`An error occurred while trying to post a transaction:\n\n ${error}`)
        throw error;
    }

}