export interface OdptTrain {
	'@id': string;
	'@type': string;
	'dc:date': string;
	'odpt:trainNumber': string;
	'odpt:railway': string;
	'odpt:operator': string;
	'odpt:trainType': string;
	'odpt:fromStation': string;
	'odpt:toStation'?: string;
	'odpt:railDirection': string;
	'odpt:delay': number;
	'odpt:carComposition'?: number;
}

export interface OdptStation {
	'@id': string;
	'@type': string;
	'dc:date'?: string;
	'owl:sameAs': string;
	'dc:title': string;
	'odpt:stationCode'?: string;
	'odpt:railway': string;
	'odpt:operator': string;
	'odpt:stationTitle': {
		en?: string;
		ja: string;
	};
	'geo:lat'?: number;
	'geo:long'?: number;
}

// Map for human-readable names if needed
export const RAILWAY_NAMES: Record<string, string> = {
	'odpt.Railway:JR-East.Chuo': 'JR Chuo Line',
	'odpt.Railway:JR-East.ChuoRapid': 'JR Chuo Rapid Line',
	'odpt.Railway:JR-East.ChuoSobu': 'JR Chuo-Sobu Line',
	// Add more as needed
};

// API Endpoints - Authenticated APIs
// Standard API: https://api.odpt.org/api/v4/
// Challenge 2025 API: https://api-challenge.odpt.org/api/v4/
const STANDARD_API_ENDPOINT = process.env.ODPT_BASE_URL?.replace(/\/$/, '') || "https://api.odpt.org/api/v4";
const CHALLENGE_API_ENDPOINT = process.env.ODPT_CHALLENGE_BASE_URL?.replace(/\/$/, '') || "https://api-challenge.odpt.org/api/v4";

// Consumer Keys (note: .env has typo ODPT_COINSUMER_KEY)
const STANDARD_CONSUMER_KEY = process.env.ODPT_CONSUMER_KEY || process.env.ODPT_COINSUMER_KEY || '';
const CHALLENGE_CONSUMER_KEY = process.env.ODPT_CHALLENGE_CONSUMER_KEY || '';

// Debug: Log environment variables on server startup
console.log('[ODPT Config]', {
	STANDARD_API_ENDPOINT,
	CHALLENGE_API_ENDPOINT,
	STANDARD_CONSUMER_KEY: STANDARD_CONSUMER_KEY ? `${STANDARD_CONSUMER_KEY.substring(0, 10)}...` : '(empty)',
	CHALLENGE_CONSUMER_KEY: CHALLENGE_CONSUMER_KEY ? `${CHALLENGE_CONSUMER_KEY.substring(0, 10)}...` : '(empty)',
});

// Determine which API to use based on operator
// JR-East requires Challenge API, others can use Standard API
function getApiConfig(operator?: string): { endpoint: string; consumerKey: string } {
	if (operator?.includes('JR-East')) {
		return { endpoint: CHALLENGE_API_ENDPOINT, consumerKey: CHALLENGE_CONSUMER_KEY };
	}
	return { endpoint: STANDARD_API_ENDPOINT, consumerKey: STANDARD_CONSUMER_KEY };
}

// Mock Data Generator
function getMockTrains(railway: string): OdptTrain[] {
	const trains: OdptTrain[] = [];
	const count = 10;
	const now = new Date().toISOString();

	for (let i = 0; i < count; i++) {
		const isOutbound = i % 2 === 0;
		trains.push({
			'@id': `mock-train-${i}`,
			'@type': 'odpt:Train',
			'dc:date': now,
			'odpt:trainNumber': `${1000 + i}M`,
			'odpt:railway': railway || 'odpt.Railway:JR-East.ChuoRapid',
			'odpt:operator': 'odpt.Operator:JR-East',
			'odpt:trainType': 'odpt.TrainType:JR-East.Rapid',
			'odpt:fromStation': `mock-station-${i}`,
			'odpt:toStation': `mock-station-${i + 1}`,
			'odpt:railDirection': isOutbound ? 'odpt.RailDirection:Outbound' : 'odpt.RailDirection:Inbound',
			'odpt:delay': Math.random() > 0.8 ? 300 : 0, // 20% chance of delay
			'odpt:carComposition': 10
		});
	}
	return trains;
}

function getMockStations(railway: string): OdptStation[] {
	const stations: OdptStation[] = [];
	const names = ["Tokyo", "Kanda", "Ochanomizu", "Yotsuya", "Shinjuku", "Nakano", "Koenji", "Asagaya", "Ogikubo", "Nishi-Ogikubo", "Kichijoji", "Mitaka"];

	names.forEach((name, i) => {
		stations.push({
			'@id': `mock-station-${i}`,
			'@type': 'odpt:Station',
			'dc:date': new Date().toISOString(),
			'owl:sameAs': `mock-station-${i}`,
			'dc:title': name,
			'odpt:railway': railway || 'odpt.Railway:JR-East.ChuoRapid',
			'odpt:operator': 'odpt.Operator:JR-East',
			'odpt:stationTitle': {
				'en': name,
				'ja': name // In production use proper Japanese names
			}
		});
	});
	return stations;
}

export async function fetchTrains(railway?: string, operator?: string): Promise<OdptTrain[]> {
	if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
		return getMockTrains(railway || 'odpt.Railway:JR-East.ChuoRapid');
	}

	// Get the correct API config based on operator
	const { endpoint, consumerKey } = getApiConfig(operator || railway);

	if (!consumerKey) {
		console.error("fetchTrains: No consumer key configured for this API");
		return getMockTrains(railway || 'odpt.Railway:JR-East.ChuoRapid');
	}

	const params = new URLSearchParams();
	params.append("acl:consumerKey", consumerKey);

	if (railway) {
		params.append("odpt:railway", railway);
	}
	if (operator) {
		params.append("odpt:operator", operator);
	}

	const url = `${endpoint}/odpt:Train?${params.toString()}`;
	console.log(`Fetching trains from: ${url}`);

	try {
		const res = await fetch(url, {
			next: { revalidate: 30 } // Cache for 30s
		});
		if (!res.ok) {
			console.error("Failed to fetch trains:", res.status, res.statusText);
			if (res.status === 403 || res.status === 500) {
				console.warn("Falling back to mock trains due to API error.");
				return getMockTrains(railway || 'odpt.Railway:JR-East.ChuoRapid');
			}
			return [];
		}
		return await res.json();
	} catch (e) {
		console.error("Error fetching trains:", e);
		return getMockTrains(railway || 'odpt.Railway:JR-East.ChuoRapid');
	}
}

export async function fetchStations(railway?: string, operator?: string): Promise<OdptStation[]> {
	if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
		return getMockStations(railway || 'odpt.Railway:JR-East.ChuoRapid');
	}

	// Get the correct API config based on operator
	const { endpoint, consumerKey } = getApiConfig(operator || railway);

	if (!consumerKey) {
		console.error("fetchStations: No consumer key configured");
		return getMockStations(railway || 'odpt.Railway:JR-East.ChuoRapid');
	}

	const params = new URLSearchParams();
	params.append("acl:consumerKey", consumerKey);
	if (railway) {
		params.append("odpt:railway", railway);
	}

	const url = `${endpoint}/odpt:Station?${params.toString()}`;
	console.log(`Fetching stations from: ${url}`);

	try {
		const res = await fetch(url);
		if (!res.ok) {
			console.error("Failed to fetch stations:", res.status, res.statusText);
			if (res.status === 403 || res.status === 500) {
				return getMockStations(railway || 'odpt.Railway:JR-East.ChuoRapid');
			}
			return [];
		}
		return await res.json();
	} catch (e) {
		console.error(e);
		return getMockStations(railway || 'odpt.Railway:JR-East.ChuoRapid');
	}
}
