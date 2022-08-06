const settings = require('../bot_settings');
const private_settings = require('../settings');
const fetch = require("node-fetch")

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
    },

    "accept": async (message, args) => {
        const roled = message.member.roles.cache.find(role => role.name === "Admin" || role.name === "Team Leader");
        if (!roled) return false;

        let user_id = args[0];
        let user = message.guild.members.cache.get(user_id);
        if (!user) return false;

        let plr_data = await fetch(`https://api.valorantdraftcircuit.com/items/members/${user_id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${private_settings.API_AUTH}`
            },
            body: JSON.stringify({
                isPlayer: true
            })
        })

        plr_data = await plr_data.json();

        let role = message.guild.roles.cache.find(r => r.id === "966901006652833862");
        let de_role = message.guild.roles.cache.find(r => r.id === "963568945959419905");
        
        await user.roles.add(role);

        if(!user.roles.cache.has("966901006652833862")){
            await user.roles.add(de_role)
            await user.setNickname(`DE | ${plr_data.data.valorantIGN}`)
        }

        await user.send("You have been accepted into the Valorant Draft Circuit!");

        return true;
    },

    "reject": async (message, args) => {
        const roled = message.member.roles.cache.find(role => role.name === "Admin" || role.name === "Team Leader");
        if (!roled) return false;

        let user_id = args[0];
        let user = message.guild.members.cache.get(user_id);
        if (!user) return false;

        await user.send("You have been rejected from the Valorant Draft Circuit, feel free to apply again when you meet the requirements!");

        return true;
    }
}