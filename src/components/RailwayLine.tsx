"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import type { OdptTrain, OdptStation } from '@/types/odpt';
import { getTrainTypePriority } from '@/utils/trainPosition';

interface RailwayLineProps {
	railwayId: string;
	railwayTitle: string;
	stations: OdptStation[];
	trains: OdptTrain[];
	updatedAt: string;
	isRealtime?: boolean;
	lineColor?: string;
	width?: number;
	height?: number;
	maxStationsPerRow?: number; // デフォルト10駅/行
}

// Train type colors and Japanese names
const TRAIN_TYPES: Record<string, { color: string; name: string }> = {
	LimitedExpress: { color: '#dc2626', name: '特急' },
	Express: { color: '#ea580c', name: '急行' },
	RapidExpress: { color: '#d97706', name: '快速急行' },
	CommuterRapidExpress: { color: '#ca8a04', name: '通勤快急' },
	Rapid: { color: '#16a34a', name: '快速' },
	CommuterRapid: { color: '#15803d', name: '通勤快速' },
	SemiExpress: { color: '#2563eb', name: '準急' },
	Local: { color: '#475569', name: '普通' },
	default: { color: '#64748b', name: '' },
};

// 駅名日本語マッピング（APIにない場合のフォールバック）
const STATION_NAME_MAP: Record<string, string> = {
	// JR East
	'Tokyo': '東京', 'Shinjuku': '新宿', 'Shibuya': '渋谷', 'Ikebukuro': '池袋',
	'Ueno': '上野', 'Akihabara': '秋葉原', 'Yokohama': '横浜', 'Kawasaki': '川崎',
	'Omiya': '大宮', 'Chiba': '千葉', 'Takao': '高尾', 'Mitaka': '三鷹',
	'Nakano': '中野', 'Nishi-Funabashi': '西船橋', 'Tsudanuma': '津田沼',
	'Ome': '青梅', 'Hachioji': '八王子', 'Tachikawa': '立川', 'Kokubunji': '国分寺',
	'Musashi-Koganei': '武蔵小金井', 'Koenji': '高円寺', 'Ogikubo': '荻窪',
	'Kichijoji': '吉祥寺', 'Asagaya': '阿佐ヶ谷', 'Nishi-Ogikubo': '西荻窪',
	'Ochanomizu': '御茶ノ水', 'Yotsuya': '四ツ谷', 'Kanda': '神田',
	'Funabashi': '船橋', 'Kashiwa': '柏', 'Matsudo': '松戸', 'Nishi-Kokubunji': '西国分寺',

	// Toei Asakusa Line
	'Nishi-Magome': '西馬込', 'Asakusa': '浅草', 'Oshiage': '押上',
	'Gotanda': '五反田', 'Togoshi': '戸越', 'Nakanobu': '中延', 'Magome': '馬込',
	'Sengakuji': '泉岳寺', 'Mita': '三田', 'Daimon': '大門', 'Higashi-Ginza': '東銀座',
	'Nihombashi': '日本橋', 'Asakusabashi': '浅草橋', 'Kuramae': '蔵前',

	// Toei Mita Line
	'Meguro': '目黒', 'Nishi-Takashimadaira': '西高島平', 'Takashimadaira': '高島平',
	'Shin-Itabashi': '新板橋', 'Sugamo': '巣鴨', 'Hakusan': '白山', 'Jimbocho': '神保町',

	// Toei Shinjuku Line
	'Motoyawata': '本八幡', 'Funabori': '船堀', 'Ojima': '大島',
	'Shinjuku-Sanchome': '新宿三丁目', 'Iwamotocho': '岩本町', 'Bakurocho': '馬喰町',

	// Toei Oedo Line
	'Tochomae': '都庁前', 'Hikarigaoka': '光が丘', 'Nerima': '練馬',
	'Shin-Egota': '新江古田', 'Ochiai-Minami-Nagasaki': '落合南長崎',
	'Nakai': '中井', 'Higashi-Nakano': '東中野', 'Nakano-Sakaue': '中野坂上',
	'Nishi-Shinjuku-Gochome': '西新宿五丁目', 'Toei-Shinjuku': '都営新宿',
	'Kokuritsu-Kyogijo': '国立競技場', 'Aoyama-Itchome': '青山一丁目',
	'Roppongi': '六本木', 'Azabu-Juban': '麻布十番', 'Shiodome': '汐留',
	'Tsukishima': '月島', 'Monzen-Nakacho': '門前仲町', 'Ryogoku': '両国',
	'Morishita': '森下', 'Kiyosumi-Shirakawa': '清澄白河', 'Ueno-Okachimachi': '上野御徒町',

	// Tokyo Metro
	'Ogikubo.1': '荻窪', 'Honancho': '方南町', 'Nakameguro': '中目黒',
	'Kita-Senju': '北千住', 'Naka-Meguro': '中目黒', 'Wakoshi': '和光市',
	'Shibuya.1': '渋谷', 'Ikebukuro.1': '池袋', 'Shinagawa': '品川',
	'Ayase': '綾瀬', 'Kanamecho': '要町', 'Kotake-Mukaihara': '小竹向原',

	// Tobu  
	'Tobu-Dobutsukoen': '東武動物公園', 'Kasukabe': '春日部', 'Koshigaya': '越谷',
	'Kuki': '久喜', 'Minami-Kurihashi': '南栗橋', 'Tobu-Nikko': '東武日光',
	'Asakusa.1': '浅草', 'Ikebukuro.2': '池袋', 'Ogawamachi': '小川町',
	'Shiki': '志木', 'Kawagoe': '川越', 'Kawagoeshi': '川越市',

	// Seibu
	'Hanno': '飯能', 'Tokorozawa': '所沢', 'Kodaira': '小平',
	'Hon-Kawagoe': '本川越', 'Seibu-Shinjuku': '西武新宿',
	'Hibarigaoka': 'ひばりヶ丘', 'Shakujii-Koen': '石神井公園',

	// Keio
	'Keio-Hachioji': '京王八王子', 'Hashimoto': '橋本', 'Takahatafudo': '高幡不動',
	'Meidaimae': '明大前', 'Chofu': '調布', 'Kichijoji.1': '吉祥寺',
	'Keio-Tama-Center': '京王多摩センター', 'Sasazuka': '笹塚',

	// Odakyu
	'Odawara': '小田原', 'Fujisawa': '藤沢', 'Machida': '町田',
	'Sagami-Ono': '相模大野', 'Yoyogi-Uehara': '代々木上原',
	'Shin-Yurigaoka': '新百合ヶ丘', 'Noborito': '登戸', 'Karakida': '唐木田',

	// Tokyu
	'Motomachi-Chukagai': '元町・中華街', 'Musashi-Kosugi': '武蔵小杉',
	'Jiyugaoka': '自由が丘', 'Den-en-Chofu': '田園調布', 'Chuo-Rinkan': '中央林間',
	'Nagatsuta': '長津田', 'Futako-Tamagawa': '二子玉川', 'Hiyoshi': '日吉',
	'Kikuna': '菊名', 'Tamagawa': '多摩川', 'Oimachi': '大井町',

	// Keikyu
	'Uraga': '浦賀', 'Misakiguchi': '三崎口', 'Haneda-Airport': '羽田空港',
	'Keikyu-Kawasaki': '京急川崎', 'Yokosuka-Chuo': '横須賀中央',
	'HanedaAirportTerminal1and2': '羽田空港第1・第2ターミナル',
	'HanedaAirportTerminal1': '羽田空港第1ターミナル',
	'HanedaAirportTerminal2': '羽田空港第2ターミナル',
	'Haneda-Airport-Terminal-1-and-2': '羽田空港第1・第2ターミナル',
	'Haneda-Airport-Terminal-3': '羽田空港第3ターミナル',
	'Keikyu-Kamata': '京急蒲田', 'Shinagawa.1': '品川',

	// Keisei
	'Aoto': '青砥', 'Keisei-Takasago': '京成高砂', 'Keisei-Ueno': '京成上野',
	'Keisei-Funabashi': '京成船橋', 'Keisei-Tsudanuma': '京成津田沼',
	'KeiseiNarita': '京成成田', 'Keisei-Narita': '京成成田',
	'NaritaAirportTerminal1': '成田空港第1ターミナル',
	'NaritaAirportTerminal2and3': '成田空港第2・第3ターミナル',
	'Narita-Airport-Terminal-1': '成田空港第1ターミナル',
	'Narita-Airport': '成田空港', 'ImbaNihonIdai': '印旛日本医大',
	'Imba-Nihon-Idai': '印旛日本医大', 'Shin-Kamagaya': '新鎌ヶ谷',
	'Keisei-Sakura': '京成佐倉', 'Shibayama-Chiyoda': '芝山千代田',
	'Narita-Yukawa': '成田湯川', 'Nippori': '日暮里', 'Keisei-Sekiya': '京成関屋',
	'Shin-Shibamata': '新柴又', 'Yotsugi': '四ツ木', 'Keisei-Tateishi': '京成立石',

	// Hokuso Line
	'Inzai-Makinohara': '印西牧の原', 'Chiba-New-Town-Chuo': '千葉ニュータウン中央',

	// Saitama Railway
	'Urawa-Misono': '浦和美園',
};


// Get destination station name from ID - with Japanese lookup
const getDestinationName = (
	destId: string | string[] | undefined,
	stations: OdptStation[]
): string => {
	if (!destId) return '';
	const id = Array.isArray(destId) ? destId[0] : destId;

	// 駅リストから日本語名を検索
	const station = stations.find(s => s['owl:sameAs'] === id);
	if (station) {
		const jaName = station['odpt:stationTitle']?.ja;
		if (jaName && !/[a-zA-Z]/.test(jaName)) {
			return jaName;
		}
		// dc:titleも試す
		const dcTitle = station['dc:title'];
		if (dcTitle && !/[a-zA-Z]/.test(dcTitle)) {
			return dcTitle;
		}
	}

	// ID末尾を取得してマッピングを試行
	const parts = id.split('.');
	const stationKey = parts[parts.length - 1] || '';

	// マッピングから日本語名を取得
	if (STATION_NAME_MAP[stationKey]) {
		return STATION_NAME_MAP[stationKey];
	}

	// それでも見つからない場合は駅リストの日本語名を再チェック
	if (station) {
		return station['odpt:stationTitle']?.ja || station['dc:title'] || stationKey;
	}

	return stationKey;
};

// Get train type info
const getTrainTypeInfo = (trainType: string) => {
	const typeName = trainType?.split('.').pop() || 'default';
	return TRAIN_TYPES[typeName] || TRAIN_TYPES.default;
};

// 矢印枠コンポーネント（左右方向）
const ArrowBox = ({
	color,
	typeName,
	destination,
	delay,
	direction, // 'left' or 'right' (進行方向)
	icon
}: {
	color: string;
	typeName: string;
	destination: string;
	delay: number;
	direction: 'left' | 'right';
	icon?: string;
}) => {
	// 左向き矢印か右向き矢印か
	const arrowStyle = direction === 'left' ? {
		clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 15% 100%, 0 50%)'
	} : {
		clipPath: 'polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)'
	};

	return (
		<div className="relative flex items-center gap-1">
			{direction === 'left' && <span className="text-[10px] text-slate-400">◀</span>}
			<div
				className="relative px-2 py-1 text-white text-center shadow-lg min-w-[60px] rounded"
				style={{ backgroundColor: color }}
			>
				{icon && (
					<Image
						src={icon}
						alt=""
						width={16}
						height={16}
						className="absolute -top-2 -left-2 rounded"
					/>
				)}
				<div className="text-[8px] font-bold opacity-90">{typeName || '普通'}</div>
				<div className="text-[10px] font-bold whitespace-nowrap">{destination || '---'}</div>
				{delay > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] px-1 rounded-full font-bold">
						+{Math.round(delay / 60)}
					</span>
				)}
			</div>
			{direction === 'right' && <span className="text-[10px] text-slate-400">▶</span>}
		</div>
	);
};

export default function RailwayLine({
	railwayId,
	railwayTitle,
	stations,
	trains,
	updatedAt,
	isRealtime = true,
	lineColor = '#3b82f6',
	width = 1920,
	height = 1080,
	maxStationsPerRow = 10,
}: RailwayLineProps) {
	// 駅IDマップを作成
	const stationIdMap = useMemo(() => {
		const map = new Map<string, number>();
		stations.forEach((s, idx) => {
			map.set(s['owl:sameAs'], idx);
		});
		return map;
	}, [stations]);

	// 方向別に列車を分離
	const { inboundTrains, outboundTrains } = useMemo(() => {
		const inbound: OdptTrain[] = [];
		const outbound: OdptTrain[] = [];

		trains.forEach(train => {
			const direction = train['odpt:railDirection'] || '';
			if (direction.includes('Inbound') || direction.includes('Westbound') || direction.includes('Northbound')) {
				inbound.push(train);
			} else {
				outbound.push(train);
			}
		});

		return { inboundTrains: inbound, outboundTrains: outbound };
	}, [trains]);

	// Layout calculations
	const layout = useMemo(() => {
		const padding = { left: 80, right: 80, top: 100, bottom: 80 };
		const lineHeight = 8;
		const rowSpacing = 200;

		const numRows = Math.ceil(stations.length / maxStationsPerRow);
		const stationsPerRow = Math.ceil(stations.length / numRows);
		const availableWidth = width - padding.left - padding.right;

		// 駅位置を計算
		const stationPositions: { x: number; y: number; row: number; index: number }[] = [];

		stations.forEach((_, idx) => {
			const row = Math.floor(idx / stationsPerRow);
			const posInRow = idx % stationsPerRow;
			const stationsInThisRow = Math.min(stationsPerRow, stations.length - row * stationsPerRow);

			const x = padding.left + (stationsInThisRow > 1
				? (posInRow / (stationsInThisRow - 1)) * availableWidth
				: availableWidth / 2);
			const baseY = padding.top + row * rowSpacing;

			stationPositions.push({ x, y: baseY, row, index: idx });
		});

		const totalHeight = padding.top + (numRows - 1) * rowSpacing + 150 + padding.bottom;

		return {
			padding,
			lineHeight,
			rowSpacing,
			numRows,
			stationsPerRow,
			stationPositions,
			availableWidth,
			totalHeight: Math.max(totalHeight, 500),
		};
	}, [stations.length, width, maxStationsPerRow]);

	// 列車位置を計算（fromStation と toStation から）
	const getTrainPosition = (train: OdptTrain): { x: number; y: number; row: number } | null => {
		const fromStation = train['odpt:fromStation'];
		const toStation = train['odpt:toStation'];

		const fromIdx = stationIdMap.get(fromStation);
		if (fromIdx === undefined) return null;

		const fromPos = layout.stationPositions[fromIdx];
		if (!fromPos) return null;

		// toStationがない場合は駅に停車中
		if (!toStation) {
			return { x: fromPos.x, y: fromPos.y, row: fromPos.row };
		}

		const toIdx = stationIdMap.get(toStation);
		if (toIdx === undefined) {
			return { x: fromPos.x, y: fromPos.y, row: fromPos.row };
		}

		const toPos = layout.stationPositions[toIdx];
		if (!toPos) {
			return { x: fromPos.x, y: fromPos.y, row: fromPos.row };
		}

		// 同じ行にいる場合は中間地点
		if (fromPos.row === toPos.row) {
			return {
				x: (fromPos.x + toPos.x) / 2,
				y: fromPos.y,
				row: fromPos.row
			};
		}

		// 異なる行の場合はfromの位置
		return { x: fromPos.x, y: fromPos.y, row: fromPos.row };
	};

	// 重なり防止のためのオフセット計算
	const calculateTrainOffsets = (trainList: OdptTrain[]) => {
		const positions: { train: OdptTrain; x: number; y: number; row: number; offset: number }[] = [];
		const groups = new Map<string, number>();

		trainList.forEach(train => {
			const pos = getTrainPosition(train);
			if (!pos) return;

			// グループキー（近い位置をまとめる）
			const groupKey = `${pos.row}-${Math.round(pos.x / 50)}`;
			const offset = groups.get(groupKey) || 0;
			groups.set(groupKey, offset + 1);

			positions.push({ train, ...pos, offset });
		});

		return positions;
	};

	const inboundPositions = useMemo(() => calculateTrainOffsets(inboundTrains), [inboundTrains, layout, stationIdMap]);
	const outboundPositions = useMemo(() => calculateTrainOffsets(outboundTrains), [outboundTrains, layout, stationIdMap]);

	return (
		<div className="railway-line-container bg-slate-950 rounded-xl overflow-hidden shadow-2xl">
			{/* Header */}
			<div
				className="px-6 py-4 border-b border-slate-800 flex items-center justify-between"
				style={{ backgroundColor: lineColor + '20' }}
			>
				<div className="flex items-center gap-4">
					<div
						className="w-6 h-6 rounded-full border-4"
						style={{ backgroundColor: lineColor, borderColor: lineColor }}
					/>
					<h2 className="text-2xl font-bold text-white">
						{railwayTitle}
					</h2>
				</div>

				<div className="flex items-center gap-4 text-sm text-slate-400">
					<span>更新: {updatedAt}</span>
					{!isRealtime && (
						<span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
							※時刻表ベースの推定位置
						</span>
					)}
					<span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
						↑ {inboundTrains.length} 本 / ↓ {outboundTrains.length} 本
					</span>
				</div>
			</div>

			{/* SVG Railway Line */}
			<svg
				width="100%"
				height={layout.totalHeight}
				viewBox={`0 0 ${width} ${layout.totalHeight}`}
				preserveAspectRatio="xMidYMid meet"
				className="block"
			>
				{/* Background */}
				<rect width="100%" height="100%" fill="#0f172a" />

				{/* For each row */}
				{Array.from({ length: layout.numRows }).map((_, rowIdx) => {
					const rowStations = layout.stationPositions.filter(s => s.row === rowIdx);
					if (rowStations.length === 0) return null;

					const firstStation = rowStations[0];
					const lastStation = rowStations[rowStations.length - 1];
					const lineY = firstStation.y;

					return (
						<g key={`row-${rowIdx}`}>
							{/* Track line */}
							<line
								x1={firstStation.x}
								y1={lineY}
								x2={lastStation.x}
								y2={lineY}
								stroke={lineColor}
								strokeWidth={layout.lineHeight}
								strokeLinecap="round"
							/>

							{/* Station circles and labels */}
							{rowStations.map((pos) => {
								const station = stations[pos.index];
								if (!station) return null;

								const stationName = station['odpt:stationTitle']?.ja || station['dc:title'] || '';
								const isEndStation = pos.index === 0 || pos.index === stations.length - 1;

								return (
									<g key={station['owl:sameAs']} transform={`translate(${pos.x}, ${pos.y})`}>
										<circle
											r={isEndStation ? 10 : 6}
											fill="#ffffff"
											stroke={lineColor}
											strokeWidth={isEndStation ? 4 : 2}
										/>
										<text
											x={0}
											y={25}
											textAnchor="start"
											transform="rotate(45, 0, 25)"
											className={`fill-slate-300 ${isEndStation ? 'text-[11px] font-bold' : 'text-[9px]'}`}
										>
											{stationName}
										</text>
									</g>
								);
							})}

							{/* Inbound trains (above the line) - 左向き */}
							{inboundPositions
								.filter(p => p.row === rowIdx)
								.map((p) => {
									const { train, x, offset } = p;
									const typeInfo = getTrainTypeInfo(train['odpt:trainType']);
									const dest = getDestinationName((train as any)['odpt:destinationStation'], stations);
									const delay = train['odpt:delay'] || 0;
									const xOffset = offset * 75;

									return (
										<g key={train['@id']} transform={`translate(${x + xOffset}, ${lineY - 45})`}>
											<foreignObject x={-50} y={-20} width={100} height={50} className="overflow-visible">
												<ArrowBox
													color={typeInfo.color}
													typeName={typeInfo.name}
													destination={dest + '行'}
													delay={delay}
													direction="left"
												/>
											</foreignObject>
										</g>
									);
								})}

							{/* Outbound trains (below the line) - 右向き */}
							{outboundPositions
								.filter(p => p.row === rowIdx)
								.map((p) => {
									const { train, x, offset } = p;
									const typeInfo = getTrainTypeInfo(train['odpt:trainType']);
									const dest = getDestinationName((train as any)['odpt:destinationStation'], stations);
									const delay = train['odpt:delay'] || 0;
									const xOffset = offset * 75;

									return (
										<g key={train['@id']} transform={`translate(${x + xOffset}, ${lineY + 55})`}>
											<foreignObject x={-50} y={-20} width={100} height={50} className="overflow-visible">
												<ArrowBox
													color={typeInfo.color}
													typeName={typeInfo.name}
													destination={dest + '行'}
													delay={delay}
													direction="right"
												/>
											</foreignObject>
										</g>
									);
								})}
						</g>
					);
				})}
			</svg>

			{/* Legend */}
			<div className="px-6 py-3 border-t border-slate-800 flex items-center gap-6 text-xs text-slate-400 flex-wrap">
				<span className="font-medium text-slate-300">種別:</span>
				{Object.entries(TRAIN_TYPES).filter(([k]) => k !== 'default').map(([key, val]) => (
					<div key={key} className="flex items-center gap-1">
						<div className="w-4 h-3 rounded" style={{ backgroundColor: val.color }} />
						<span>{val.name}</span>
					</div>
				))}
			</div>
		</div>
	);
}
