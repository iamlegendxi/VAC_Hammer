var settings = require('./bot_settings');
const private_settings = require('./settings');
const Transactions = require('./commands/transaction_commands');


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
            console.log(message.author.id)
            if (!(message.author.id == settings.bot_owner_id)) {
                await message.channel.send("Nice try.")
                return false;
            }
            await bot.destroy();
            await bot.login(private_settings.token);
            await message.channel.send("Bot has been restarted!")
            return true;
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
    },

    // parseSlashCommand: async function parseSlashCommand(interaction, asInteraction) {
    //     var msg = interaction.
    // }
}


// async function sendReply(reply, message, asInteraction) {
//     asInteraction ? message.reply({ content: reply, fetchReply: true }) : message.channel.send(reply);
// }