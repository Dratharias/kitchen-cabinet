import { Component, createSignal, For, Setter } from "solid-js";

export interface StarsProps {
  score?: number;             // initial score
  onChange?: (value: number) => void; // optional callback when score changes
  readonly?: boolean;         // if true, cannot change
  size?: number;              // optional star size
}

const Stars: Component<StarsProps> = (props) => {
  const [currentScore, setCurrentScore] = createSignal(props.score ?? 0);

  const handleClick = (value: number) => {
    if (!props.readonly) {
      setCurrentScore(value);
      props.onChange?.(value);
    }
  };

  return (
    <div class="flex items-center justify-center gap-1">
      <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
        {(value) => (
          <span
            class={`cursor-pointer text-yellow-400 ${
              currentScore() >= value ? "text-yellow-400" : "text-gray-300"
            }`}
            style={{ "font-size": `${props.size ?? 24}px` }}
            onClick={() => handleClick(value)}
          >
            ★
          </span>
        )}
      </For>
    </div>
  );
};

export default Stars;
