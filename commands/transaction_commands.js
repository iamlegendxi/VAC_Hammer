var settings = require('../bot_settings');

module.exports = {

    execute: async function execute(message, args) {
        var cmd_type = args[0];
        try {
            await COMMANDS[cmd_type](message, args.slice(1));
        } catch (error) {
            throw error;
        }

    }
}

const COMMANDS = {

    "makeDE": async (message, args) => {
        let targetId = args[0].substring(args[0].indexOf("@") + 1, args[0].indexOf(">"));
        let targetMember = message.guild.members.cache.get(targetId);
        let deRole = message.guild.roles.cache.find(r => r.name === settings.roles.default_de_role_name);
        let desiredNickname = (args[1] ? args[1] : targetMember.user.username);
        let faRole = message.guild.roles.cache.find(r => r.name = settings.roles.default_fa_role_name);

        // console.log(targetMember.roles.cache.some(r => r.id === deRole.id))
        // console.log(targetMember.roles.cache.some(r => r.name = settings.roles.default_fa_role_name))

        // if (targetMember.roles.cache.has(deRole) ||
        //     targetMember.roles.cache.has(faRole)) {
        //     message.channel.send("Member is already a draft eligible player.")
        //     message.react("❌");
        //     return;
        // }
        //this new discord.js API fucking sucks

        targetMember.roles.add(deRole);
        targetMember.setNickname(`DE | ${desiredNickname}`);
    }

}