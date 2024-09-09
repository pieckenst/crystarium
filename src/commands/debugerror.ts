module.exports = {
    name: "throwerror",
    aliases: [],
    description: "Debugging command for throwing errors",
    async execute(client, msg) {
        try {
            throw new Error('Testing the error checking - debug only');
        } catch (error) {
            await msg.channel.createMessage('An error occurred: ' + error.message);
        }
    }
};