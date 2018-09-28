require('dotenv').config();
const { CLEVERBOT_TOKEN, CLEVERBOT_KEY } = process.env;
const { Client } = require('discord.js');
const request = require('node-superfetch');
const client = new Client({ disableEveryone: true });
const activities = require('./assets/json/activity');
const blankResponses = require('./assets/json/blank-responses');
const convos = new Map();
let mentionRegex;

client.on('ready', () => {
	console.log(`[READY] Logged in as ${client.user.tag}! (${client.user.id})`);
	mentionRegex = new RegExp(`<@!?${client.user.id}>`);
	client.setInterval(() => {
		const activity = activities[Math.floor(Math.random() * activities.length)];
		client.user.setActivity(activity.text, { type: activity.type });
	}, 60000);
});

client.on('message', async msg => {
	if ((msg.channel.type === 'text' && !msg.mentions.has(client.user.id)) || msg.author.bot) return;
	msg.channel.startTyping().catch(() => msg.channel.stopTyping());
	try {
		const convo = convos.get(msg.channel.id);
		const { body } = await request
			.get('https://www.cleverbot.com/getreply')
			.query({
				key: CLEVERBOT_KEY,
				cs: convo ? convo.cs : '',
				input: msg.content.replace(mentionRegex, '').trim()
			});
		if (convo) clearTimeout(convo.timeout);
		const timeout = setTimeout(() => convos.delete(msg.channel.id), 600000);
		convos.set(msg.channel.id, { cs: body.cs, timeout });
		await msg.reply(body.output || blankResponses[Math.floor(Math.random() * blankResponses.length)]);
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

client.login(CLEVERBOT_TOKEN);

process.on('unhandledRejection', err => {
	console.error('[FATAL] Unhandled Promise Rejection.', err);
	process.exit(1);
});
