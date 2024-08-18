const fs = require('fs').promises;
const path = require('path');
const client = require('../client.js');
const log = require('../logger.js');

(async () => {
    try {
        const eventsPath = path.resolve(__dirname, '../events');
        const eventFiles = (await fs.readdir(eventsPath)).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = path.resolve(eventsPath, file);
            const event = require(filePath);

            if (event.name && event.execute) {
                const eventHandler = (...args) => event.execute(...args);
                if (event.once) {
                    client.once(event.name, eventHandler);
                } else {
                    client.on(event.name, eventHandler);
                }
                log.load(`⏳ Load event ${event.name}`);
            } else {
                log.error(`❌ Failed to load event ${file}`);
            }
        }

        log.nsfw(`🔞  Loaded ${eventFiles.length} events`);
    } catch (error) {
        log.error(`❌ Error loading events: ${error.message}`);
        console.log(error);
    }
})();