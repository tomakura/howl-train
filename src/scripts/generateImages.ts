/**
 * Image Generation Script
 * 
 * Generates PNG images for all supported railway lines using Puppeteer.
 * Run with: npx tsx src/scripts/generateImages.ts
 */

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

// Supported railways for image generation
const RAILWAYS = [
	// JR East
	{ id: 'JR-East.ChuoRapid', name: 'JR中央線快速' },
	{ id: 'JR-East.Yamanote', name: 'JR山手線' },
	{ id: 'JR-East.KeihinTohoku', name: 'JR京浜東北線' },
	{ id: 'JR-East.SaikyoKawagoe', name: 'JR埼京川越線' },
	{ id: 'JR-East.Tokaido', name: 'JR東海道線' },
	{ id: 'JR-East.Musashino', name: 'JR武蔵野線' },
	{ id: 'JR-East.Keiyo', name: 'JR京葉線' },
	{ id: 'JR-East.JobanRapid', name: 'JR常磐線快速' },

	// Toei
	{ id: 'Toei.Asakusa', name: '都営浅草線' },
	{ id: 'Toei.Mita', name: '都営三田線' },
	{ id: 'Toei.Shinjuku', name: '都営新宿線' },
	{ id: 'Toei.Oedo', name: '都営大江戸線' },

	// Tokyo Metro
	{ id: 'TokyoMetro.Ginza', name: '東京メトロ銀座線' },
	{ id: 'TokyoMetro.Marunouchi', name: '東京メトロ丸ノ内線' },
	{ id: 'TokyoMetro.Hibiya', name: '東京メトロ日比谷線' },
	{ id: 'TokyoMetro.Tozai', name: '東京メトロ東西線' },
	{ id: 'TokyoMetro.Chiyoda', name: '東京メトロ千代田線' },
	{ id: 'TokyoMetro.Yurakucho', name: '東京メトロ有楽町線' },
	{ id: 'TokyoMetro.Hanzomon', name: '東京メトロ半蔵門線' },
	{ id: 'TokyoMetro.Namboku', name: '東京メトロ南北線' },
	{ id: 'TokyoMetro.Fukutoshin', name: '東京メトロ副都心線' },
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'status');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateImage(browser: Awaited<ReturnType<typeof puppeteer.launch>>, railway: { id: string; name: string }) {
	const page = await browser.newPage();

	try {
		// Set viewport to Full HD 16:9
		await page.setViewport({
			width: 1920,
			height: 1080,
			deviceScaleFactor: 1,
		});

		const url = `${BASE_URL}/render/${railway.id}`;
		console.log(`📸 Capturing: ${railway.name} (${url})`);

		await page.goto(url, {
			waitUntil: 'networkidle0',
			timeout: 30000,
		});

		// Wait for the railway line to render
		await page.waitForSelector('.railway-line-container', { timeout: 10000 });

		// Additional wait for any animations
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Generate filename
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
		const safeId = railway.id.replace(/[.:]/g, '_');
		const filename = `${safeId}_${timestamp}.png`;
		const filepath = path.join(OUTPUT_DIR, filename);

		// Take screenshot
		await page.screenshot({
			path: filepath,
			type: 'png',
			fullPage: false,
			clip: {
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
			},
		});

		// Also save as "latest" for easy access
		const latestFilename = `${safeId}_latest.png`;
		const latestFilepath = path.join(OUTPUT_DIR, latestFilename);
		fs.copyFileSync(filepath, latestFilepath);

		console.log(`✅ Saved: ${filename}`);
		return { success: true, filename };

	} catch (error) {
		console.error(`❌ Failed to capture ${railway.name}:`, error);
		return { success: false, error };
	} finally {
		await page.close();
	}
}

async function generateAllImages() {
	console.log('🚂 Starting image generation...');
	console.log(`📁 Output directory: ${OUTPUT_DIR}`);
	console.log(`🌐 Base URL: ${BASE_URL}`);
	console.log('');

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	const results = {
		success: 0,
		failed: 0,
		total: RAILWAYS.length,
	};

	try {
		for (const railway of RAILWAYS) {
			const result = await generateImage(browser, railway);
			if (result.success) {
				results.success++;
			} else {
				results.failed++;
			}
		}
	} finally {
		await browser.close();
	}

	console.log('');
	console.log('📊 Results:');
	console.log(`   ✅ Success: ${results.success}`);
	console.log(`   ❌ Failed: ${results.failed}`);
	console.log(`   📁 Total: ${results.total}`);

	return results;
}

// Run if executed directly
generateAllImages().catch(console.error);
