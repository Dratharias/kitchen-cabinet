import { Component, JSX } from "solid-js";

interface ImageProps extends JSX.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  class?: string;
}

const Image: Component<ImageProps> = (props) => {
  return <img {...props} class={props.class ?? "rounded"} />;
};

export default Image;
