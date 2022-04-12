const Discord = require('discord.js');
const bot = new Discord.Client();
var settings = require('./bot_settings');
const CommandParser = require('./commandparser.js');
const private_settings = require('./settings')






bot.login(private_settings.token);

bot.on("ready", () => {

    bot.user.setPresence({activities: [{name: 'Clicking heads!"'}], status: "online"}).catch(console.error)
    console.log("VAC Hammer has loaded.")

});
