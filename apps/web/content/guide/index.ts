import type { ComponentType } from "react";
import Lifepath1 from "./lifepath-1";
import Lifepath3 from "./lifepath-3";
import Lifepath7 from "./lifepath-7";
import Lifepath8 from "./lifepath-8";
import PalmReading from "./palm-reading";

// slug → Reactコンポーネントのマップ
// 記事を追加したら、ここに追加するだけ
export const GUIDE_COMPONENTS: Record<string, ComponentType> = {
  "palm-reading": PalmReading,
  "lifepath-1": Lifepath1,
  "lifepath-3": Lifepath3,
  "lifepath-7": Lifepath7,
  "lifepath-8": Lifepath8,
};
