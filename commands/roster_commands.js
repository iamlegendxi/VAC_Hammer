const settings = require('../bot_settings');
const franchises = require('../data/franchises');
const colors = require('../data/colors');
const { MessageEmbed } = require('discord.js');

module.exports = {
    search: async function search(message, args) {
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
    "roster": async (message, args) => {
        if (!args[0]) {
            await message.channel.send("Missing arguments. Proper syntax is: ?roster [team]");
            return false;
        }
        let searchQuery = args.join(' ').trim();
        let targetRole, tierRole;
        let tier, teamName, franchise;

        for (let x of Object.keys(franchises)) {
            for (let y of Object.keys(franchises[x].teams)) {
                if (franchises[x].teams[y].toLowerCase() === searchQuery.toLowerCase()) {
                    targetRole = message.guild.roles.cache.find(r => r.id === franchises[x].role_id);
                    tierRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === y);
                    tier = y;
                    teamName = franchises[x].teams[y];
                    franchise = franchises[x];
                    break;
                }
            }
            if (targetRole) break;
        }

        if (!targetRole) {
            await message.channel.send("Could not find the specified team.");
            return false;
        }

        //let roleList = targetRole.members.filter(m => tierRole.members.some(mem => mem.user.id === m.user.id));
        let roleList = await targetRole.members.map(m => m.nickname).filter(s => tierRole.members.map(m => m.nickname).includes(s));
        //let tierList = tierRole.members.map(m =>  m.user.id);
        let msg = "```";

        for (let x in roleList) {
            msg = msg + roleList[x] + "\n";
        }
        msg = msg + "```";

        await message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(colors.tier[tier])
                .setTitle(`${teamName} active roster:`)
                .setDescription(`${msg}`)
                .setThumbnail(franchise.image)
            ]
        });

        return true;
    },

    "franchises": async (message, args) => {
        let abbrev = "";
        let franchise = "";

        for (let x of Object.keys(franchises)) {
            // let gmMember = message.guild.members.cache.find(m => m.id === franchises[x].gm_id);
            // console.log(gmMember.user);
            abbrev = abbrev + `${x.toUpperCase()}\n`;
            franchise = franchise + `${franchises[x].name}\n`;
        }

        await message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(colors.vdc_default)
                .setTitle("Franchises")
                .addField("Prefix", abbrev, true)
                .addField("Franchise", franchise, true)
            ]
        });

        return true;
    },

    "teams": async (message, args) => {
        if (!args[0]) {
            await message.channel.send("Missing arguments. Proper syntax is ?teams [franchise]");
            return false;
        }
        let franchise = franchises[args[0].toLowerCase()];
        let teams = "";
        let tier = "";

        for (let x of Object.keys(franchise.teams)) {
            if (franchise.teams[x]) {
                teams = teams + `${franchise.teams[x]}\n`;
                tier = tier + `${x}\n`;
            }
        }

        await message.channel.send({
            embeds: [new MessageEmbed()
                .setColor(colors.vdc_default)
                .setTitle(`Teams of ${franchise.name}`)
                .addField("Team", teams, true)
                .addField("Tier", tier, true)
            ]
        });

        return true;
    }
}
