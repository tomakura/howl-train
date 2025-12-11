"use client";

import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface OperationInfo {
	railway: string;
	railwayTitle?: string;
	status: 'normal' | 'delay' | 'suspend' | 'direct' | 'other';
	text: string;
	cause?: string;
	validFrom?: string;
}

interface OperationAlertProps {
	info: OperationInfo[];
}

const STATUS_CONFIG = {
	normal: {
		bg: 'bg-green-900/50',
		border: 'border-green-500',
		icon: Info,
		iconColor: 'text-green-400',
		label: '平常運転',
	},
	delay: {
		bg: 'bg-yellow-900/50',
		border: 'border-yellow-500',
		icon: AlertCircle,
		iconColor: 'text-yellow-400',
		label: '遅延',
	},
	suspend: {
		bg: 'bg-red-900/50',
		border: 'border-red-500',
		icon: AlertTriangle,
		iconColor: 'text-red-400',
		label: '運転見合わせ',
	},
	direct: {
		bg: 'bg-blue-900/50',
		border: 'border-blue-500',
		icon: Info,
		iconColor: 'text-blue-400',
		label: '直通運転情報',
	},
	other: {
		bg: 'bg-slate-800/50',
		border: 'border-slate-500',
		icon: Info,
		iconColor: 'text-slate-400',
		label: '運行情報',
	},
};

export default function OperationAlert({ info }: OperationAlertProps) {
	if (info.length === 0) return null;

	// Filter out normal operation status
	const alerts = info.filter(i => i.status !== 'normal');

	if (alerts.length === 0) return null;

	return (
		<div className="space-y-2 mb-4">
			{alerts.map((alert, idx) => {
				const config = STATUS_CONFIG[alert.status] || STATUS_CONFIG.other;
				const Icon = config.icon;

				return (
					<div
						key={idx}
						className={`
							flex items-start gap-3 p-3 rounded-lg border
							${config.bg} ${config.border}
						`}
						role="alert"
						aria-live="polite"
					>
						<Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />

						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<span className={`text-xs font-bold px-2 py-0.5 rounded ${config.bg} ${config.iconColor}`}>
									{config.label}
								</span>
								{alert.railwayTitle && (
									<span className="text-sm font-medium text-white">
										{alert.railwayTitle}
									</span>
								)}
							</div>

							<p className="text-sm text-slate-200 mt-1 break-words">
								{alert.text}
							</p>

							{alert.cause && (
								<p className="text-xs text-slate-400 mt-1">
									原因: {alert.cause}
								</p>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
