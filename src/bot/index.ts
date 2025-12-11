import { Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js';
import puppeteer from 'puppeteer';
import cron from 'node-cron';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;
const IMAGE_PATH = path.join(process.cwd(), 'public', 'status.png');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

async function generateImage() {
	console.log('Generating image...');
	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});

	try {
		const page = await browser.newPage();
		// Enable console logging
		page.on('console', msg => console.log('PAGE LOG:', msg.text()));

		await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
		await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
		await page.waitForSelector('.min-h-[400px]', { timeout: 10000 }); // 10s timeout

		const element = await page.$('main');
		if (element) {
			await element.screenshot({ path: IMAGE_PATH });
			console.log(`Image saved to ${IMAGE_PATH}`);
		} else {
			console.error('Could not find main element to screenshot');
		}
	} catch (error) {
		console.error('Error generating image:', error);
	} finally {
		await browser.close();
	}
}

client.once('ready', () => {
	console.log(`Logged in as ${client.user?.tag}!`);
	cron.schedule('* * * * *', async () => {
		await generateImage();
	});
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	if (interaction.commandName === 'monitor') {
		await interaction.deferReply();
		if (fs.existsSync(IMAGE_PATH)) {
			const file = new AttachmentBuilder(IMAGE_PATH);
			await interaction.editReply({ files: [file] });
		} else {
			await generateImage();
			if (fs.existsSync(IMAGE_PATH)) {
				const file = new AttachmentBuilder(IMAGE_PATH);
				await interaction.editReply({ files: [file] });
			} else {
				await interaction.editReply('Monitor image not available yet. Please wait.');
			}
		}
	}
});

if (process.env.DISCORD_TOKEN) {
	client.login(process.env.DISCORD_TOKEN);
} else {
	console.warn('DISCORD_TOKEN not found. Bot will not run, but Image Generator scheduler is active if this script runs.');
	cron.schedule('* * * * *', async () => {
		await generateImage();
	});
}

generateImage();
