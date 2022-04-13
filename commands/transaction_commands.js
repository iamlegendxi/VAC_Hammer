var settings = require('../bot_settings');

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