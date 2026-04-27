import type { ComponentType } from "react";
import Lifepath7 from "./lifepath-7";

// slug → Reactコンポーネントのマップ
// MDX記事を書いたら、ここに追加するだけ
export const GUIDE_COMPONENTS: Record<string, ComponentType> = {
  "lifepath-7": Lifepath7,
};
