// Station node types based on stopping patterns
export type StationType = 'major' | 'express' | 'local';

// Train type priority (higher = displayed on top)
export const TRAIN_TYPE_PRIORITY: Record<string, number> = {
	'LimitedExpress': 100,
	'Express': 90,
	'RapidExpress': 85,
	'CommuterRapidExpress': 80,
	'Rapid': 70,
	'CommuterRapid': 65,
	'SemiExpress': 60,
	'Local': 10,
	'default': 50,
};

// Get priority for a train type string
export function getTrainTypePriority(trainType: string): number {
	const typeName = trainType.split('.').pop() || '';
	return TRAIN_TYPE_PRIORITY[typeName] ?? TRAIN_TYPE_PRIORITY['default'];
}

// Calculate position between stations based on time
export interface StationTiming {
	stationId: string;
	arrivalTime?: string; // HH:mm format
	departureTime?: string;
}

// Parse time string to minutes from midnight
export function parseTimeToMinutes(timeStr: string): number {
	const [hours, minutes] = timeStr.split(':').map(Number);
	return hours * 60 + minutes;
}

// Calculate distance ratios between stations based on timetable
export function calculateStationDistances(timings: StationTiming[]): number[] {
	if (timings.length < 2) return [];

	const distances: number[] = [];
	let totalDuration = 0;

	// Calculate duration between each station
	for (let i = 0; i < timings.length - 1; i++) {
		const depTime = timings[i].departureTime || timings[i].arrivalTime;
		const arrTime = timings[i + 1].arrivalTime || timings[i + 1].departureTime;

		if (depTime && arrTime) {
			const duration = parseTimeToMinutes(arrTime) - parseTimeToMinutes(depTime);
			distances.push(Math.max(duration, 1)); // Minimum 1 minute
			totalDuration += Math.max(duration, 1);
		} else {
			distances.push(2); // Default 2 minutes if unknown
			totalDuration += 2;
		}
	}

	// Normalize to ratios (0-1)
	return distances.map(d => d / totalDuration);
}

// Group trains by position
export interface TrainPosition {
	trainId: string;
	trainNumber: string;
	trainType: string;
	railway: string;
	fromStation: string;
	toStation?: string;
	delay: number;
	priority: number;
	// Position as ratio along the line (0 = first station, 1 = last station)
	position: number;
}

// Calculate train position along the line
export function calculateTrainPosition(
	fromStation: string,
	toStation: string | undefined,
	stationIds: string[],
	stationDistances: number[]
): number {
	const fromIndex = stationIds.indexOf(fromStation);
	if (fromIndex === -1) return -1;

	// If no toStation, train is at the station
	if (!toStation) {
		// Sum distances up to this station
		let pos = 0;
		for (let i = 0; i < fromIndex; i++) {
			pos += stationDistances[i] || 0;
		}
		return pos;
	}

	// Train is between stations
	const toIndex = stationIds.indexOf(toStation);
	if (toIndex === -1) {
		// toStation not in list, assume at fromStation
		let pos = 0;
		for (let i = 0; i < fromIndex; i++) {
			pos += stationDistances[i] || 0;
		}
		return pos;
	}

	// Position is midpoint between fromStation and toStation
	let pos = 0;
	const minIdx = Math.min(fromIndex, toIndex);

	for (let i = 0; i < minIdx; i++) {
		pos += stationDistances[i] || 0;
	}

	// Add half the distance to the next station
	if (stationDistances[minIdx]) {
		pos += stationDistances[minIdx] * 0.5;
	}

	return pos;
}

// Group overlapping trains
export function groupOverlappingTrains(
	trains: TrainPosition[],
	threshold: number = 0.02 // 2% of line length
): TrainPosition[][] {
	if (trains.length === 0) return [];

	// Sort by position
	const sorted = [...trains].sort((a, b) => a.position - b.position);

	const groups: TrainPosition[][] = [];
	let currentGroup: TrainPosition[] = [sorted[0]];

	for (let i = 1; i < sorted.length; i++) {
		const train = sorted[i];
		const lastInGroup = currentGroup[currentGroup.length - 1];

		if (Math.abs(train.position - lastInGroup.position) <= threshold) {
			currentGroup.push(train);
		} else {
			// Sort current group by priority (highest first)
			currentGroup.sort((a, b) => b.priority - a.priority);
			groups.push(currentGroup);
			currentGroup = [train];
		}
	}

	// Don't forget the last group
	currentGroup.sort((a, b) => b.priority - a.priority);
	groups.push(currentGroup);

	return groups;
}
