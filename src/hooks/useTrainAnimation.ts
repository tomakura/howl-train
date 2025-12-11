/**
 * 列車位置計算ユーティリティ
 * 
 * ODPTのリアルタイムデータから列車の位置を計算
 * （アニメーションは不要、APIデータをそのまま表示）
 */

import { useMemo } from 'react';
import type { OdptTrain, OdptStation } from '@/types/odpt';

export interface AnimatedTrain {
	train: OdptTrain;
	/** 路線全体に対する位置 (0 = 始点駅, 1 = 終点駅) */
	position: number;
	/** fromStation駅のインデックス */
	fromIndex: number;
	/** toStation駅のインデックス (-1 = 駅に停車中) */
	toIndex: number;
	/** 区間内の進行度 (0 = from駅, 1 = to駅) */
	progress: number;
	/** 方向 (1 = 順方向, -1 = 逆方向) */
	direction: 1 | -1;
}

/**
 * 駅間の距離比率を計算（均等分割）
 */
export function calculateStationDistanceRatios(
	stations: OdptStation[]
): number[] {
	if (stations.length < 2) return [];
	// 均等分割
	const ratio = 1 / (stations.length - 1);
	return stations.slice(0, -1).map(() => ratio);
}

/**
 * 駅のインデックスから累積位置を計算
 */
export function getStationCumulativePosition(
	stationIndex: number,
	distanceRatios: number[]
): number {
	if (stationIndex <= 0) return 0;
	let position = 0;
	for (let i = 0; i < Math.min(stationIndex, distanceRatios.length); i++) {
		position += distanceRatios[i];
	}
	return Math.min(position, 1);
}

/**
 * 列車位置計算フック（アニメーションなし、安定表示）
 */
export function useTrainAnimation(
	trains: OdptTrain[],
	stations: OdptStation[]
): AnimatedTrain[] {
	// 駅IDリストを作成
	const stationIds = useMemo(() =>
		stations.map(s => s['owl:sameAs']),
		[stations]
	);

	// 駅間の距離比率
	const distanceRatios = useMemo(() =>
		calculateStationDistanceRatios(stations),
		[stations]
	);

	// 列車位置を計算（アニメーションなし）
	const animatedTrains = useMemo((): AnimatedTrain[] => {
		if (stations.length === 0) return [];

		return trains.map(train => {
			const fromStation = train['odpt:fromStation'];
			const toStation = train['odpt:toStation'];

			const fromIndex = stationIds.indexOf(fromStation);
			const toIndex = toStation ? stationIds.indexOf(toStation) : -1;

			// 駅が見つからない場合
			if (fromIndex === -1) {
				return {
					train,
					position: 0,
					fromIndex: 0,
					toIndex: -1,
					progress: 0,
					direction: 1 as const
				};
			}

			// 駅に停車中の場合
			if (toIndex === -1 || !toStation) {
				const position = getStationCumulativePosition(fromIndex, distanceRatios);
				return {
					train,
					position,
					fromIndex,
					toIndex: -1,
					progress: 0,
					direction: 1 as 1 | -1
				};
			}

			// 駅間を走行中の場合 → 中間地点に表示
			const direction = toIndex > fromIndex ? 1 : -1;
			const minIdx = Math.min(fromIndex, toIndex);
			const maxIdx = Math.max(fromIndex, toIndex);

			// from駅の位置 + 区間の半分
			const startPos = getStationCumulativePosition(minIdx, distanceRatios);
			let segmentDistance = 0;
			for (let i = minIdx; i < maxIdx && i < distanceRatios.length; i++) {
				segmentDistance += distanceRatios[i];
			}

			// 中間地点に固定（安定表示）
			const position = startPos + segmentDistance * 0.5;

			return {
				train,
				position: Math.min(Math.max(position, 0), 1),
				fromIndex,
				toIndex,
				progress: 0.5,
				direction
			};
		});
	}, [trains, stations, stationIds, distanceRatios]);

	return animatedTrains;
}

/**
 * 重なる列車をグループ化してオフセットを計算
 */
export function groupOverlappingAnimatedTrains(
	trains: AnimatedTrain[],
	threshold: number = 0.03 // 3%以内は重なりとみなす
): { train: AnimatedTrain; offsetIndex: number }[] {
	if (trains.length === 0) return [];

	// 方向別に分離
	const inbound = trains.filter(t => {
		const dir = t.train['odpt:railDirection'] || '';
		return dir.includes('Inbound') || dir.includes('Westbound') || dir.includes('Northbound');
	});
	const outbound = trains.filter(t => !inbound.includes(t));

	const processGroup = (group: AnimatedTrain[]) => {
		// 位置でソート
		const sorted = [...group].sort((a, b) => a.position - b.position);

		const result: { train: AnimatedTrain; offsetIndex: number }[] = [];
		let currentCluster: AnimatedTrain[] = [];
		let clusterStartPos = 0;

		sorted.forEach((train) => {
			if (currentCluster.length === 0) {
				currentCluster = [train];
				clusterStartPos = train.position;
			} else if (train.position - clusterStartPos < threshold) {
				// 同じクラスタ
				currentCluster.push(train);
			} else {
				// 新しいクラスタ開始前に現在のクラスタを保存
				currentCluster.forEach((t, idx) => {
					result.push({ train: t, offsetIndex: idx });
				});
				currentCluster = [train];
				clusterStartPos = train.position;
			}
		});

		// 最後のクラスタを保存
		currentCluster.forEach((t, idx) => {
			result.push({ train: t, offsetIndex: idx });
		});

		return result;
	};

	return [...processGroup(inbound), ...processGroup(outbound)];
}

export default useTrainAnimation;
