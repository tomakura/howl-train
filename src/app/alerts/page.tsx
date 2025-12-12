"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { OperationInfo } from '@/components/OperationAlert';

const ROTATE_INTERVAL_MS = 10_000;

const RAILWAY_GROUPS = [
	{
		operatorLabel: 'JR東日本',
		railways: [
			{ id: 'odpt.Railway:JR-East.ChuoRapid', name: '中央線（快速・各停）' },
			{ id: 'odpt.Railway:JR-East.Yamanote', name: '山手線' },
			{ id: 'odpt.Railway:JR-East.KeihinTohoku', name: '京浜東北線' },
			{ id: 'odpt.Railway:JR-East.SaikyoKawagoe', name: '埼京・川越線' },
			{ id: 'odpt.Railway:JR-East.Tokaido', name: '東海道線' },
			{ id: 'odpt.Railway:JR-East.Musashino', name: '武蔵野線' },
			{ id: 'odpt.Railway:JR-East.Keiyo', name: '京葉線' },
			{ id: 'odpt.Railway:JR-East.JobanRapid', name: '常磐線（快速・各停）' },
		],
	},
	{
		operatorLabel: '都営地下鉄',
		railways: [
			{ id: 'odpt.Railway:Toei.Asakusa', name: '浅草線' },
			{ id: 'odpt.Railway:Toei.Mita', name: '三田線' },
			{ id: 'odpt.Railway:Toei.Shinjuku', name: '新宿線' },
			{ id: 'odpt.Railway:Toei.Oedo', name: '大江戸線' },
		],
	},
	{
		operatorLabel: '東京メトロ',
		railways: [
			{ id: 'odpt.Railway:TokyoMetro.Ginza', name: '銀座線' },
			{ id: 'odpt.Railway:TokyoMetro.Marunouchi', name: '丸ノ内線' },
			{ id: 'odpt.Railway:TokyoMetro.Hibiya', name: '日比谷線' },
			{ id: 'odpt.Railway:TokyoMetro.Tozai', name: '東西線' },
			{ id: 'odpt.Railway:TokyoMetro.Chiyoda', name: '千代田線' },
			{ id: 'odpt.Railway:TokyoMetro.Yurakucho', name: '有楽町線' },
			{ id: 'odpt.Railway:TokyoMetro.Hanzomon', name: '半蔵門線' },
			{ id: 'odpt.Railway:TokyoMetro.Namboku', name: '南北線' },
			{ id: 'odpt.Railway:TokyoMetro.Fukutoshin', name: '副都心線' },
		],
	},
	{
		operatorLabel: '東武鉄道',
		railways: [
			{ id: 'odpt.Railway:Tobu.TobuSkytree', name: 'スカイツリーライン' },
			{ id: 'odpt.Railway:Tobu.Isesaki', name: '伊勢崎線' },
			{ id: 'odpt.Railway:Tobu.Nikko', name: '日光線' },
			{ id: 'odpt.Railway:Tobu.Tojo', name: '東上線' },
		],
	},
	{
		operatorLabel: '西武鉄道',
		railways: [
			{ id: 'odpt.Railway:Seibu.Ikebukuro', name: '池袋線' },
			{ id: 'odpt.Railway:Seibu.Shinjuku', name: '新宿線' },
		],
	},
	{
		operatorLabel: '京王電鉄',
		railways: [
			{ id: 'odpt.Railway:Keio.Keio', name: '京王線' },
			{ id: 'odpt.Railway:Keio.Inokashira', name: '井の頭線' },
		],
	},
	{
		operatorLabel: '小田急電鉄',
		railways: [{ id: 'odpt.Railway:Odakyu.Odawara', name: '小田原線' }],
	},
	{
		operatorLabel: '東急電鉄',
		railways: [
			{ id: 'odpt.Railway:Tokyu.Toyoko', name: '東横線' },
			{ id: 'odpt.Railway:Tokyu.DenEnToshi', name: '田園都市線' },
			{ id: 'odpt.Railway:Tokyu.Meguro', name: '目黒線' },
		],
	},
	{
		operatorLabel: '京急電鉄',
		railways: [
			{ id: 'odpt.Railway:Keikyu.Main', name: '本線' },
			{ id: 'odpt.Railway:Keikyu.Airport', name: '空港線' },
			{ id: 'odpt.Railway:Keikyu.Kurihama', name: '久里浜線' },
		],
	},
	{
		operatorLabel: '京成電鉄',
		railways: [
			{ id: 'odpt.Railway:Keisei.Main', name: '本線' },
			{ id: 'odpt.Railway:Keisei.Oshiage', name: '押上線' },
			{ id: 'odpt.Railway:Keisei.NaritaSkyAccess', name: '成田スカイアクセス' },
		],
	},
	{
		operatorLabel: '横浜市営地下鉄',
		railways: [
			{ id: 'odpt.Railway:YokohamaMunicipal.Blue', name: 'ブルーライン' },
			{ id: 'odpt.Railway:YokohamaMunicipal.Green', name: 'グリーンライン' },
		],
	},
] as const;

const getOperatorIdFromRailway = (railwayId: string): string | null => {
	const match = railwayId.match(/^odpt\.Railway:([^.]+)/);
	return match ? `odpt.Operator:${match[1]}` : null;
};

const STATUS_LABEL: Record<OperationInfo['status'], string> = {
	normal: '平常運転',
	delay: '遅延',
	suspend: '運転見合わせ',
	direct: '直通運転情報',
	other: '運行情報',
};

const STATUS_BADGE: Record<OperationInfo['status'], string> = {
	normal: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
	delay: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
	suspend: 'bg-red-500/15 text-red-300 border-red-500/40',
	direct: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
	other: 'bg-slate-500/15 text-slate-200 border-slate-500/40',
};

type StationLite = {
	'owl:sameAs': string;
	'dc:title': string;
	'odpt:stationTitle'?: { ja?: string };
};

function escapeRegExp(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightStations(text: string, stations: StationLite[]): Array<{ text: string; highlighted: boolean }> {
	const names = stations
		.map(s => s['odpt:stationTitle']?.ja || s['dc:title'])
		.filter((x): x is string => typeof x === 'string' && x.length >= 2)
		// avoid too many tokens, and avoid single-character false positives
		.slice(0, 120);

	if (!text || names.length === 0) return [{ text, highlighted: false }];

	// Longest-first helps avoid partial overlaps
	const seen: Record<string, true> = {};
	const unique: string[] = [];
	for (const name of names) {
		if (seen[name]) continue;
		seen[name] = true;
		unique.push(name);
	}
	const sorted = unique.sort((a, b) => b.length - a.length);
	const pattern = sorted.map(escapeRegExp).join('|');
	if (!pattern) return [{ text, highlighted: false }];

	const re = new RegExp(`(${pattern})`, 'g');
	const parts = text.split(re);
	return parts
		.filter(p => p.length > 0)
		.map(p => ({ text: p, highlighted: sorted.includes(p) }));
}

export default function AlertsPage() {
	const [operatorIndex, setOperatorIndex] = useState(0);
	const [selectedRailwayIndex, setSelectedRailwayIndex] = useState(0);
	const [operatorInfo, setOperatorInfo] = useState<Record<string, OperationInfo[]>>({});
	const [stationsByRailway, setStationsByRailway] = useState<Record<string, StationLite[]>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [animateKey, setAnimateKey] = useState(0);

	const operator = RAILWAY_GROUPS[operatorIndex];
	const selectedRailway = operator?.railways[selectedRailwayIndex];
	const operatorId = selectedRailway ? getOperatorIdFromRailway(selectedRailway.id) : null;

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			setLoading(true);
			setError(null);

			try {
				const results = await Promise.all(
					RAILWAY_GROUPS.map(async (g) => {
						const firstRailwayId = g.railways[0]?.id;
						const operatorId = firstRailwayId ? getOperatorIdFromRailway(firstRailwayId) : null;
						if (!operatorId) return { operatorId: '', info: [] as OperationInfo[] };

						const res = await fetch(`/api/odpt?type=info&operator=${operatorId}`);
						const data = await res.json();
						if (!res.ok || !Array.isArray(data)) return { operatorId, info: [] as OperationInfo[] };

						// Keep only the fields we use; normalize to OperationInfo shape
						const normalized = (data as unknown[])
							.map((raw: unknown): OperationInfo | null => {
								if (!raw || typeof raw !== 'object') return null;
								const r = raw as Record<string, unknown>;

								const railway = typeof r['odpt:railway'] === 'string' ? (r['odpt:railway'] as string) : '';
								const statusText = typeof r['odpt:trainInformationStatus'] === 'string'
									? (r['odpt:trainInformationStatus'] as string)
									: '';
								const textField = r['odpt:trainInformationText'];
								const textJa =
									typeof (textField as { ja?: unknown } | undefined)?.ja === 'string'
										? ((textField as { ja?: string }).ja as string)
									: typeof textField === 'string'
										? textField
										: '';
								const causeField = r['odpt:trainInformationCause'];
								const causeJa =
									typeof (causeField as { ja?: unknown } | undefined)?.ja === 'string'
										? ((causeField as { ja?: string }).ja as string)
									: '';

								const status: OperationInfo['status'] = statusText.includes('運転見合わせ')
									? 'suspend'
									: statusText.includes('遅延')
										? 'delay'
										: statusText.includes('平常')
											? 'normal'
											: 'other';

								const railwayTitleField = r['odpt:railwayTitle'];
								const railwayTitleJa =
									typeof (railwayTitleField as { ja?: unknown } | undefined)?.ja === 'string'
										? ((railwayTitleField as { ja?: string }).ja as string)
									: undefined;

								if (!textJa && status === 'normal') return null;

								return {
									railway,
									railwayTitle: railwayTitleJa,
									status,
									text: textJa,
									cause: causeJa,
								};
							})
							.filter((x): x is OperationInfo => x !== null);

						return { operatorId, info: normalized };
					})
				);

				if (cancelled) return;
				const map: Record<string, OperationInfo[]> = {};
				for (const r of results) {
					if (!r.operatorId) continue;
					map[r.operatorId] = r.info;
				}
				setOperatorInfo(map);
			} catch (e) {
				if (cancelled) return;
				console.error(e);
				setError('運行情報の取得に失敗しました');
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		run();
		return () => {
			cancelled = true;
		};
	}, []);

	// Auto-rotate selected railway every 10s
	useEffect(() => {
		if (!operator) return;
		const id = setInterval(() => {
			setSelectedRailwayIndex((prev) => {
				const next = (prev + 1) % operator.railways.length;
				return next;
			});
		}, ROTATE_INTERVAL_MS);
		return () => clearInterval(id);
	}, [operator]);

	// Animate detail changes
	useEffect(() => {
		setAnimateKey((k) => k + 1);
	}, [operatorIndex, selectedRailwayIndex]);

	// When operator changes, reset selection
	useEffect(() => {
		setSelectedRailwayIndex(0);
	}, [operatorIndex]);

	// Fetch stations for highlighting (only for current railway)
	useEffect(() => {
		const railwayId = selectedRailway?.id;
		if (!railwayId) return;
		if (stationsByRailway[railwayId]) return;

		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`/api/odpt?type=stations&railway=${railwayId}`);
				const data = await res.json();
				if (!res.ok || !Array.isArray(data)) return;
				if (cancelled) return;
				setStationsByRailway((prev) => ({ ...prev, [railwayId]: data as StationLite[] }));
			} catch {
				// ignore
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [selectedRailway?.id, stationsByRailway]);

	const railwayInfoList = useMemo(() => {
		if (!operatorId) return [];
		const all = operatorInfo[operatorId] || [];

		// Map railwayId -> info (prefer the one with matching railway)
		const byRailway = new Map<string, OperationInfo>();
		for (const i of all) {
			if (!i.railway) continue;
			if (!byRailway.has(i.railway)) byRailway.set(i.railway, i);
		}

		return operator.railways.map((r) => {
			const info = byRailway.get(r.id);
			return {
				railwayId: r.id,
				name: r.name,
				info,
			};
		});
	}, [operator, operatorId, operatorInfo]);

	const selectedInfo = useMemo(() => {
		if (!selectedRailway) return null;
		return railwayInfoList.find(x => x.railwayId === selectedRailway.id)?.info || null;
	}, [railwayInfoList, selectedRailway]);

	const highlightParts = useMemo(() => {
		if (!selectedRailway || !selectedInfo?.text) return null;
		const stations = stationsByRailway[selectedRailway.id] || [];
		return highlightStations(selectedInfo.text, stations);
	}, [selectedRailway, selectedInfo?.text, stationsByRailway]);

	return (
		<main className="min-h-screen bg-slate-950 text-white flex flex-col">
			<header className="sticky top-0 z-50 backdrop-blur bg-slate-950/80 border-b border-slate-800">
				<div className="max-w-[1920px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-100">運行情報（会社別）</h1>
						<Link href="/" className="text-sm text-slate-300 hover:text-white underline underline-offset-4">列車位置へ</Link>
					</div>

					<div className="text-xs text-slate-400">自動遷移: {ROTATE_INTERVAL_MS / 1000}s</div>
				</div>
			</header>

			<div className="max-w-[1920px] mx-auto px-6 py-4 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-4">
				<section className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden">
					<div className="p-3 border-b border-slate-800 text-sm font-semibold text-slate-200">会社</div>
					<div className="p-2 space-y-1 max-h-[70vh] overflow-auto">
						{RAILWAY_GROUPS.map((g, idx) => (
							<button
								key={g.operatorLabel}
								onClick={() => setOperatorIndex(idx)}
								className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
									idx === operatorIndex
										? 'bg-slate-900 border-slate-700 text-white'
										: 'bg-transparent border-transparent text-slate-300 hover:bg-slate-900/60 hover:border-slate-800'
								}`}
							>
								{g.operatorLabel}
							</button>
						))}
					</div>
				</section>

				<section className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden flex flex-col min-h-0">
					<div className="p-3 border-b border-slate-800 flex items-center justify-between gap-3">
						<div className="text-sm font-semibold text-slate-200">{operator.operatorLabel}</div>
						{error && <div className="text-xs text-red-300">{error}</div>}
						{loading && <div className="text-xs text-slate-400">読み込み中...</div>}
					</div>

					<div className="grid grid-cols-1 xl:grid-cols-[420px,1fr] flex-1 min-h-0">
						<div className="border-r border-slate-800 overflow-auto">
							{railwayInfoList.map((r, idx) => {
								const status: OperationInfo['status'] = r.info?.status ?? 'normal';
								const label = STATUS_LABEL[status];
								const badge = STATUS_BADGE[status];

								return (
									<button
										key={r.railwayId}
										onClick={() => setSelectedRailwayIndex(idx)}
										className={`w-full text-left px-4 py-3 border-b border-slate-900 hover:bg-slate-900/60 transition-colors ${
											idx === selectedRailwayIndex ? 'bg-slate-900/80' : ''
										}`}
									>
										<div className="flex items-center justify-between gap-3">
											<div className="text-sm font-semibold text-slate-100">{r.name}</div>
											<span className={`text-[11px] px-2 py-0.5 rounded border ${badge}`}>{label}</span>
										</div>
										{r.info?.text ? (
											<div className="mt-1 text-xs text-slate-300 line-clamp-2">{r.info.text}</div>
										) : (
											<div className="mt-1 text-xs text-slate-500">情報なし（または平常運転）</div>
										)}
									</button>
								);
							})}
						</div>

						<div className="p-4 overflow-auto">
							<div key={animateKey} className="transition-opacity duration-200 motion-safe:animate-fade-in">
								<div className="flex items-center justify-between gap-3">
									<div className="text-lg font-bold text-white">
										{selectedRailway?.name ?? ''}
									</div>
									{selectedInfo && (
										<span className={`text-xs px-2 py-1 rounded border ${STATUS_BADGE[selectedInfo.status]}`}>
											{STATUS_LABEL[selectedInfo.status]}
										</span>
									)}
								</div>

								{selectedInfo?.text ? (
									<p className="mt-3 text-sm text-slate-200 leading-relaxed break-words">
										{highlightParts
											? highlightParts.map((p, i) =>
												p.highlighted ? (
													<span key={i} className="px-1 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
														{p.text}
													</span>
												) : (
													<span key={i}>{p.text}</span>
												)
											)
											: selectedInfo.text}
									</p>
								) : (
									<p className="mt-3 text-sm text-slate-500">この路線は現在、明示的な運行情報がありません。</p>
								)}

								{selectedInfo?.cause && (
									<p className="mt-3 text-xs text-slate-400">原因: {selectedInfo.cause}</p>
								)}
							</div>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
