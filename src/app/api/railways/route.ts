import { NextResponse } from 'next/server';

// List of all supported railways for image generation
export const SUPPORTED_RAILWAYS = [
	// JR East (Challenge API)
	{ id: 'odpt.Railway:JR-East.ChuoRapid', name: 'JR中央線快速', operator: 'JR-East', color: '#ff6600' },
	{ id: 'odpt.Railway:JR-East.Yamanote', name: 'JR山手線', operator: 'JR-East', color: '#9acd32' },
	{ id: 'odpt.Railway:JR-East.KeihinTohoku', name: 'JR京浜東北線', operator: 'JR-East', color: '#00bfff' },
	{ id: 'odpt.Railway:JR-East.SaikyoKawagoe', name: 'JR埼京・川越線', operator: 'JR-East', color: '#00ac9a' },
	{ id: 'odpt.Railway:JR-East.Tokaido', name: 'JR東海道線', operator: 'JR-East', color: '#ff7f00' },
	{ id: 'odpt.Railway:JR-East.Musashino', name: 'JR武蔵野線', operator: 'JR-East', color: '#ff6600' },
	{ id: 'odpt.Railway:JR-East.Keiyo', name: 'JR京葉線', operator: 'JR-East', color: '#c9252f' },
	{ id: 'odpt.Railway:JR-East.JobanRapid', name: 'JR常磐線快速', operator: 'JR-East', color: '#00b2e5' },

	// Toei (Standard API)
	{ id: 'odpt.Railway:Toei.Asakusa', name: '都営浅草線', operator: 'Toei', color: '#e85298' },
	{ id: 'odpt.Railway:Toei.Mita', name: '都営三田線', operator: 'Toei', color: '#0079c2' },
	{ id: 'odpt.Railway:Toei.Shinjuku', name: '都営新宿線', operator: 'Toei', color: '#6cbb5a' },
	{ id: 'odpt.Railway:Toei.Oedo', name: '都営大江戸線', operator: 'Toei', color: '#b6007a' },

	// Tokyo Metro (Standard API)
	{ id: 'odpt.Railway:TokyoMetro.Ginza', name: '東京メトロ銀座線', operator: 'TokyoMetro', color: '#ff9500' },
	{ id: 'odpt.Railway:TokyoMetro.Marunouchi', name: '東京メトロ丸ノ内線', operator: 'TokyoMetro', color: '#f62e36' },
	{ id: 'odpt.Railway:TokyoMetro.Hibiya', name: '東京メトロ日比谷線', operator: 'TokyoMetro', color: '#b5b5ac' },
	{ id: 'odpt.Railway:TokyoMetro.Tozai', name: '東京メトロ東西線', operator: 'TokyoMetro', color: '#009bbf' },
	{ id: 'odpt.Railway:TokyoMetro.Chiyoda', name: '東京メトロ千代田線', operator: 'TokyoMetro', color: '#00a650' },
	{ id: 'odpt.Railway:TokyoMetro.Yurakucho', name: '東京メトロ有楽町線', operator: 'TokyoMetro', color: '#c1a470' },
	{ id: 'odpt.Railway:TokyoMetro.Hanzomon', name: '東京メトロ半蔵門線', operator: 'TokyoMetro', color: '#8f76d6' },
	{ id: 'odpt.Railway:TokyoMetro.Namboku', name: '東京メトロ南北線', operator: 'TokyoMetro', color: '#00ac9b' },
	{ id: 'odpt.Railway:TokyoMetro.Fukutoshin', name: '東京メトロ副都心線', operator: 'TokyoMetro', color: '#9c5e31' },

	// Tobu (Standard API)
	{ id: 'odpt.Railway:Tobu.TobuSkytree', name: '東武スカイツリーライン', operator: 'Tobu', color: '#0079c2' },
	{ id: 'odpt.Railway:Tobu.Isesaki', name: '東武伊勢崎線', operator: 'Tobu', color: '#0079c2' },
	{ id: 'odpt.Railway:Tobu.Nikko', name: '東武日光線', operator: 'Tobu', color: '#ed7d22' },
	{ id: 'odpt.Railway:Tobu.Tojo', name: '東武東上線', operator: 'Tobu', color: '#0079c2' },

	// Seibu (Standard API)
	{ id: 'odpt.Railway:Seibu.Ikebukuro', name: '西武池袋線', operator: 'Seibu', color: '#0070af' },
	{ id: 'odpt.Railway:Seibu.Shinjuku', name: '西武新宿線', operator: 'Seibu', color: '#0070af' },

	// Keio (Standard API)
	{ id: 'odpt.Railway:Keio.Keio', name: '京王線', operator: 'Keio', color: '#de1d65' },
	{ id: 'odpt.Railway:Keio.Inokashira', name: '京王井の頭線', operator: 'Keio', color: '#00a495' },

	// Odakyu (Standard API)
	{ id: 'odpt.Railway:Odakyu.Odawara', name: '小田急小田原線', operator: 'Odakyu', color: '#0074bf' },

	// Tokyu (Standard API)
	{ id: 'odpt.Railway:Tokyu.Toyoko', name: '東急東横線', operator: 'Tokyu', color: '#dd0000' },
	{ id: 'odpt.Railway:Tokyu.DenEnToshi', name: '東急田園都市線', operator: 'Tokyu', color: '#00a040' },
	{ id: 'odpt.Railway:Tokyu.Meguro', name: '東急目黒線', operator: 'Tokyu', color: '#009bbf' },

	// Keikyu (Challenge API)
	{ id: 'odpt.Railway:Keikyu.Main', name: '京急本線', operator: 'Keikyu', color: '#e60012' },
	{ id: 'odpt.Railway:Keikyu.Airport', name: '京急空港線', operator: 'Keikyu', color: '#e60012' },
	{ id: 'odpt.Railway:Keikyu.Kurihama', name: '京急久里浜線', operator: 'Keikyu', color: '#e60012' },

	// Keisei (Standard API)
	{ id: 'odpt.Railway:Keisei.Main', name: '京成本線', operator: 'Keisei', color: '#0033cc' },
	{ id: 'odpt.Railway:Keisei.Oshiage', name: '京成押上線', operator: 'Keisei', color: '#0033cc' },
	{ id: 'odpt.Railway:Keisei.NaritaSkyAccess', name: '成田スカイアクセス', operator: 'Keisei', color: '#ff6600' },

	// Yokohama Municipal (Standard API)
	{ id: 'odpt.Railway:YokohamaMunicipal.Blue', name: '横浜市営ブルーライン', operator: 'YokohamaMunicipal', color: '#0079c2' },
	{ id: 'odpt.Railway:YokohamaMunicipal.Green', name: '横浜市営グリーンライン', operator: 'YokohamaMunicipal', color: '#6cbb5a' },
];

export async function GET() {
	return NextResponse.json(SUPPORTED_RAILWAYS);
}
