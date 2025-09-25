import { ParentProps } from "solid-js";
import { Toaster } from "solid-toast";

export function ToastProvider(props: ParentProps) {
  return (
    <>
      {props.children}
      <Toaster position="top-center" />
    </>
  );
}
