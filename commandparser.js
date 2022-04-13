var settings = require('./bot_settings');
const Transactions = require('./commands/transaction_commands');


module.exports = {

    parseCommand: async function parseCommand(message, asInteraction) {
        var msg = message.content;
        var args = msg.split(" ");
        var command = asInteraction ? args[0].replace("?","") : args[0].slice(1);

        if (command == "hivac") {
            var reply = `Hello, ${message.author}`
            await message.channel.send(reply);
            return true;
        }
        
        else if (Transactions.exists(command)) {
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
