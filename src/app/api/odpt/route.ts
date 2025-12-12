import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const type = searchParams.get('type');
		const railway = searchParams.get('railway');
		const operator = searchParams.get('operator');
		const limitRaw = searchParams.get('limit');
		const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : NaN;
		const limit = Number.isFinite(limitParsed) ? Math.max(1, Math.min(200, limitParsed)) : 50;

		// Challenge API対応事業者（リアルタイム列車位置データあり）
		// JR東日本、東武鉄道、京急電鉄
		const challengeOperators = ['JR-East', 'Tobu', 'Keikyu'];
		const isChallengeApi = challengeOperators.some(op =>
			operator?.includes(op) || railway?.includes(op)
		);

		const consumerKey = isChallengeApi
			? process.env.ODPT_CHALLENGE_CONSUMER_KEY
			: (process.env.ODPT_CONSUMER_KEY || process.env.ODPT_COINSUMER_KEY);

		const baseUrl = isChallengeApi
			? (process.env.ODPT_CHALLENGE_BASE_URL?.replace(/\/$/, '') || 'https://api-challenge.odpt.org/api/v4')
			: (process.env.ODPT_BASE_URL?.replace(/\/$/, '') || 'https://api.odpt.org/api/v4');

		console.log('[API Route] Config:', { type, railway, operator, isChallengeApi, baseUrl, hasKey: !!consumerKey });

		if (!consumerKey) {
			return NextResponse.json(
				{
					error: 'ODPT consumer key is not configured',
					isChallengeApi,
					requiredEnv: isChallengeApi ? 'ODPT_CHALLENGE_CONSUMER_KEY' : 'ODPT_CONSUMER_KEY',
					hint: isChallengeApi
						? 'JR-East / Tobu / Keikyu は Challenge API のキーが必要です'
						: 'TokyoMetro / Toei / 私鉄などは Standard API のキーが必要です',
				},
				{ status: 500 }
			);
		}

		const params = new URLSearchParams();
		params.append('acl:consumerKey', consumerKey);
		if (railway) params.append('odpt:railway', railway);
		if (operator) params.append('odpt:operator', operator);

		const logFetching = (label: string, url: string) => {
			try {
				const u = new URL(url);
				u.searchParams.set('acl:consumerKey', '[redacted]');
				console.log(`[API Route] Fetching ${label}:`, u.toString());
			} catch {
				console.log(`[API Route] Fetching ${label}`);
			}
		};

		if (type === 'trains') {
			const url = `${baseUrl}/odpt:Train?${params.toString()}`;
			logFetching('odpt:Train', url);
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text();
				console.error('[API Route] Error:', res.status, text);
				return NextResponse.json({ error: text, status: res.status, endpoint: 'odpt:Train' }, { status: res.status });
			}
			const data = await res.json();
			return NextResponse.json(data);
		} else if (type === 'stations') {
			const url = `${baseUrl}/odpt:Station?${params.toString()}`;
			logFetching('odpt:Station', url);
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text();
				return NextResponse.json({ error: text, status: res.status, endpoint: 'odpt:Station' }, { status: res.status });
			}
			const data = await res.json();
			return NextResponse.json(data);
		} else if (type === 'info') {
			// Fetch train operation information
			const url = `${baseUrl}/odpt:TrainInformation?${params.toString()}`;
			logFetching('odpt:TrainInformation', url);
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text();
				console.error('[API Route] Error:', res.status, text);
				return NextResponse.json({ error: text, status: res.status, endpoint: 'odpt:TrainInformation' }, { status: res.status });
			}
			const data = await res.json();
			return NextResponse.json(data);
		} else if (type === 'timetable') {
			// Fetch train timetable for a single local train
			const timetableParams = new URLSearchParams(params);
			// Try to get first available timetable
			const url = `${baseUrl}/odpt:TrainTimetable?${timetableParams.toString()}`;
			logFetching('odpt:TrainTimetable', url);
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text();
				console.error('[API Route] Error:', res.status, text);
				return NextResponse.json({ error: text, status: res.status, endpoint: 'odpt:TrainTimetable' }, { status: res.status });
			}
			const data = await res.json();
			// Return first timetable only
			return NextResponse.json(Array.isArray(data) && data.length > 0 ? data[0] : null);
		} else if (type === 'timetables') {
			// Fetch train timetables for a railway (potentially many; limit results)
			const url = `${baseUrl}/odpt:TrainTimetable?${params.toString()}`;
			logFetching(`odpt:TrainTimetable (limit=${limit})`, url);
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text();
				console.error('[API Route] Error:', res.status, text);
				return NextResponse.json({ error: text, status: res.status, endpoint: 'odpt:TrainTimetable' }, { status: res.status });
			}
			const data = await res.json();
			if (!Array.isArray(data)) return NextResponse.json([]);
			return NextResponse.json(data.slice(0, Number.isFinite(limit) ? limit : 50));
		}

		return NextResponse.json({ error: 'Invalid type. Use type=trains, stations, info, timetable, or timetables' }, { status: 400 });
	} catch (e: unknown) {
		console.error('[API Route] Exception:', e);
		const message = e instanceof Error ? e.message : 'Unknown error';
		const stack = e instanceof Error ? e.stack : undefined;
		return NextResponse.json({ error: message, stack }, { status: 500 });
	}
}
