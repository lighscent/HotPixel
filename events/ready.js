const { REST, Routes, Events, ActivityType, Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const log = require('../logger.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        try {
            await loadCommands(client);
            await refreshApplicationCommands(client);
            await setClientActivity(client);
        } catch (error) {
            log.error(`❌ Error during client ready event: ${error.message}`);
            console.error(error);
        }
    },
};

async function loadCommands(client) {
    const commands = [];
    client.commands = new Collection();
    const foldersPath = path.join(__dirname, '../commands');
    const commandFolders = await fs.readdir(foldersPath);

    await Promise.all(commandFolders.map(async (folder) => {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

        await Promise.all(commandFiles.map(async (file) => {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
                log.load(`⏳ Load command ${command.data.name}`);
            } else {
                log.error(`❌ Failed to load command ${file}`);
            }
        }));
    }));

    return commands;
}

async function refreshApplicationCommands(client) {
    const rest = new REST().setToken(process.env.TOKEN);
    log.load('⏳ Started refreshing application (/) commands.');
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: await loadCommands(client) },
        );
        log.load('⏳ Successfully reloaded application (/) commands.');
    } catch (error) {
        log.error(`❌ Error during refreshing application (/) commands: ${error.message}`);
        console.error(error);
    }
}

async function setClientActivity(client) {
    await client.user.setActivity({
        name: 'NSFW content',
        type: ActivityType.Watching,
    });
    log.nsfw(`🔞  Logged in as ${client.user.tag}`);
}