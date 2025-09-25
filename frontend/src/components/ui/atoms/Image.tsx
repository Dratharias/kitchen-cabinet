import { Component, createSignal, JSX } from "solid-js";

interface ImageProps extends JSX.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  class?: string;
  fallbackSrc?: string; // URL de fallback
}

export const Image: Component<ImageProps> = (props) => {
  const [src, setSrc] = createSignal(props.src);

  return (
    <img
      {...props}
      src={src()}
      class={props.class ?? "rounded"}
      onError={() => {
        if (props.fallbackSrc && src() !== props.fallbackSrc) {
          setSrc(props.fallbackSrc);
        }
      }}
    />
  );
};
