"use client";

import React, { useMemo } from 'react';
import type { OdptTrain, OdptStation } from '@/types/odpt';
import { TrainFront, AlertCircle, Clock } from 'lucide-react';

interface TrainGraphProps {
	railwayTitle: string;
	stations: OdptStation[];
	trains: OdptTrain[];
	updatedAt: string;
}

// Helper to extract clean station name
const getStationName = (station: OdptStation) => {
	return station['odpt:stationTitle']?.ja || "Unknown";
};

// Helper to get station ID suffix for matching
const getStationId = (urn: string) => {
	return urn; // e.g. "odpt.Station:JR-East.Chuo.Tokyo"
};

export default function TrainGraph({ railwayTitle, stations, trains, updatedAt }: TrainGraphProps) {
	// Sort stations? Assuming they come in somewhat order or we sort by code.
	// For now, let's just use the array index as the "distance".
	// A better way is needed for production, but this works for MVP if the user provides the railway ID properly.

	// Create a map of Station ID -> Index
	const stationMap = useMemo(() => {
		const map = new Map<string, number>();
		stations.forEach((s, i) => map.set(s['owl:sameAs'], i));
		return map;
	}, [stations]);

	// Group trains by position
	const trainPositions = useMemo(() => {
		const slots: Record<number, OdptTrain[]> = {}; // Key is station index * 2 (even=station, odd=between)

		trains.forEach(t => {
			const fromId = t['odpt:fromStation'];
			const toId = t['odpt:toStation'];

			const fromIndex = stationMap.get(fromId);

			if (fromIndex === undefined) return; // Unknown station

			let position = fromIndex * 2; // At station

			if (toId) {
				// Moving between stations
				const toIndex = stationMap.get(toId);
				// If moving towards next station (index + 1) -> position + 1
				// If moving backwards (index - 1) -> position - 1? 
				// We should assume the graph is linear. 
				// If toIndex > fromIndex, it's outbound? 
				if (toIndex !== undefined) {
					if (toIndex > fromIndex) position += 1;
					else position -= 1;
				}
			}

			if (!slots[position]) slots[position] = [];
			slots[position].push(t);
		});

		return slots;
	}, [trains, stationMap]);

	return (
		<div className="w-full bg-slate-900 text-white p-6 rounded-xl shadow-2xl overflow-x-auto min-h-[400px]">
			{/* Header */}
			<div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
				<h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
					{railwayTitle}
				</h2>
				<div className="flex items-center space-x-2 text-slate-400 text-sm">
					<Clock size={16} />
					<span>Updated: {updatedAt}</span>
				</div>
			</div>

			{/* Legend / Status Bar */}
			<div className="flex space-x-6 mb-8 text-sm bg-slate-800/50 p-3 rounded-lg w-fit">
				<div className="flex items-center space-x-2">
					<div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
					<span>On Time</span>
				</div>
				<div className="flex items-center space-x-2">
					<div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
					<span>Delayed</span>
				</div>
			</div>

			{/* Graph Visualization */}
			<div className="relative pt-12 pb-12 min-w-[1000px]">
				{/* The "Track" Line */}
				<div className="absolute top-1/2 left-0 w-full h-1 bg-slate-700 rounded-full"></div>

				{/* Stations */}
				<div className="flex justify-between w-full relative z-10">
					{stations.map((station, index) => {
						// Check for trains at this station (index * 2)
						const trainsAtStation = trainPositions[index * 2] || [];
						// Check for trains between this and next (index * 2 + 1)
						// But we render "between" relative to this station usually.
						// Let's render trains inside the station node mapping for simplicity or absolute positioning.

						return (
							<div key={station['owl:sameAs']} className="relative flex flex-col items-center group">
								{/* Station Node */}
								<div className="w-4 h-4 bg-slate-200 rounded-full border-4 border-slate-900 z-20 group-hover:scale-125 transition-transform duration-300"></div>

								{/* Station Name */}
								<div className="absolute top-8 text-xs text-slate-400 whitespace-nowrap font-medium writing-mode-vertical rotate-45 origin-top-left group-hover:text-white transition-colors">
									{getStationName(station)}
								</div>

								{/* Trains at Station */}
								<div className="absolute bottom-6 flex flex-col space-y-1 items-center mb-2">
									{trainsAtStation.map((train) => (
										<TrainBadge key={train['@id']} train={train} />
									))}
								</div>

								{/* Trains between this and next */}
								{/* This is tricky in a flex layout. We might need absolute positioning or a spacer.
                                    For now, let's just hack it by rendering a "ghost" element to the right?
                                    Actually, let's use a Grid layout or just absolute % based on index?
                                    Flex `justify-between` works well for stations, but "between" positions are hard.
                                    
                                    Alternative: Use a pure Grid with 2 columns per station?
                                 */}
							</div>
						);
					})}
				</div>

				{/* Overlay for "Between" trains - simplistic approach */}
				{/* We can iterate stations again and put items in the gaps? */}
				<div className="absolute top-0 left-0 w-full h-full pointer-events-none flex justify-between px-[5%]">
					{/* The px padding is a guess to align with justify-between items roughly. 
                         Real implementation should use specific widths. 
                         Let's skip "exact" between visualization in this flex mode and just snap them to 'fromStation' with an arrow?
                         OR: Just render them attached to the 'fromStation' but offset.
                     */}
					{/* Better: Render them IN the station loop but with `translate-x` css */}
				</div>
			</div>

			{/* Re-rendering stations with gaps explicitly handled might be better... */}
			{/* Let's try to inject the "Between" trains into the loop above? */}
		</div>
	);
}

// Icon Mapping
const TRAIN_ICONS: Record<string, string> = {
	'odpt.Railway:JR-East.ChuoRapid': '/icons/JR中央+JR青梅.png',
	'odpt.Railway:JR-East.ChuoSobu': '/icons/JR総武.png',
	'odpt.Railway:JR-East.Yamanote': '/icons/JR山手.png',
	'odpt.Railway:JR-East.KeihinTohoku': '/icons/JR京浜東北.png',
	'odpt.Railway:JR-East.JobanRapid': '/icons/JR常磐快速.png',
	'odpt.Railway:JR-East.Joban': '/icons/JR常磐各停.png', // Assuming local or just mapping generally
	// Add default fallbacks based on includes
};

const getTrainIcon = (railway: string) => {
	if (TRAIN_ICONS[railway]) return TRAIN_ICONS[railway];

	// JR Lines
	if (railway.includes('Chuo')) return '/icons/JR中央+JR青梅.png';
	if (railway.includes('Sobu')) return '/icons/JR総武.png';
	if (railway.includes('Yamanote')) return '/icons/JR山手.png';
	if (railway.includes('Keihin')) return '/icons/JR京浜東北.png';
	if (railway.includes('Joban')) return '/icons/JR常磐快速.png';
	if (railway.includes('Saikyo') || railway.includes('Kawagoe')) return '/icons/JR横浜+JR埼京.png';
	if (railway.includes('Tokaido') || railway.includes('Utsunomiya')) return '/icons/JRその他.png';
	if (railway.includes('Musashino')) return '/icons/JR武蔵野.png';
	if (railway.includes('Keiyo')) return '/icons/JR京葉.png';

	// Metro Lines
	if (railway.includes('Metro.Marunouchi')) return '/icons/メトロ丸ノ内.png';
	if (railway.includes('Metro.Ginza')) return '/icons/メトロ銀座.png';
	if (railway.includes('Metro.Hibiya')) return '/icons/メトロ日比谷.png';
	if (railway.includes('Metro.Tozai')) return '/icons/メトロ東西.png';
	if (railway.includes('Metro.Chiyoda')) return '/icons/メトロ千代田.png';
	if (railway.includes('Metro.Hanzomon')) return '/icons/メトロ半蔵門.png';
	if (railway.includes('Metro.Namboku')) return '/icons/メトロ南北.png';
	if (railway.includes('Metro.Yurakucho') || railway.includes('Metro.Fukutoshin')) return '/icons/メトロ有楽町+メトロ副都心.png';

	// Toei Lines - no specific icons, use null to show lucide icon
	if (railway.includes('Toei')) return null;

	// Other private railways
	if (railway.includes('JR-East')) return '/icons/JRその他.png';
	if (railway.includes('Keikyu')) return '/icons/京急.png';
	if (railway.includes('Keisei')) return '/icons/京成.png';
	if (railway.includes('Keio')) return '/icons/京王.png';
	if (railway.includes('Odakyu')) return '/icons/小田急.png';
	if (railway.includes('Tokyu')) return '/icons/東急東横.png';
	if (railway.includes('Tobu')) return '/icons/東武その他.png';
	if (railway.includes('Seibu')) return '/icons/西武.png';
	if (railway.includes('SaitamaRailway')) return '/icons/埼玉高速鉄道.png';

	return null; // Use lucide-react TrainFront icon as fallback
};

function TrainBadge({ train }: { train: OdptTrain }) {
	const isDelayed = train['odpt:delay'] > 0;
	const iconPath = getTrainIcon(train['odpt:railway']);

	return (
		<div className={`
            relative flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-bold shadow-lg 
            backdrop-blur-md border border-white/10 transition-all hover:scale-110 hover:z-50
            ${isDelayed ? 'bg-yellow-500/80 text-black' : 'bg-emerald-600/90 text-white'}
        `}>
			{/* Train Icon */}
			{iconPath ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img src={iconPath} alt="Train" className="h-6 w-auto object-contain" />
			) : (
				<TrainFront className="h-6 w-6" />
			)}

			<div className="flex flex-col leading-none">
				<span>{train['odpt:trainNumber']}</span>
				<span className="text-[9px] opacity-80">{train['odpt:trainType'].split('.').pop()}</span>
			</div>
			{isDelayed && (
				<span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-1 rounded-full animate-pulse shadow-sm">
					{train['odpt:delay'] / 60}m
				</span>
			)}
		</div>
	);
}
