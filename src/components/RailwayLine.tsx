"use client";

import React, { useMemo } from 'react';
import type { OdptTrain, OdptStation } from '@/types/odpt';
import { TrainFront } from 'lucide-react';
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
	maxStationsPerRow?: number;
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

// Get destination station name from ID
const getDestinationName = (destId: string | string[] | undefined): string => {
	if (!destId) return '';
	const id = Array.isArray(destId) ? destId[0] : destId;
	// Extract station name from ID like "odpt.Station:JR-East.ChuoRapid.Tokyo"
	const parts = id.split('.');
	return parts[parts.length - 1] || '';
};

// Get train type info
const getTrainTypeInfo = (trainType: string) => {
	const typeName = trainType.split('.').pop() || 'default';
	return TRAIN_TYPES[typeName] || TRAIN_TYPES.default;
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
	maxStationsPerRow = 20,
}: RailwayLineProps) {
	// Separate trains by direction
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

		// Sort by priority (express first for stacking)
		const sortByPriority = (a: OdptTrain, b: OdptTrain) =>
			getTrainTypePriority(b['odpt:trainType']) - getTrainTypePriority(a['odpt:trainType']);

		return {
			inboundTrains: inbound.sort(sortByPriority),
			outboundTrains: outbound.sort(sortByPriority),
		};
	}, [trains]);

	// Layout calculations
	const layout = useMemo(() => {
		const padding = { left: 60, right: 60, top: 100, bottom: 80 };
		const stationLabelHeight = 50;
		const trainRowHeight = 60;
		const lineHeight = 8;
		const rowSpacing = 180; // Space between rows

		// Calculate rows needed
		const numRows = Math.ceil(stations.length / maxStationsPerRow);
		const stationsPerRow = Math.ceil(stations.length / numRows);

		// Available width for stations
		const availableWidth = width - padding.left - padding.right;
		const stationSpacing = availableWidth / Math.max(stationsPerRow - 1, 1);

		// Create station positions (no folding back, just rows)
		const stationPositions: { x: number; y: number; row: number }[] = [];

		stations.forEach((_, idx) => {
			const row = Math.floor(idx / stationsPerRow);
			const posInRow = idx % stationsPerRow;

			const x = padding.left + posInRow * stationSpacing;
			const baseY = padding.top + row * rowSpacing;

			stationPositions.push({ x, y: baseY, row });
		});

		const totalHeight = padding.top + (numRows - 1) * rowSpacing + stationLabelHeight + trainRowHeight * 2 + padding.bottom;

		return {
			padding,
			stationLabelHeight,
			trainRowHeight,
			lineHeight,
			rowSpacing,
			numRows,
			stationsPerRow,
			stationSpacing,
			stationPositions,
			totalHeight: Math.max(totalHeight, 400),
		};
	}, [stations.length, width, maxStationsPerRow]);

	// Find train position
	const getTrainX = (train: OdptTrain): number | null => {
		const fromStation = train['odpt:fromStation'];
		const toStation = train['odpt:toStation'];

		const fromIdx = stations.findIndex(s => s['owl:sameAs'] === fromStation);
		if (fromIdx === -1) return null;

		const fromPos = layout.stationPositions[fromIdx];
		if (!fromPos) return null;

		if (!toStation) {
			return fromPos.x;
		}

		const toIdx = stations.findIndex(s => s['owl:sameAs'] === toStation);
		if (toIdx === -1) return fromPos.x;

		const toPos = layout.stationPositions[toIdx];
		if (!toPos || fromPos.row !== toPos.row) return fromPos.x;

		// Position between stations
		return (fromPos.x + toPos.x) / 2;
	};

	// Get train row (for which row of the track it's on)
	const getTrainRow = (train: OdptTrain): number => {
		const fromStation = train['odpt:fromStation'];
		const idx = stations.findIndex(s => s['owl:sameAs'] === fromStation);
		if (idx === -1) return 0;
		return layout.stationPositions[idx]?.row || 0;
	};

	// Group overlapping trains
	const groupTrains = (trainList: OdptTrain[]) => {
		const groups: { x: number; row: number; trains: OdptTrain[] }[] = [];

		trainList.forEach(train => {
			const x = getTrainX(train);
			if (x === null) return;

			const row = getTrainRow(train);

			// Find existing group within 30px
			const existingGroup = groups.find(g =>
				g.row === row && Math.abs(g.x - x) < 30
			);

			if (existingGroup) {
				existingGroup.trains.push(train);
			} else {
				groups.push({ x, row, trains: [train] });
			}
		});

		return groups;
	};

	const inboundGroups = useMemo(() => groupTrains(inboundTrains), [inboundTrains, stations, layout]);
	const outboundGroups = useMemo(() => groupTrains(outboundTrains), [outboundTrains, stations, layout]);

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
							{/* Track line background */}
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
							{rowStations.map((pos, idx) => {
								const stationIdx = rowIdx * layout.stationsPerRow + idx;
								const station = stations[stationIdx];
								if (!station) return null;

								const stationName = station['odpt:stationTitle']?.ja || station['dc:title'] || '';
								const isEndStation = stationIdx === 0 || stationIdx === stations.length - 1;

								return (
									<g key={station['owl:sameAs']} transform={`translate(${pos.x}, ${pos.y})`}>
										{/* Station circle */}
										<circle
											r={isEndStation ? 10 : 6}
											fill="#ffffff"
											stroke={lineColor}
											strokeWidth={isEndStation ? 4 : 2}
										/>

										{/* Station name - rotated for space */}
										<text
											x={0}
											y={25}
											textAnchor="start"
											transform={`rotate(45, 0, 25)`}
											className={`
												fill-slate-300 
												${isEndStation ? 'text-[11px] font-bold' : 'text-[9px]'}
											`}
										>
											{stationName}
										</text>
									</g>
								);
							})}

							{/* Inbound trains (above the line) */}
							{inboundGroups
								.filter(g => g.row === rowIdx)
								.map((group, groupIdx) => (
									<g key={`inbound-${groupIdx}`}>
										{group.trains.map((train, trainIdx) => {
											const typeInfo = getTrainTypeInfo(train['odpt:trainType']);
											const dest = getDestinationName((train as any)['odpt:destinationStation']);
											const delay = train['odpt:delay'] || 0;
											const yOffset = lineY - 35 - trainIdx * 50;

											return (
												<g key={train['@id']} transform={`translate(${group.x}, ${yOffset})`}>
													<foreignObject x={-60} y={-20} width={120} height={45} className="overflow-visible">
														<div className="flex flex-col items-center">
															<div
																className="relative px-2 py-1 rounded-md text-white text-center shadow-lg border border-white/20"
																style={{ backgroundColor: typeInfo.color }}
															>
																<div className="text-[10px] font-bold">{typeInfo.name || '普通'}</div>
																<div className="text-[12px] font-bold">{dest || '---'}行</div>
																{delay > 0 && (
																	<span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] px-1 rounded-full animate-pulse">
																		+{Math.round(delay / 60)}
																	</span>
																)}
															</div>
															<span className="text-[8px] text-slate-400">→</span>
														</div>
													</foreignObject>
												</g>
											);
										})}
									</g>
								))}

							{/* Outbound trains (below the line) */}
							{outboundGroups
								.filter(g => g.row === rowIdx)
								.map((group, groupIdx) => (
									<g key={`outbound-${groupIdx}`}>
										{group.trains.map((train, trainIdx) => {
											const typeInfo = getTrainTypeInfo(train['odpt:trainType']);
											const dest = getDestinationName((train as any)['odpt:destinationStation']);
											const delay = train['odpt:delay'] || 0;
											const yOffset = lineY + 70 + trainIdx * 50;

											return (
												<g key={train['@id']} transform={`translate(${group.x}, ${yOffset})`}>
													<foreignObject x={-60} y={-20} width={120} height={45} className="overflow-visible">
														<div className="flex flex-col items-center">
															<span className="text-[8px] text-slate-400">←</span>
															<div
																className="relative px-2 py-1 rounded-md text-white text-center shadow-lg border border-white/20"
																style={{ backgroundColor: typeInfo.color }}
															>
																<div className="text-[10px] font-bold">{typeInfo.name || '普通'}</div>
																<div className="text-[12px] font-bold">{dest || '---'}行</div>
																{delay > 0 && (
																	<span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] px-1 rounded-full animate-pulse">
																		+{Math.round(delay / 60)}
																	</span>
																)}
															</div>
														</div>
													</foreignObject>
												</g>
											);
										})}
									</g>
								))}
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
