export interface OdptTrain {
	'@id': string;
	'@type': string;
	'dc:date': string;
	'odpt:trainNumber': string;
	'odpt:railway': string;
	'odpt:operator': string;
	'odpt:trainType': string;
	'odpt:fromStation': string;
	'odpt:toStation'?: string;
	'odpt:destinationStation'?: string | string[];
	'odpt:railDirection': string;
	'odpt:delay': number;
	'odpt:carComposition'?: number;
}

export interface OdptStation {
	'@id': string;
	'@type': string;
	'dc:date'?: string;
	'owl:sameAs': string;
	'dc:title': string;
	'odpt:stationCode'?: string;
	'odpt:railway': string;
	'odpt:operator': string;
	'odpt:stationTitle': {
		en?: string;
		ja: string;
	};
	'geo:lat'?: number;
	'geo:long'?: number;
}

// Map for human-readable names
export const RAILWAY_NAMES: Record<string, string> = {
	'odpt.Railway:JR-East.Chuo': 'JR Chuo Line',
	'odpt.Railway:JR-East.ChuoRapid': 'JR Chuo Rapid Line',
	'odpt.Railway:JR-East.ChuoSobu': 'JR Chuo-Sobu Line',
};

// Train timetable entry
export interface OdptTrainTimetableObject {
	'odpt:departureTime'?: string;
	'odpt:arrivalTime'?: string;
	'odpt:departureStation'?: string;
	'odpt:arrivalStation'?: string;
	'odpt:platformNumber'?: string;
}

// Train timetable
export interface OdptTrainTimetable {
	'@id': string;
	'@type': string;
	'dc:date': string;
	'owl:sameAs': string;
	'odpt:railway': string;
	'odpt:operator': string;
	'odpt:trainNumber': string;
	'odpt:trainType': string;
	'odpt:railDirection': string;
	'odpt:trainTimetableObject': OdptTrainTimetableObject[];
}

// Train operation information
export interface OdptTrainInformation {
	'@id': string;
	'@type': string;
	'dc:date': string;
	'owl:sameAs': string;
	'odpt:railway'?: string;
	'odpt:operator': string;
	'odpt:trainInformationStatus'?: { ja?: string; en?: string } | string;
	'odpt:trainInformationText'?: { ja?: string; en?: string } | string;
	'odpt:trainInformationCause'?: { ja?: string; en?: string } | string;
	'odpt:railwayTitle'?: { ja?: string; en?: string };
}
