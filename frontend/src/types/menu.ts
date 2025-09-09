import type { Accessor } from "solid-js";

export type MenuItem = {
  label: string | Accessor<string>;
  action: () => void;
};
