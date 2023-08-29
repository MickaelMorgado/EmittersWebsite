require('dotenv').config();

const {
  Client,
  IntentsBitField,
  MessageEm,
  MessageButton,
  MessageActionRow,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ComponentType,
  ActionRow,
} = require('discord.js');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.DirectMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const prefix = '!'; // Change this to your desired command prefix
const todoList = {};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // Check if the message is from a bot or doesn't start with the prefix
  if (message.author.bot || !message.content.startsWith(prefix)) {
    return;
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const firstButton = new ButtonBuilder()
    .setCustomId('first-button')
    .setLabel('Add a todo')
    .setStyle(ButtonStyle.Primary);

  const actionRow = new ActionRowBuilder().addComponents(firstButton);

  const reply = await message.reply({
    content: 'TODO',
    components: [actionRow],
  });

  const filter = (i) => i.user.id === message.author.id;

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
  });

  collector.on('collect', (interaction) => {
    if (interaction.customId === 'first-button') {
      const todoText = 'This is a new todo item'; // Replace with user input or dynamic data
      if (!todoList[interaction.user.id]) {
        todoList[interaction.user.id] = [];
      }
      todoList[interaction.user.id].push(todoText);

      const updatedTodoList = todoList[interaction.user.id].join('\n👉 - ');

      interaction.update({
        content: `TODO:\n- ${updatedTodoList}`, // Edit the message with additional text
        components: [actionRow], // Remove the button
      });
    }
  });
});

client.login(process.env.TOKEN);
