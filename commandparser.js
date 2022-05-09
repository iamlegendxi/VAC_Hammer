const settings = require('./bot_settings');
const private_settings = require('./settings');
const Transactions = require('./commands/transaction_commands');
const HelpCommands = require('./commands/help_commands');
const Rosters = require('./commands/roster_commands');
const FunCommands = require('./commands/fun_commands');


module.exports = {

    parseCommand: async function parseCommand(message, bot, asInteraction) {
        var msg = message.content;
        var args = msg.split(" ");
        var command = asInteraction ? args[0].replace("?","") : args[0].slice(1);

        if (command == "hivac") {
            var reply = `Hello, ${message.author}`
            await message.channel.send(reply);
            return true;
        }

        else if (command == "reboot") {
            console.log(`${message.author.id} tried to do a naughty`)
            if (!(message.author.id == settings.bot_owner_id)) {
                await message.channel.send("Nice try.")
                return false;
            }
            await message.channel.send("Restarting...");
            process.exit();
        }
        
        else if (Transactions.exists(command)) {
            await (message.guild.fetch());
            if (message.member.roles.cache.some(role => role.name === "Admin")) {
                return await Transactions.execute(message, args);
            }
            else {
                message.channel.send("Error: You must be an admin to run that command.")
                return false;
            }
        }

        else if (command == "dates") {
            return await HelpCommands.displayDates(message);
        }

        else if (command == "help") {
            return await HelpCommands.displayHelpMenu(message, args);
        }

        else if (Rosters.exists(command)) {
            await (message.guild.fetch());
            return await Rosters.search(message, args);
        }

        else if (FunCommands.exists(command)) {
            await message.guild.fetch();
            return await FunCommands.execute(message, args);
        }
    },

    exists: async function exists(command) {
        
        if ("hivacreboothelpdates".includes(command)) { //todo: change this
            return true;
        }
        
        else if (Transactions.exists(command)) {
            return true;
        }

        else if (Rosters.exists(command)) {
            return true;
        }

        else if (FunCommands.exists(command)) {
            return true;
        }

        return false;

    }

    // parseSlashCommand: async function parseSlashCommand(interaction, asInteraction) {
    //     var msg = interaction.
    // }
}


// async function sendReply(reply, message, asInteraction) {
//     asInteraction ? message.reply({ content: reply, fetchReply: true }) : message.channel.send(reply);
// }
