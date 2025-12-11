import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const type = searchParams.get('type');
		const railway = searchParams.get('railway');
		const operator = searchParams.get('operator');

		// Get the appropriate consumer key and base URL
		// Standard API for general data, Challenge API for JR-East data
		const isJReast = (operator?.includes('JR-East') || railway?.includes('JR-East'));

		const consumerKey = isJReast
			? process.env.ODPT_CHALLENGE_CONSUMER_KEY
			: (process.env.ODPT_CONSUMER_KEY || process.env.ODPT_COINSUMER_KEY);

		const baseUrl = isJReast
			? (process.env.ODPT_CHALLENGE_BASE_URL?.replace(/\/$/, '') || 'https://api-challenge.odpt.org/api/v4')
			: (process.env.ODPT_BASE_URL?.replace(/\/$/, '') || 'https://api.odpt.org/api/v4');

		console.log('[API Route] Config:', { type, railway, operator, isJReast, baseUrl, hasKey: !!consumerKey });

		if (!consumerKey) {
			return NextResponse.json({ error: 'No consumer key configured' }, { status: 500 });
		}

		const params = new URLSearchParams();
		params.append('acl:consumerKey', consumerKey);
		if (railway) params.append('odpt:railway', railway);
		if (operator) params.append('odpt:operator', operator);

		if (type === 'trains') {
			const url = `${baseUrl}/odpt:Train?${params.toString()}`;
			console.log('[API Route] Fetching:', url);
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text();
				console.error('[API Route] Error:', res.status, text);
				return NextResponse.json({ error: text, status: res.status }, { status: res.status });
			}
			const data = await res.json();
			return NextResponse.json(data);
		} else if (type === 'stations') {
			const url = `${baseUrl}/odpt:Station?${params.toString()}`;
			console.log('[API Route] Fetching:', url);
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text();
				return NextResponse.json({ error: text, status: res.status }, { status: res.status });
			}
			const data = await res.json();
			return NextResponse.json(data);
		} else if (type === 'info') {
			// Fetch train operation information
			const url = `${baseUrl}/odpt:TrainInformation?${params.toString()}`;
			console.log('[API Route] Fetching operation info:', url);
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text();
				console.error('[API Route] Error:', res.status, text);
				return NextResponse.json({ error: text, status: res.status }, { status: res.status });
			}
			const data = await res.json();
			return NextResponse.json(data);
		} else if (type === 'timetable') {
			// Fetch train timetable for a single local train
			const timetableParams = new URLSearchParams(params);
			// Try to get first available timetable
			const url = `${baseUrl}/odpt:TrainTimetable?${timetableParams.toString()}`;
			console.log('[API Route] Fetching timetable:', url);
			const res = await fetch(url);
			if (!res.ok) {
				const text = await res.text();
				console.error('[API Route] Error:', res.status, text);
				return NextResponse.json({ error: text, status: res.status }, { status: res.status });
			}
			const data = await res.json();
			// Return first timetable only
			return NextResponse.json(Array.isArray(data) && data.length > 0 ? data[0] : null);
		}

		return NextResponse.json({ error: 'Invalid type. Use type=trains, stations, info, or timetable' }, { status: 400 });
	} catch (e: any) {
		console.error('[API Route] Exception:', e);
		return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
	}
}
