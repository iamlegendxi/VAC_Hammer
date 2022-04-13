var settings = require('./bot_settings');
const Transactions = require('./commands/transaction_commands');


module.exports = {

    parseCommand: async function parseCommand(message, asInteraction) {
        var msg = message.content;
        var args = msg.split(" ");
        var command = asInteraction ? args[0] : args[0].slice(1);

        switch (command) {
            case "hivac":
                var reply = `Hello, ${message.author}`
                await message.channel.send(reply);
                break;
            case "t":
                if (message.member.roles.cache.some(role => role.name === "Admin")) {
                    if (!args[1]) return; //handle this later, maybe replace with a help role?
                    await Transactions.execute(message, args.slice(1));
                }

                break;
        }
        message.react('✅');
    },

    // parseSlashCommand: async function parseSlashCommand(interaction, asInteraction) {
    //     var msg = interaction.
    // }
}


// async function sendReply(reply, message, asInteraction) {
//     asInteraction ? message.reply({ content: reply, fetchReply: true }) : message.channel.send(reply);
// }
