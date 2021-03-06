const settings = require('../bot_settings');
const colors = require('../data/colors');
const { MessageEmbed } = require('discord.js');


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

    "soon": async (message, args) => {

        await message.channel.send("Soon ™");
        return true;

    },

    "badmins": async (message, args) => {
        
        await message.channel.send("https://tenor.com/view/disintegrating-funny-thanos-gif-22399978");
        return true;
    },

    "goodmins": async (message, args) => {
        
        await message.channel.send("https://tenor.com/view/rjumen-laugh-man-cool-nice-perfect-gif-23675313");
        return true;
    },

    "chadmins": async (message, args) => {
        
        await message.channel.send("https://tenor.com/view/mujikcboro-seriymujik-gif-24361533");
        return true;
    },

    "sudo": async (message, args) => {
        if (message.author.id != settings.bot_owner_id) return false;
        
        let channelId = args[0];
        let msg = args.slice(1).join(' ');
        let targetChannel = message.guild.channels.cache.get(channelId);

        await targetChannel.send(msg);
        return true;
    }

}