import { Component, createSignal, For } from "solid-js";
import { Span } from "../atoms/Span";

export interface StarsProps {
  score?: number; // 1-10 (half-stars possible)
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number; // px
}

export const Stars: Component<StarsProps> = (props) => {
  const [currentScore, setCurrentScore] = createSignal(props.score ?? 0);

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (!props.readonly) {
      const value = starIndex * 2 + (isHalf ? 1 : 2); // 1-10 scale
      setCurrentScore(value);
      props.onChange?.(value);
    }
  };

  const renderStar = (index: number) => {
    const score = currentScore();
    if (score >= (index + 1) * 2) return "full";
    if (score === (index * 2 + 1)) return "half";
    return "empty";
  };

  return (
    <div class="flex items-center gap-0.5 pb-2 px-1 bg-layout-d/40 rounded-lg">
      <For each={[0, 1, 2, 3, 4]}>
        {(i) => {
          const type = renderStar(i);
          return (
            <div class="relative inline-block cursor-pointer" style={{ width: `${props.size ?? 20}px`, height: `${props.size ?? 20}px` }}>
              {/* Full star background */}
              <Span
                class={`absolute top-0 left-0 text-gray-300`}
                style={{ "font-size": `${props.size ?? 20}px` }}
              >
                ★
              </Span>

              {/* Overlay colored star */}
              {type !== "empty" && (
                <Span
                  class={`absolute top-0 left-0 text-yellow-400 overflow-hidden`}
                  style={{
                    "font-size": `${props.size ?? 20}px`,
                    width: type === "half" ? `${(props.size ?? 20) / 2}px` : "100%",
                  }}
                >
                  ★
                </Span>
              )}

              {!props.readonly && (
                <div class="absolute inset-0 flex">
                  <div class="w-1/2" onClick={() => handleClick(i, true)} />
                  <div class="w-1/2" onClick={() => handleClick(i, false)} />
                </div>
              )}
            </div>
          );
        }}
      </For>
    </div>
  );
};