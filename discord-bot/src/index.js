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
  SlashCommandBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
} = require('discord.js');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.DirectMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const enum_Status = {
  completed: 'completed',
  ongoing: 'ongoing',
  todo: 'todo',
};
let todoList = [];

const getStatusEmoji = (enum_Status) => {
  switch (enum_Status) {
    case 'completed':
      return `✅`;
    case 'todo':
      return `🟩`;
    default:
      return `🟩`;
  }
};

const getTodoList = () => {
  let result = ``;
  todoList.forEach(({ id, description, status }) => {
    result = result + `\n ${getStatusEmoji(status)} ${id} - ${description}`;
  });
  return `${result}`;
};

const addTodoItem = (value) => {
  let result = ``;
  todoList = [
    ...todoList,
    { id: todoList.length, description: value, status: enum_Status.todo },
  ];
  return `${result}`;
};

const askForUserInput = (interaction) => {
  return interaction.channel.createMessageCollector({
    filter: (msg) => msg.author.id === interaction.user.id,
    time: 30000, // Time limit in milliseconds (30 seconds)
    max: 1, // Maximum number of messages to collect
  });
};

const spawnModalAndWaitForInput = async (interaction, promptMessage) => {
  const modal = new ModalBuilder()
    .setTitle(promptMessage)
    .setCustomId('myModal-1')
    .setComponents(
      new ActionRowBuilder().setComponents(
        new TextInputBuilder()
          .setLabel('input')
          .setCustomId('modal-input')
          .setStyle(TextInputStyle.Short)
      )
    );

  interaction.showModal(modal);
};

const baseTodoTitle = `EMITTERS progress`;
const todoTitleVersion = `v2.9`;
const baseDescription = `Currently working and completing this todo list:\n`;
const getTodoTitle = `${baseTodoTitle} ${todoTitleVersion}`;
const replyPrefix = `${getTodoTitle} update:`;

const updateEmbed = async (embed, interaction) => {
  embed.setDescription(`${baseDescription}${getTodoList()}`);
  await interaction.message.edit({
    embeds: [embed],
    components: [actionRow],
  });
};

// Embeds:
const embed = new EmbedBuilder()
  .setTitle(getTodoTitle)
  .setDescription(`${baseDescription}${getTodoList()}`);

// Buttons:
const addItemButton = new ButtonBuilder()
  .setCustomId('add-item-button')
  .setEmoji(`➕`)
  .setLabel('Add item')
  .setStyle(ButtonStyle.Primary);

const toggleStatusButton = new ButtonBuilder()
  .setCustomId('toggle-status-button')
  .setEmoji(`✔️`)
  .setLabel('Toggle status')
  .setStyle(ButtonStyle.Secondary);

// Rows:
const actionRow = new ActionRowBuilder().addComponents(
  addItemButton,
  toggleStatusButton
);

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'add-item-button') {
    await spawnModalAndWaitForInput(
      interaction,
      'Please enter a todo item. 👇'
    );
  } else if (
    interaction.isButton() &&
    interaction.customId === 'toggle-status-button'
  ) {
    await interaction.reply(
      'Please insert # of item ID you want to complete. 👇'
    );

    const collector = askForUserInput(interaction);

    collector.on('collect', async (msg) => {
      collector.stop(); // Stop collecting messages

      const id = msg.content.trim();

      /*
      console.log(
        `${todoList !== undefined} ${todoList.length > 0} ${id >= 0} ${
          id < todoList.length
        }`
      );
      */
      if (
        todoList !== undefined &&
        todoList.length > 0 &&
        id >= 0 &&
        id < todoList.length
      ) {
        const selectedId = parseInt(id);
        let currentItemStatus = todoList[selectedId];

        if (currentItemStatus.status === enum_Status.completed) {
          currentItemStatus.status = enum_Status.todo;
        } else {
          currentItemStatus.status = enum_Status.completed;
        }

        updateEmbed(embed, interaction);
      }

      msg.delete();
      interaction.deleteReply();
    });
  } else if (interaction.type === InteractionType.ModalSubmit) {
    const value = interaction.fields.getTextInputValue('modal-input');

    addTodoItem(value);

    try {
      updateEmbed(embed, interaction);
      interaction.reply(
        `${replyPrefix} ${interaction.user.username} added '${value}'!`
      );
    } catch (error) {
      console.error('An error occurred while updating the embed:', error);
    }
  } else if (interaction.commandName === 'todo') {
    interaction.channel.send({
      embeds: [embed],
      components: [actionRow],
    });
    await interaction.reply({ content: 'TODO Created!', ephemeral: true });
    interaction.deleteReply();
  }
});

client.login(process.env.TOKEN);
