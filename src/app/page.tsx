"use client";

import { useEffect, useState, useCallback } from 'react';
import type { OdptTrain, OdptStation } from '@/types/odpt';
import RailwayLine from '@/components/RailwayLine';
import OperationAlert, { type OperationInfo } from '@/components/OperationAlert';
import { Clock, RefreshCw } from 'lucide-react';

// Available Railways grouped by operator
const RAILWAY_GROUPS = [
	{
		operator: 'JR東日本',
		color: '#008000',
		railways: [
			{ id: 'odpt.Railway:JR-East.ChuoRapid', name: '中央線（快速・各停）', color: '#ff6600' },
			{ id: 'odpt.Railway:JR-East.Yamanote', name: '山手線', color: '#9acd32' },
			{ id: 'odpt.Railway:JR-East.KeihinTohoku', name: '京浜東北線', color: '#00bfff' },
			{ id: 'odpt.Railway:JR-East.SaikyoKawagoe', name: '埼京・川越線', color: '#00ac9a' },
			{ id: 'odpt.Railway:JR-East.Tokaido', name: '東海道線', color: '#ff7f00' },
			{ id: 'odpt.Railway:JR-East.Musashino', name: '武蔵野線', color: '#ff6600' },
			{ id: 'odpt.Railway:JR-East.Keiyo', name: '京葉線', color: '#c9252f' },
			{ id: 'odpt.Railway:JR-East.JobanRapid', name: '常磐線（快速・各停）', color: '#00b2e5' },
		],
	},
	{
		operator: '都営地下鉄',
		color: '#00a650',
		railways: [
			{ id: 'odpt.Railway:Toei.Asakusa', name: '浅草線', color: '#e85298' },
			{ id: 'odpt.Railway:Toei.Mita', name: '三田線', color: '#0079c2' },
			{ id: 'odpt.Railway:Toei.Shinjuku', name: '新宿線', color: '#6cbb5a' },
			{ id: 'odpt.Railway:Toei.Oedo', name: '大江戸線', color: '#b6007a' },
		],
	},
	{
		operator: '東京メトロ',
		color: '#0033cc',
		railways: [
			{ id: 'odpt.Railway:TokyoMetro.Ginza', name: '銀座線', color: '#ff9500' },
			{ id: 'odpt.Railway:TokyoMetro.Marunouchi', name: '丸ノ内線', color: '#f62e36' },
			{ id: 'odpt.Railway:TokyoMetro.Hibiya', name: '日比谷線', color: '#b5b5ac' },
			{ id: 'odpt.Railway:TokyoMetro.Tozai', name: '東西線', color: '#009bbf' },
			{ id: 'odpt.Railway:TokyoMetro.Chiyoda', name: '千代田線', color: '#00a650' },
			{ id: 'odpt.Railway:TokyoMetro.Yurakucho', name: '有楽町線', color: '#c1a470' },
			{ id: 'odpt.Railway:TokyoMetro.Hanzomon', name: '半蔵門線', color: '#8f76d6' },
			{ id: 'odpt.Railway:TokyoMetro.Namboku', name: '南北線', color: '#00ac9b' },
			{ id: 'odpt.Railway:TokyoMetro.Fukutoshin', name: '副都心線', color: '#9c5e31' },
		],
	},
	{
		operator: '東武鉄道',
		color: '#0079c2',
		railways: [
			{ id: 'odpt.Railway:Tobu.TobuSkytree', name: 'スカイツリーライン', color: '#0079c2' },
			{ id: 'odpt.Railway:Tobu.Isesaki', name: '伊勢崎線', color: '#0079c2' },
			{ id: 'odpt.Railway:Tobu.Nikko', name: '日光線', color: '#ed7d22' },
			{ id: 'odpt.Railway:Tobu.Tojo', name: '東上線', color: '#0079c2' },
		],
	},
	{
		operator: '西武鉄道',
		color: '#0070af',
		railways: [
			{ id: 'odpt.Railway:Seibu.Ikebukuro', name: '池袋線', color: '#0070af' },
			{ id: 'odpt.Railway:Seibu.Shinjuku', name: '新宿線', color: '#0070af' },
		],
	},
	{
		operator: '京王電鉄',
		color: '#de1d65',
		railways: [
			{ id: 'odpt.Railway:Keio.Keio', name: '京王線', color: '#de1d65' },
			{ id: 'odpt.Railway:Keio.Inokashira', name: '井の頭線', color: '#00a495' },
		],
	},
	{
		operator: '小田急電鉄',
		color: '#0074bf',
		railways: [
			{ id: 'odpt.Railway:Odakyu.Odawara', name: '小田原線', color: '#0074bf' },
		],
	},
	{
		operator: '東急電鉄',
		color: '#dd0000',
		railways: [
			{ id: 'odpt.Railway:Tokyu.Toyoko', name: '東横線', color: '#dd0000' },
			{ id: 'odpt.Railway:Tokyu.DenEnToshi', name: '田園都市線', color: '#00a040' },
			{ id: 'odpt.Railway:Tokyu.Meguro', name: '目黒線', color: '#009bbf' },
		],
	},
	{
		operator: '京急電鉄',
		color: '#e60012',
		railways: [
			{ id: 'odpt.Railway:Keikyu.Main', name: '本線', color: '#e60012' },
			{ id: 'odpt.Railway:Keikyu.Airport', name: '空港線', color: '#e60012' },
			{ id: 'odpt.Railway:Keikyu.Kurihama', name: '久里浜線', color: '#e60012' },
		],
	},
	{
		operator: '京成電鉄',
		color: '#0033cc',
		railways: [
			{ id: 'odpt.Railway:Keisei.Main', name: '本線', color: '#0033cc' },
			{ id: 'odpt.Railway:Keisei.Oshiage', name: '押上線', color: '#0033cc' },
			{ id: 'odpt.Railway:Keisei.Narita', name: '成田スカイアクセス', color: '#ff6600' },
		],
	},
	{
		operator: '横浜市営地下鉄',
		color: '#0079c2',
		railways: [
			{ id: 'odpt.Railway:YokohamaMunicipal.Blue', name: 'ブルーライン', color: '#0079c2' },
			{ id: 'odpt.Railway:YokohamaMunicipal.Green', name: 'グリーンライン', color: '#6cbb5a' },
		],
	},
];

// Flat list for easy lookup
const ALL_RAILWAYS = RAILWAY_GROUPS.flatMap(g =>
	g.railways.map(r => ({ ...r, operator: g.operator, operatorColor: g.color }))
);

export default function Home() {
	const [selectedRailway, setSelectedRailway] = useState(ALL_RAILWAYS[0].id);
	const [stations, setStations] = useState<OdptStation[]>([]);
	const [trains, setTrains] = useState<OdptTrain[]>([]);
	const [operationInfo, setOperationInfo] = useState<OperationInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [updatedAt, setUpdatedAt] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const [autoRefresh, setAutoRefresh] = useState(true);

	const selectedRailwayInfo = ALL_RAILWAYS.find(r => r.id === selectedRailway);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			// Get operator from railway ID for info fetch
			const operatorMatch = selectedRailway.match(/odpt\.Railway:([^.]+)/);
			const operatorId = operatorMatch ? `odpt.Operator:${operatorMatch[1]}` : null;

			// Fetch stations, trains, and operation info
			const [stationRes, trainRes, infoRes] = await Promise.all([
				fetch(`/api/odpt?type=stations&railway=${selectedRailway}`),
				fetch(`/api/odpt?type=trains&railway=${selectedRailway}`),
				operatorId ? fetch(`/api/odpt?type=info&operator=${operatorId}`) : Promise.resolve(null),
			]);

			const sData = await stationRes.json();
			const tData = await trainRes.json();
			const iData = infoRes ? await infoRes.json() : [];

			if (Array.isArray(sData)) {
				setStations(sData);
			} else {
				console.error("Failed to load stations:", sData);
				setError('駅データの取得に失敗しました');
			}

			if (Array.isArray(tData)) {
				setTrains(tData);
			} else {
				console.error("Failed to load trains:", tData);
				// Don't set error for trains - might not have realtime data
			}

			// Process operation info
			if (Array.isArray(iData)) {
				const processed: OperationInfo[] = iData
					.filter((info: any) => info['odpt:railway'] === selectedRailway || !info['odpt:railway'])
					.map((info: any) => ({
						railway: info['odpt:railway'] || '',
						railwayTitle: info['odpt:railwayTitle']?.ja || info['odpt:railway']?.split(':').pop() || '',
						status: info['odpt:trainInformationStatus']?.includes('運転見合わせ') ? 'suspend' :
							info['odpt:trainInformationStatus']?.includes('遅延') ? 'delay' :
								info['odpt:trainInformationStatus']?.includes('平常') ? 'normal' : 'other',
						text: info['odpt:trainInformationText']?.ja || info['odpt:trainInformationText'] || '',
						cause: info['odpt:trainInformationCause']?.ja || '',
					}));
				setOperationInfo(processed);
			}

			setUpdatedAt(new Date().toLocaleTimeString('ja-JP'));
		} catch (e) {
			console.error(e);
			setError('データの取得中にエラーが発生しました');
		} finally {
			setLoading(false);
		}
	}, [selectedRailway]);

	// Initial fetch and auto-refresh
	useEffect(() => {
		fetchData();

		let interval: NodeJS.Timeout | null = null;
		if (autoRefresh) {
			interval = setInterval(fetchData, 60000); // 1 minute
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [fetchData, autoRefresh]);

	return (
		<main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
			{/* Header */}
			<header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-slate-800">
				<div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between">
					<h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
						ODPT リアルタイム列車モニター
					</h1>

					<div className="flex items-center gap-4">
						{/* Railway Selector */}
						<select
							value={selectedRailway}
							onChange={(e) => setSelectedRailway(e.target.value)}
							className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
							aria-label="路線を選択"
						>
							{RAILWAY_GROUPS.map(group => (
								<optgroup key={group.operator} label={group.operator}>
									{group.railways.map(r => (
										<option key={r.id} value={r.id}>{r.name}</option>
									))}
								</optgroup>
							))}
						</select>

						{/* Auto-refresh toggle */}
						<button
							onClick={() => setAutoRefresh(!autoRefresh)}
							className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${autoRefresh
								? 'bg-green-500/20 border-green-500 text-green-400'
								: 'bg-slate-800 border-slate-700 text-slate-400'
								}`}
							aria-pressed={autoRefresh}
						>
							<RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
							<span className="text-sm">自動更新</span>
						</button>

						{/* Manual refresh */}
						<button
							onClick={fetchData}
							disabled={loading}
							className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
							<span className="text-sm">更新</span>
						</button>

						{/* Last updated */}
						{updatedAt && (
							<div className="flex items-center gap-2 text-sm text-slate-400">
								<Clock className="h-4 w-4" />
								<span>{updatedAt}</span>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className="max-w-[1920px] mx-auto px-6 py-6">
				{/* Operation Alerts */}
				<OperationAlert info={operationInfo} />

				{/* Error display */}
				{error && (
					<div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
						{error}
					</div>
				)}

				{/* Loading state */}
				{loading && stations.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-[600px] gap-4">
						<div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
						<p className="text-slate-400">データを読み込み中...</p>
					</div>
				) : (
					/* Railway Line Visualization */
					<RailwayLine
						railwayId={selectedRailway}
						railwayTitle={selectedRailwayInfo?.name || ''}
						stations={stations}
						trains={trains}
						updatedAt={updatedAt}
						isRealtime={trains.length > 0}
						lineColor={selectedRailwayInfo?.color || '#3b82f6'}
						width={1920}
						height={1080}
						maxStationsPerRow={10}
					/>
				)}
			</div>

			{/* Footer */}
			<footer className="border-t border-slate-800 mt-8">
				<div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-500">
					<p>
						Data provided by <a href="https://www.odpt.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ODPT (Open Data for Public Transportation)</a>
					</p>
					<p>
						{trains.length > 0 ? (
							<span className="text-green-400">● リアルタイムデータ</span>
						) : (
							<span className="text-yellow-400">● 時刻表ベースデータ</span>
						)}
					</p>
				</div>
			</footer>
		</main>
	);
}
