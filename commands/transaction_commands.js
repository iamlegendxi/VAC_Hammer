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
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">"));
        let targetMember = await message.guild.members.cache.get(targetId);
        let desiredNickname = (args[1] ? args.slice(1).join(' ') : targetMember.user.username);
        if (desiredNickname.length > 28) {
            message.channel.send("Error: desired nickname is too long.")
            return false;
        }
        let deRole = await message.guild.roles.cache.find(r => r.name === settings.roles.default_de_role_name);
        let faRole = await message.guild.roles.cache.find(r => r.name = settings.roles.default_fa_role_name);

        if (targetId === settings.server_owner_id) {
            message.channel.send("Cannot modify nickname for this user.")
            return false;
        }

        // if (targetMember.roles.cache.has(deRole) ||
        //     targetMember.roles.cache.has(faRole)) {
        //     message.channel.send("Member is already a draft eligible player.")
        //     message.react("❌");
        //     return 1;
        // }
        //this new discord.js API fucking sucks

        targetMember.roles.add(deRole);
        targetMember.setNickname(`DE | ${desiredNickname}`);
        return true;
    }

}