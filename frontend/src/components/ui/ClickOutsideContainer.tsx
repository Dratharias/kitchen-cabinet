import { JSX, onCleanup } from "solid-js";

type ClickOutsideContainerProps = {
  children: JSX.Element;
  onClickOutside: () => void;
  class?: string;
};

const ClickOutsideContainer = (props: ClickOutsideContainerProps) => {
  let containerRef: HTMLDivElement | undefined;

  const handleClick = (event: MouseEvent) => {
    if (containerRef && !containerRef.contains(event.target as Node)) {
      props.onClickOutside();
    }
  };

  document.addEventListener("click", handleClick);

  onCleanup(() => {
    document.removeEventListener("click", handleClick);
  });

  return (
    <div ref={containerRef} class={props.class}>
      {props.children}
    </div>
  );
};

export default ClickOutsideContainer;
