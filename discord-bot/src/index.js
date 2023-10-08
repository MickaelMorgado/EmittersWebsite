require('dotenv').config();
const fs = require('fs');

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
  let arr = getJsonFromStorage();
  let result = ``;
  arr.forEach(({ id, description, status }) => {
    result = result + `\n ${getStatusEmoji(status)} ${id} - ${description}`;
  });
  return `${result}`;
};

const addTodoItem = (value) => {
  let arr = getJsonFromStorage();
  todoList = [
    ...arr,
    { id: arr.length, description: value, status: enum_Status.todo },
  ];
  updateStorage(todoList);
};

const askForUserInput = (interaction) => {
  return interaction.channel.createMessageCollector({
    filter: (msg) => msg.author.id === interaction.user.id,
    time: 30000, // Time limit in milliseconds (30 seconds)
    max: 1, // Maximum number of messages to collect
  });
};

const enumModal = {
  addItem: 'myModal-1',
  toggleItem: 'myModal-2',
};

const spawnModalAndWaitForInput = async (
  interaction,
  promptMessage,
  enumModalVar
) => {
  const modal = new ModalBuilder()
    .setTitle(promptMessage)
    .setCustomId(enumModalVar)
    .setComponents(
      new ActionRowBuilder().setComponents(
        new TextInputBuilder()
          .setLabel('input')
          .setCustomId('modal-input')
          .setStyle(TextInputStyle.Short)
      )
    );

  await interaction.showModal(modal);
  const modalSubmitInteraction = await interaction.awaitModalSubmit({
    time: 99999,
    filter: (i) => {
      switch (enumModalVar) {
        case enumModal.addItem:
          const inputValue = i.fields.getTextInputValue('modal-input');
          addTodoItem(inputValue);
          // embed.setDescription(`${baseDescription}${getTodoList()}`);
          i.reply({
            content: `${replyPrefix} '${inputValue}' has been added!`,
            ephemeral: true,
          });
          break;
        case enumModal.toggleItem:
          const id = i.fields.getTextInputValue('modal-input');
          const selectedId = parseInt(id);
          let todoList = getJsonFromStorage();

          if (
            todoList !== undefined &&
            todoList.length > 0 &&
            id >= 0 &&
            id < todoList.length
          ) {
            let currentItemStatus = todoList[selectedId];

            if (currentItemStatus.status === enum_Status.completed) {
              currentItemStatus.status = enum_Status.todo;
            } else {
              currentItemStatus.status = enum_Status.completed;
            }

            updateStorage(todoList);
            // embed.setDescription(`${baseDescription}${getTodoList()}`);
            i.reply(
              `${replyPrefix} '${currentItemStatus.description}' has been updated!`
            );
          }
          break;
        default:
          console.log(`modal`);
          break;
      }
      return true;
    },
  });

  modalSubmitInteraction.reply({
    content: `Action Submitted`,
    ephemeral: true,
  });
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

// JSON Storage:
const updateStorage = (data) => {
  fs.writeFileSync(jsonFile, JSON.stringify(data));
};

const getJsonFromStorage = () => {
  if (!jsonFile) return;
  const rawData = fs.readFileSync(jsonFile);
  return JSON.parse(rawData);
};

const jsonFile = 'src/fileStorage.json';
console.log(getJsonFromStorage());

// Embeds:
let embed = new EmbedBuilder()
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

const refreshButton = new ButtonBuilder()
  .setCustomId('refresh-button')
  .setEmoji(`🔃`)
  .setStyle(ButtonStyle.Secondary);

// Rows:
const actionRow = new ActionRowBuilder().addComponents(
  addItemButton,
  toggleStatusButton,
  refreshButton
);

client.on('interactionCreate', async (interaction) => {
  /* ADD ITEM: */
  if (interaction.isButton() && interaction.customId === 'add-item-button') {
    await spawnModalAndWaitForInput(
      interaction,
      'Please enter a todo item. 👇',
      enumModal.addItem
    );
  } else if (
    /* REFRESH UI: */
    interaction.isButton() &&
    interaction.customId === 'refresh-button'
  ) {
    embed.setDescription(`${baseDescription}${getTodoList()}`);
    await interaction.message.edit({
      embeds: [embed],
      components: [actionRow],
    });
    interaction.reply({ content: 'UI refreshed!', ephemeral: true });
    interaction.deleteReply();
    // msg.delete();
  } else if (
    /* TOGGLE STATUS: */
    interaction.isButton() &&
    interaction.customId === 'toggle-status-button'
  ) {
    await spawnModalAndWaitForInput(
      interaction,
      'Please insert # of item ID 👇',
      enumModal.toggleItem
    );
  } else if (interaction.commandName === 'todo') {
    /* TODO COMMAND: */
    interaction.channel.send({
      embeds: [embed],
      components: [actionRow],
    });
    await interaction.reply({ content: 'TODO Created!', ephemeral: true });
    interaction.deleteReply();
  }
});

client.login(process.env.TOKEN);
