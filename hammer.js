const { Client, Intents, MessageEmbed } = require('discord.js');
const bot = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],

    partials: ['GUILD_MEMBER']
});
const settings = require('./bot_settings');
const CommandParser = require("./commandparser");
const private_settings = require('./settings');
const colors = require("./data/colors");


var welcome_message = "PermFA signups are now closed! This season is currently concluding, but make sure you stick around for Season 2!";

// bot.on("interactionCreate", async interaction => {
//     var asInteraction = true;
//     try {
//         console.log(`Slash command sent to bot: ${interaction.id} by user: ${interaction.member}`);
//         if (message.contents.toLowerCase().startsWith(settings.prefix)) await CommandParser.parseSlashCommand(interaction.toString(), interaction);
//     } catch (error) {
//         console.log(error);
//         message.reply({content: "An error has occurred while processing this command. Contact a badmin about this issue.", fetchReply: true});
//     }
// })

bot.on("guildMemberAdd", async guildMember => {
    let channel = guildMember.guild.channels.cache.find(c => c.id === settings.channels.welcome_channel_id);
    channel.send(`${guildMember.user}, welcome to Valorant Draft Circuit! ${welcome_message}`);
    let spec_role = guildMember.guild.roles.cache.find(r => r.name === settings.roles.default_role_name)
    if (!spec_role) console.log(`Error occurred while trying to give player: ${guildMember.nickname} the default role`)
    guildMember.roles.add(spec_role);

    let logChannel = guildMember.guild.channels.cache.find(r => r.id === settings.channels.log_channel_id);
    
    await logChannel.send({
        embeds: [new MessageEmbed()
            .setAuthor({ name: `${guildMember.user.username} (${guildMember.user.username}) has joined the server` })
            .setColor(colors.vdc_default)
            .setDescription(`<@${guildMember.user.id}> joined the server, bringing the member count to ${guildMember.guild.memberCount}`)
            .setTimestamp()
        ]
    })

})

bot.on("guildMemberRemove", async guildMember => {
    let logChannel = guildMember.guild.channels.cache.find(r => r.id === settings.channels.log_channel_id);
    
    await logChannel.send({
        embeds: [new MessageEmbed()
            .setAuthor({ name: `${guildMember.user.username} (${guildMember.user.username}) has left the server` })
            .setColor(colors.vdc_default)
            .setDescription(`<@${guildMember.user.id}> left the server, bringing the member count to ${guildMember.guild.memberCount}`)
            .setTimestamp()
        ]
    })
})

bot.on("messageCreate", async message => {
    var interaction = false;
    try {
        if (message.content.startsWith(settings.prefix)) {
            if (message.content === "?") return;
            let msg_check = message.content.includes(' ') ? message.content.split(' ').slice(0,1)[0] : message.content;
            msg_check = msg_check.replace("?", "");
            console.log(`Command sent to bot: ${message.content} by user: ${message.author}`);
            let cmd = await CommandParser.parseCommand(message, bot, interaction);
            console.log(cmd)
            if (await CommandParser.exists(msg_check)) (await cmd ? message.react("✅") : await message.react("❌"));
        }
    } catch (error) {
        console.log(error);
        message.channel.send("An error has occurred while processing this command. Contact a badmin about this issue.");
        message.react("❌");
    }

})



bot.login(private_settings.token);

bot.on("ready", () => {

    try {
        bot.user.setPresence({ activities: [{ name: 'in this cool new Valorant league' }], status: "online" });
        console.log("VAC Hammer has loaded.");
    } catch (error) {
        console.log(error);
    }

});
