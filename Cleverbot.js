require('dotenv').config();
const { CLEVERBOT_TOKEN, CLEVERBOT_KEY } = process.env;
const { Client } = require('discord.js');
const request = require('node-superfetch');
const winston = require('winston');
const client = new Client({ disableEveryone: true });
const blankResponses = ['What?', 'Huh?', 'I don\'t understand.'];
const logger = winston.createLogger({
	transports: [new winston.transports.Console()],
	format: winston.format.combine(
		winston.format.timestamp({ format: 'MM/DD/YYYY HH:mm:ss' }),
		winston.format.printf(log => `[${log.timestamp}] [${log.level.toUpperCase()}]: ${log.message}`)
	)
});
const convos = new Map();
let mentionRegex;

client.on('ready', () => {
	logger.info(`[READY] Logged in as ${client.user.tag}! ID: ${client.user.id}`);
	mentionRegex = new RegExp(`<@!?${client.user.id}>`);
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
	logger.error(`[DISCONNECT] Disconnected with code ${event.code}.`);
	process.exit(0);
});

client.on('error', err => logger.error(err));

client.on('warn', warn => logger.warn(warn));

client.login(CLEVERBOT_TOKEN);
