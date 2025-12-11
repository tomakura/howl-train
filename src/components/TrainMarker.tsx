"use client";

import React from 'react';
import { TrainFront } from 'lucide-react';

interface TrainMarkerProps {
	trainNumber: string;
	trainType: string;
	delay: number; // in seconds
	x: number;
	y: number;
	iconPath?: string | null;
	direction: 'left' | 'right';
	stackIndex?: number; // For stacking overlapping trains
}

// Train type colors
const TRAIN_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
	LimitedExpress: { bg: 'bg-red-600', text: 'text-white', border: 'border-red-400' },
	Express: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-300' },
	RapidExpress: { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-400' },
	Rapid: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-400' },
	CommuterRapid: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-300' },
	SemiExpress: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-300' },
	Local: { bg: 'bg-slate-600', text: 'text-white', border: 'border-slate-400' },
	default: { bg: 'bg-slate-500', text: 'text-white', border: 'border-slate-300' },
};

// Get train type display name in Japanese
const TRAIN_TYPE_NAMES: Record<string, string> = {
	LimitedExpress: '特急',
	Express: '急行',
	RapidExpress: '快速急行',
	CommuterRapidExpress: '通勤快急',
	Rapid: '快速',
	CommuterRapid: '通勤快速',
	SemiExpress: '準急',
	Local: '普通',
};

export default function TrainMarker({
	trainNumber,
	trainType,
	delay,
	x,
	y,
	iconPath,
	direction,
	stackIndex = 0,
}: TrainMarkerProps) {
	const typeName = trainType.split('.').pop() || 'default';
	const colors = TRAIN_TYPE_COLORS[typeName] || TRAIN_TYPE_COLORS.default;
	const displayName = TRAIN_TYPE_NAMES[typeName] || typeName;

	const isDelayed = delay > 0;
	const delayMinutes = Math.round(delay / 60);

	// Stack offset (each stacked train moves up)
	const stackOffset = stackIndex * 36;

	return (
		<g
			className="train-marker"
			transform={`translate(${x}, ${y - stackOffset})`}
		>
			<foreignObject
				x={-40}
				y={-16}
				width={80}
				height={40}
				className="overflow-visible"
			>
				<div className="flex flex-col items-center">
					{/* Train badge */}
					<div className={`
						relative flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold
						shadow-lg border backdrop-blur-sm
						${colors.bg} ${colors.text} ${colors.border}
						transition-all duration-200 hover:scale-110 hover:z-50
					`}>
						{/* Direction indicator */}
						{direction === 'right' ? (
							<span className="text-[8px] opacity-60">→</span>
						) : (
							<span className="text-[8px] opacity-60">←</span>
						)}

						{/* Icon or default train icon */}
						{iconPath ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img src={iconPath} alt="" className="h-4 w-auto" />
						) : (
							<TrainFront className="h-4 w-4" />
						)}

						{/* Train number */}
						<span className="font-mono">{trainNumber}</span>

						{/* Delay badge */}
						{isDelayed && (
							<span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] px-1 rounded-full animate-pulse shadow-sm min-w-[16px] text-center">
								+{delayMinutes}
							</span>
						)}
					</div>

					{/* Train type label */}
					<span className={`
						text-[8px] mt-0.5 px-1 rounded
						${colors.bg} ${colors.text} opacity-80
					`}>
						{displayName}
					</span>
				</div>
			</foreignObject>
		</g>
	);
}
