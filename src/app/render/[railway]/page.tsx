import type { OdptTrain, OdptStation } from '@/types/odpt';
import RailwayLine from '@/components/RailwayLine';

interface RenderPageProps {
	params: Promise<{ railway: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Railway info lookup
const RAILWAY_INFO: Record<string, { name: string; color: string }> = {
	'JR-East.ChuoRapid': { name: 'JR中央線快速', color: '#ff6600' },
	'JR-East.Yamanote': { name: 'JR山手線', color: '#9acd32' },
	'JR-East.KeihinTohoku': { name: 'JR京浜東北線', color: '#00bfff' },
	'JR-East.SaikyoKawagoe': { name: 'JR埼京・川越線', color: '#00ac9a' },
	'JR-East.Tokaido': { name: 'JR東海道線', color: '#ff7f00' },
	'JR-East.Musashino': { name: 'JR武蔵野線', color: '#ff6600' },
	'JR-East.Keiyo': { name: 'JR京葉線', color: '#c9252f' },
	'JR-East.JobanRapid': { name: 'JR常磐線快速', color: '#00b2e5' },
	'Toei.Asakusa': { name: '都営浅草線', color: '#e85298' },
	'Toei.Mita': { name: '都営三田線', color: '#0079c2' },
	'Toei.Shinjuku': { name: '都営新宿線', color: '#6cbb5a' },
	'Toei.Oedo': { name: '都営大江戸線', color: '#b6007a' },
	'TokyoMetro.Ginza': { name: '東京メトロ銀座線', color: '#ff9500' },
	'TokyoMetro.Marunouchi': { name: '東京メトロ丸ノ内線', color: '#f62e36' },
	'TokyoMetro.Hibiya': { name: '東京メトロ日比谷線', color: '#b5b5ac' },
	'TokyoMetro.Tozai': { name: '東京メトロ東西線', color: '#009bbf' },
	'TokyoMetro.Chiyoda': { name: '東京メトロ千代田線', color: '#00a650' },
	'TokyoMetro.Yurakucho': { name: '東京メトロ有楽町線', color: '#c1a470' },
	'TokyoMetro.Hanzomon': { name: '東京メトロ半蔵門線', color: '#8f76d6' },
	'TokyoMetro.Namboku': { name: '東京メトロ南北線', color: '#00ac9b' },
	'TokyoMetro.Fukutoshin': { name: '東京メトロ副都心線', color: '#9c5e31' },
};

async function fetchData(railwayId: string) {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

	try {
		const [stationRes, trainRes] = await Promise.all([
			fetch(`${baseUrl}/api/odpt?type=stations&railway=${railwayId}`, { cache: 'no-store' }),
			fetch(`${baseUrl}/api/odpt?type=trains&railway=${railwayId}`, { cache: 'no-store' }),
		]);

		const stations = await stationRes.json();
		const trains = await trainRes.json();

		return {
			stations: Array.isArray(stations) ? stations : [],
			trains: Array.isArray(trains) ? trains : [],
		};
	} catch (e) {
		console.error('Failed to fetch data for render:', e);
		return { stations: [], trains: [] };
	}
}

export default async function RenderPage({ params }: RenderPageProps) {
	const { railway } = await params;
	const railwayId = `odpt.Railway:${railway}`;
	const railwayInfo = RAILWAY_INFO[railway] || { name: railway, color: '#3b82f6' };

	const { stations, trains } = await fetchData(railwayId);
	const updatedAt = new Date().toLocaleTimeString('ja-JP');

	return (
		<div className="min-h-screen bg-slate-950 p-4">
			<RailwayLine
				railwayId={railwayId}
				railwayTitle={railwayInfo.name}
				stations={stations as OdptStation[]}
				trains={trains as OdptTrain[]}
				updatedAt={updatedAt}
				isRealtime={trains.length > 0}
				lineColor={railwayInfo.color}
				width={1920}
				height={1080}
				maxStationsPerRow={25}
			/>
		</div>
	);
}
