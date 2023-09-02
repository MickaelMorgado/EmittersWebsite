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
  enumModal
) => {
  const modal = new ModalBuilder()
    .setTitle(promptMessage)
    .setCustomId(enumModal)
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

const updateEmbed = (embed, interaction) => {
  embed.setDescription(`${baseDescription}${getTodoList()}`);
  interaction.message.edit({
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
let { key, name } = getJsonFromStorage();
console.log(key, name);

// updateStorage({ key: 'value' });

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

// Rows:
const actionRow = new ActionRowBuilder().addComponents(
  addItemButton,
  toggleStatusButton
);

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'add-item-button') {
    await spawnModalAndWaitForInput(
      interaction,
      'Please enter a todo item. 👇',
      enumModal.addItem
    );
  } else if (
    interaction.isButton() &&
    interaction.customId === 'toggle-status-button'
  ) {
    /*
    await interaction.reply({
      content: 'Please insert # of item ID you want to complete. 👇',
      ephemeral: true,
    });
    */
    await spawnModalAndWaitForInput(
      interaction,
      'Please insert # of item ID 👇',
      enumModal.toggleItem
    );

    /*
    const collector = askForUserInput(interaction);

    collector.on('collect', async (msg) => {
      collector.stop();

      const id = msg.content.trim();
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
        updateEmbed(embed, interaction);
      }

      // msg.delete();
      // interaction.deleteReply();
    });
    */
  } else if (interaction.type === InteractionType.ModalSubmit) {
    switch (interaction.customId) {
      case 'myModal-1':
        const value = interaction.fields.getTextInputValue('modal-input');

        addTodoItem(value);
        // updateEmbed(embed, interaction);

        break;
      case 'myModal-2':
        const id = interaction.fields.getTextInputValue('modal-input');
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
        }
        break;
    }

    updateEmbed(embed, interaction);
    /*
    await interaction.message.edit(
      embed.setDescription(`${baseDescription}${getTodoList()}`)
    );
    await interaction.reply({
      content: 'TODO Created!',
      ephemeral: true,
    });
    */
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
