const { Client, Intents } = require('discord.js');
const bot = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
var settings = require('./bot_settings');

module.exports = {

    parseCommand: async function parseCommand(message, asInteraction) {
        var msg = message.content;
        var args = msg.split(" ");
        var command = asInteraction ? args[0] : args[0].slice(1);

        switch (command) {
            case "hivac":
                var reply = `Hello, ${message.author}`
                await sendReply(reply, message, asInteraction);
                break;
            case "makeDE":
        }
    }
}


async function sendReply(reply, message, asInteraction) {
    asInteraction ? message.reply({ content: reply, fetchReply: true }) : message.channel.send(reply);
}
