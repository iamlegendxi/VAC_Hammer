const { Client, Intents } = require('discord.js');
const bot = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
var settings = require('./bot_settings');
const CommandParser = require("./commandparser");
const private_settings = require('./settings');

bot.on("interactionCreate", async interaction => {
    var asInteraction = true;
    try {
        console.log(`Slash command sent to bot: ${interaction.id} by user: ${interaction.member}`);
        if (message.contents.toLowerCase().startsWith(settings.prefix)) await CommandParser.parseCommand(interaction.toString(), interaction);
    } catch (error) {
        console.log(error);
        message.reply({content: "An error has occurred while processing this command. Contact a badmin about this issue.", fetchReply: true});
    }
})

bot.on("guildMemberAdd", async guildMember => {
    //todo: assign non-playing role
})

bot.on("messageCreate", async message => {
    var interaction = false;
    try {
        if (message.content.startsWith(settings.prefix)) {
            console.log(`Command sent to bot: ${message.content} by user: ${message.author}`);
            await CommandParser.parseCommand(message, interaction);
        } 
    } catch (error) {
        console.log(error);
        message.channel.send("An error has occurred while processing this command. Contact a badmin about this issue.");
    }

})



bot.login(private_settings.token);

bot.on("ready", () => {

    try {
        bot.user.setPresence({ activities: [{ name: 'Clicking heads!' }], status: "online" });
        console.log("VAC Hammer has loaded.");
    } catch (error) {
        console.log(error);
    }

});
