const { AYA_TOKEN, CLEVERBOT_KEY } = process.env;
const { Client } = require('discord.js');
const request = require('node-superfetch');
const client = new Client({ disableEveryone: true });
const convos = new Map();
let mentionRegex;

client.on('ready', () => {
	console.log(`[READY] Logged in as ${client.user.tag}! (${client.user.id})`);
	mentionRegex = new RegExp(`<@!?${client.user.id}>`);
});

client.on('message', async msg => {
	if ((msg.channel.type === 'text' && !msg.mentions.has(client.user.id)) || msg.author.bot) return;
	msg.channel.startTyping().catch(() => msg.channel.stopTyping());
	console.log(msg.content.replace(mentionRegex, '').trim());
	try {
		const { body } = await request
			.get('https://www.cleverbot.com/getreply')
			.query({
				key: CLEVERBOT_KEY,
				cs: convos.get(msg.author.id),
				input: msg.content.replace(mentionRegex, '').trim()
			});
		convos.set(msg.author.id, body.cs);
		await msg.reply(body.output);
	} catch (err) {
		await msg.reply(`Oh no, an error occurred: \`${err.message}\`. Try again later!`);
	} finally {
		msg.channel.stopTyping();
	}
});

client.on('disconnect', event => {
	console.error(`[DISCONNECT] Disconnected with code ${event.code}.`);
	process.exit(0);
});

client.on('error', err => console.error('[ERROR]', err));

client.on('warn', err => console.warn('[WARNING]', err));

client.login(AYA_TOKEN);

process.on('unhandledRejection', err => {
	console.error('[FATAL] Unhandled Promise Rejection.', err);
	process.exit(1);
});
