import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from './utils/config';
import { database } from './utils/database';
import { logger } from './utils/logger';

interface Command {
  data: any;
  execute: (interaction: any) => Promise<void>;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

(client as any).commands = new Collection();

async function loadCommands() {
  const commandsPath = join(__dirname, 'commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command: Command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      (client as any).commands.set(command.data.name, command);
      logger.info(`Loaded command: ${command.data.name}`);
    } else {
      logger.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
    }
  }
}

async function loadEvents() {
  const eventsPath = join(__dirname, 'events');
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    logger.info(`Loaded event: ${event.name}`);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = (client as any).commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    const reply = {
      content: 'There was an error while executing this command!',
      ephemeral: true,
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

async function startBot() {
  try {
    await database.connect();
    logger.info('Database connected successfully');

    await loadCommands();
    await loadEvents();

    await client.login(config.discord.token);
    logger.info('Bot started successfully');
  } catch (error) {
    logger.error('Error starting bot:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  client.destroy();
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  client.destroy();
  await database.disconnect();
  process.exit(0);
});

startBot();