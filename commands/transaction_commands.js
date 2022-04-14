var settings = require('../bot_settings');
var franchises = require('../data/test_franchises.json');

module.exports = {

    execute: async function execute(message, args) {
        var cmd_type = args[0].replace("?", "");
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

const COMMANDS = {

    "makeDE": async (message, args) => {
        if (!args[0]) return false;
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = await message.guild.members.cache.get(targetId);
        let desiredNickname = (args[1] ? args.slice(1).join(' ') : targetMember.user.username);
        if (desiredNickname.length > 28) {
            message.channel.send("Error: desired nickname is too long.")
            return false;
        }
        let deRole = await message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.de_role_name);

        await (targetMember.guild.fetch());

        if (targetId === settings.server_owner_id) {
            message.channel.send("Cannot modify nickname for this user.")
            return false;
        }

        if (targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.de_role_name) ||
            targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.fa_role_name)) {
            message.channel.send("Member is already eligible to be drafted.")
            message.react("❌");
            return false;
        }

        targetMember.roles.add(deRole);
        targetMember.setNickname(`DE | ${desiredNickname}`);
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
        if (!(targetMember.roles.cache.some((r) => { return r.name === settings.roles.player_retireable.fa_role_name
            || r.name === settings.roles.gm_retireable.gm_role_name || r.name === settings.roles.gm_retireable.agm_role_name})
            && targetMember.nickname.includes('|'))) {
                targetMember.setNickname(targetMember.nickname.split('|')[1].trim());
            }
        message.channel.send("o7");
        return true;
    },
    
    "sign": async (message, args) => {
        if (!args[1] && !args[2]) {
            message.channel.send("Missing arguments. Proper syntax is: ?sign [@player] [abbreviation] [tier]");
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

        for (var x of Object.keys(franchises)) {
            let f = await message.guild.roles.cache.find(r => r.id === franchises[x].role_id);
            if (targetMember.roles.cache.some(r => r.id === f.id)) {
                message.channel.send("User is already signed to a franchise.")
                return false;
            }
        }

        if (!(targetMember.roles.cache.some(r => r.name === settings.roles.player_retireable.fa_role_name))) {
            message.channel.send("User is not a free agent.")
            return false;
        }

        else if (franchises[abbrev].teams[tier] == "") {
            message.channel.send("This franchise does not have a team configured for the specified tier.");
            return false;
        }

        //if it reaches this point, the user should be available to sign

        await targetMember.roles.add(targetRole);
        await targetMember.roles.remove(message.guild.roles.cache.find(r => r.name === settings.roles.player_retireable.fa_role_name));
        //tier should already be assigned to a player
        console.log(`<@${targetMember.user.id}> was signed by the ${franchises[abbrev].teams[tier]}!`)
        transactionChannel.send(`<@${targetMember.user.id}> was signed by the ${franchises[abbrev].teams[tier]}!`);

        let desiredName = (targetMember.nickname &&  targetMember.nickname.includes('|')) ? targetMember.nickname.split('|')[1].trim() : targetMember.user.username;
        await targetMember.setNickname(`${abbrev.toUpperCase()} | ${desiredName}`);
        // await targetMember.setNickname(`${abbrev.toUpperCase()} | ${targetMember.nickname.split('|')[1].trim()}`);
        return true;

    },

    "cut": async (message, args) => {
        if (!args[1] && !args[2]) {
            message.channel.send("Missing arguments. Proper syntax is: ?cut [@player] [abbreviation] [tier]");
            return false;
        }
        let abbrev = args[1].toLowerCase(); let tier = args[2].toLowerCase();
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">")).replace("!", "");
        let targetMember = message.guild.members.cache.get(targetId);
        let faRole = message.guild.roles.cache.find(r =>  r.name === settings.roles.player_retireable.fa_role_name);
        let transactionChannel = message.guild.channels.cache.find(r => r.id === settings.channels.transaction_channel_id);

        if (!(targetMember.nickname) || !(targetMember.nickname.includes('|'))) { //target isn't in the league?
            throw "User should have a nickname and is trying to be cut.";
        }
        
        await targetMember.guild.fetch();

        if (!(targetMember.roles.cache.some(r => r.name === franchises[abbrev].name))) {
            message.channel.send("User is not a member of that franchise, check your command syntax and try again.");
            return false;
        }

        await targetMember.roles.remove(targetMember.roles.cache.find(r => r.name === franchises[abbrev].name));
        await targetMember.roles.add(faRole);
        console.log(`<@${targetMember.user.id}> was cut by the ${franchises[abbrev].teams[tier]}!`);
        transactionChannel.send(`<@${targetMember.user.id}> was cut by the ${franchises[abbrev].teams[tier]}!`);
        await targetMember.setNickname(`FA | ${targetMember.nickname.split('|')[1].trim()}`);
        return true;
        
    }

}

async function removeRoles(jsonObj, message, targetMember) {
    let removedAny = false;
    for (var x of Object.keys(jsonObj)) {
        let targetRole = message.guild.roles.cache.find(r => r.name === jsonObj[x]);
        if (!targetRole) continue;
        let removed = await targetMember.roles.remove(targetRole);
        if (removed) console.log(`Role removed from user ${targetMember.user.id}:  ${targetRole.name} (if they had it)`)
    }
    //todo: add franchise role iteration, assign former gm/player
}