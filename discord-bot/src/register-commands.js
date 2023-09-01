require('dotenv').config({ path: __dirname + '/../.env' });

const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'todo',
    description: 'create a todo list',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('register slash commands ...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('regisetered successfully.');
  } catch (error) {
    console.log(`error: ${error}`);
  }
})();
