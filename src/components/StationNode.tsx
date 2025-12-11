"use client";

import React from 'react';

interface StationNodeProps {
	name: string;
	code?: string;
	type: 'major' | 'express' | 'local';
	x: number;
	y: number;
	isFirst?: boolean;
	isLast?: boolean;
}

// Station node sizes based on type
const NODE_SIZES = {
	major: 16,
	express: 12,
	local: 8,
};

export default function StationNode({
	name,
	code,
	type,
	x,
	y,
	isFirst,
	isLast
}: StationNodeProps) {
	const size = NODE_SIZES[type];
	const showLabel = type !== 'local' || isFirst || isLast;

	return (
		<g className="station-node" transform={`translate(${x}, ${y})`}>
			{/* Station circle */}
			<circle
				r={size / 2}
				fill={type === 'major' ? '#1a1a2e' : '#ffffff'}
				stroke={type === 'major' ? '#ffffff' : '#333333'}
				strokeWidth={type === 'major' ? 3 : 2}
				className="transition-all duration-200 hover:scale-125"
			/>

			{/* Station code (if exists) */}
			{code && type === 'major' && (
				<text
					y={-size - 4}
					textAnchor="middle"
					className="fill-slate-400 text-[8px] font-mono"
				>
					{code}
				</text>
			)}

			{/* Station name */}
			{showLabel && (
				<text
					y={size + 12}
					textAnchor="middle"
					className={`
						${type === 'major' ? 'text-[11px] font-bold fill-white' : ''}
						${type === 'express' ? 'text-[10px] font-medium fill-slate-300' : ''}
						${type === 'local' ? 'text-[9px] fill-slate-400' : ''}
					`}
				>
					{name}
				</text>
			)}
		</g>
	);
}
