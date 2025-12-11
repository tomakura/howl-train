/**
 * Scheduled Image Generation Script
 * 
 * Runs image generation every minute using node-cron.
 * Run with: npx tsx src/scripts/scheduler.ts
 */

import 'dotenv/config';
import * as cron from 'node-cron';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

// Railways to generate
const RAILWAYS = [
	{ id: 'JR-East.ChuoRapid', name: 'JR中央線快速' },
	{ id: 'JR-East.Yamanote', name: 'JR山手線' },
	{ id: 'JR-East.KeihinTohoku', name: 'JR京浜東北線' },
	{ id: 'Toei.Asakusa', name: '都営浅草線' },
	{ id: 'Toei.Mita', name: '都営三田線' },
	{ id: 'Toei.Shinjuku', name: '都営新宿線' },
	{ id: 'Toei.Oedo', name: '都営大江戸線' },
	// Add more as needed
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'status');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

async function initBrowser() {
	if (browser) return browser;

	browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	return browser;
}

async function generateImage(railway: { id: string; name: string }) {
	const b = await initBrowser();
	const page = await b.newPage();

	try {
		await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

		const url = `${BASE_URL}/render/${railway.id}`;
		await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
		await page.waitForSelector('.railway-line-container', { timeout: 10000 });
		await new Promise(resolve => setTimeout(resolve, 500));

		const safeId = railway.id.replace(/[.:]/g, '_');
		const filepath = path.join(OUTPUT_DIR, `${safeId}_latest.png`);

		await page.screenshot({
			path: filepath,
			type: 'png',
			clip: { x: 0, y: 0, width: 1920, height: 1080 },
		});

		console.log(`✅ [${new Date().toLocaleTimeString('ja-JP')}] ${railway.name}`);

	} catch (error) {
		console.error(`❌ [${new Date().toLocaleTimeString('ja-JP')}] ${railway.name}:`, error);
	} finally {
		await page.close();
	}
}

async function generateAll() {
	console.log(`🔄 [${new Date().toLocaleTimeString('ja-JP')}] Generating images...`);

	for (const railway of RAILWAYS) {
		await generateImage(railway);
	}

	console.log(`✨ [${new Date().toLocaleTimeString('ja-JP')}] Done`);
}

// Initial generation
generateAll();

// Schedule every minute
cron.schedule('* * * * *', () => {
	generateAll();
});

console.log('📅 Scheduler started. Generating images every minute.');
console.log(`📁 Output: ${OUTPUT_DIR}`);
console.log('Press Ctrl+C to stop.');

// Handle graceful shutdown
process.on('SIGINT', async () => {
	console.log('\n🛑 Shutting down...');
	if (browser) {
		await browser.close();
	}
	process.exit(0);
});
