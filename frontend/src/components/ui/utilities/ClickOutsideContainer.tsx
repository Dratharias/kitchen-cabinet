import { JSX, onCleanup, onMount } from "solid-js";

type ClickOutsideContainerProps = {
  children: JSX.Element;
  onClickOutside: () => void;
  class?: string;
  style?: JSX.CSSProperties;
};

const ClickOutsideContainer = (props: ClickOutsideContainerProps) => {
  let containerRef: HTMLDivElement | undefined;

  const handleClick = (event: MouseEvent) => {
    if (!containerRef) return;

    if (!containerRef.contains(event.target as Node)) {
      props.onClickOutside();
    }
  };

  onMount(() => {
    document.addEventListener("pointerdown", handleClick);
  });

  onCleanup(() => {
    document.removeEventListener("pointerdown", handleClick);
  });

  return (
    <div ref={containerRef} class={props.class}>
      {props.children}
    </div>
  );
};

export default ClickOutsideContainer;
