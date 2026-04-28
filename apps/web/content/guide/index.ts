import type { ComponentType } from "react";
import Lifepath1 from "./lifepath-1";
import Lifepath2 from "./lifepath-2";
import Lifepath3 from "./lifepath-3";
import Lifepath4 from "./lifepath-4";
import Lifepath5 from "./lifepath-5";
import Lifepath6 from "./lifepath-6";
import Lifepath7 from "./lifepath-7";
import Lifepath8 from "./lifepath-8";
import Lifepath9 from "./lifepath-9";
import Lifepath11 from "./lifepath-11";
import Lifepath22 from "./lifepath-22";
import PalmReading from "./palm-reading";
import Heigo2026 from "./heigo-2026";

// slug → Reactコンポーネントのマップ
// 記事を追加したら、ここに追加するだけ
export const GUIDE_COMPONENTS: Record<string, ComponentType> = {
  "palm-reading": PalmReading,
  "heigo-2026": Heigo2026,
  "lifepath-1": Lifepath1,
  "lifepath-2": Lifepath2,
  "lifepath-3": Lifepath3,
  "lifepath-4": Lifepath4,
  "lifepath-5": Lifepath5,
  "lifepath-6": Lifepath6,
  "lifepath-7": Lifepath7,
  "lifepath-8": Lifepath8,
  "lifepath-9": Lifepath9,
  "lifepath-11": Lifepath11,
  "lifepath-22": Lifepath22,
};
