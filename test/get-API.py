import os
import json
from pathlib import Path
from typing import Any, Dict, List

import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("ODPT_BASE_URL", "https://api-challenge.odpt.org/api/v4/").rstrip("/")
CONSUMER_KEY = os.getenv("ODPT_CONSUMER_KEY")
OPERATOR = os.getenv("ODPT_OPERATOR", "odpt.Operator:JR-East")

DATA_DIR = Path("odpt_data_jreast")
DATA_DIR.mkdir(exist_ok=True)


class OdptClient:
    def __init__(self, base_url: str, consumer_key: str | None):
        self.base_url = base_url.rstrip("/")
        self.consumer_key = consumer_key

    def get(self, endpoint: str, **params) -> list[dict[str, Any]]:
        url = f"{self.base_url}/{endpoint}"
        print(url)
        if "acl:consumerKey" not in params:
            if self.consumer_key is None:
                raise RuntimeError(
                    "ODPT_CONSUMER_KEY が設定されていません (.env を確認して)。"
                )
            params["acl:consumerKey"] = self.consumer_key

        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        return resp.json()


def save_json(name: str, data: Any) -> None:
    path = DATA_DIR / f"{name}.json"
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"saved: {path}")


# ========== JR東日本用フェッチ関数 ==========

def fetch_stations(client: OdptClient) -> list[dict[str, Any]]:
    """
    JR東日本の駅情報: odpt:Station?odpt:operator=odpt.Operator:JR-East
    """
    return client.get("odpt:Station", **{"odpt:operator": OPERATOR})


def fetch_railways(client: OdptClient) -> list[dict[str, Any]]:
    """
    JR東日本の路線系統情報: odpt:Railway?odpt:operator=odpt.Operator:JR-East
    """
    return client.get("odpt:Railway", **{"odpt:operator": OPERATOR})


def fetch_trains(client: OdptClient) -> list[dict[str, Any]]:
    """
    JR東日本の列車ロケーション情報: odpt:Train?odpt:operator=odpt.Operator:JR-East
    """
    return client.get("odpt:Train", **{"odpt:operator": OPERATOR})


# ========== プレビュー生成 ==========

def build_station_order_map(
    railways: list[dict[str, Any]]
) -> Dict[str, List[dict[str, Any]]]:
    """
    路線ID -> [ { 'station': odpt.Station:..., 'title_ja': '駅名', ... } ] の形
    (JR東日本の「路線系統情報」は odpt:stationOrder を持っている想定)
    """
    m: Dict[str, List[dict[str, Any]]] = {}

    for rw in railways:
        railway_id = rw.get("owl:sameAs")
        if not railway_id:
            continue

        station_orders = []
        for o in rw.get("odpt:stationOrder", []):
            title_obj = o.get("odpt:stationTitle") or {}
            station_orders.append(
                {
                    "station": o.get("odpt:station"),
                    "title_ja": title_obj.get("ja") or title_obj.get("en") or o.get("odpt:station"),
                    "index": o.get("odpt:index", 0),
                }
            )

        station_orders.sort(key=lambda x: x["index"])
        m[railway_id] = station_orders

    return m


def generate_line_preview(
    railway_id: str,
    railways: list[dict[str, Any]],
    trains: list[dict[str, Any]],
    lang: str = "ja",
) -> str:
    """
    1路線分のプレビュー文字列を作る（JR東日本版）
    例:
      JR山手線
      🚃東京 - ・有楽町 - 🚃x2新橋 - ・浜松町 ...
    """
    railway = next((r for r in railways if r.get("owl:sameAs") == railway_id), None)
    if railway is None:
        return f"[{railway_id}] の路線情報がありません"

    # 路線名
    title_obj = railway.get("odpt:railwayTitle") or {}
    line_name = (
        title_obj.get(lang)
        or railway.get("dc:title")
        or railway_id
    )

    station_order_map = build_station_order_map(railways)
    ordered_stations = station_order_map.get(railway_id, [])

    # 駅ごとの列車本数
    trains_on_line = [t for t in trains if t.get("odpt:railway") == railway_id]
    trains_by_station: Dict[str, int] = {}
    for t in trains_on_line:
        st_id = t.get("odpt:fromStation") or t.get("odpt:toStation")
        if not st_id:
            continue
        trains_by_station[st_id] = trains_by_station.get(st_id, 0) + 1

    parts: list[str] = []
    for st in ordered_stations:
        st_id = st["station"]
        name = st["title_ja"]
        count = trains_by_station.get(st_id, 0)

        if count == 0:
            marker = "・"
        elif count == 1:
            marker = "🚃"
        else:
            marker = f"🚃x{count}"

        parts.append(f"{marker}{name}")

    body = " - ".join(parts)
    return f"{line_name}\n{body}"


# ========== メイン ==========

def main() -> None:
    client = OdptClient(BASE_URL, CONSUMER_KEY)

    # JR東日本の駅・路線系統・列車ロケーションを一括取得
    stations = fetch_stations(client)
    railways = fetch_railways(client)
    trains = fetch_trains(client)

    save_json("jreast_stations", stations)
    save_json("jreast_railways", railways)
    save_json("jreast_trains", trains)

    # 例: 山手線 (odpt.Railway:JR-East.Yamanote) のプレビューを作る
    railway_id_yamanote = "odpt.Railway:JR-East.Yamanote"
    preview = generate_line_preview(railway_id_yamanote, railways, trains)
    print("\n=== JR東日本・山手線 PREVIEW ===")
    print(preview)


if __name__ == "__main__":
    main()
