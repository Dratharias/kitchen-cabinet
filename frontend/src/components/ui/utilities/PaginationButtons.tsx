import Button, { ButtonProps } from "../atoms/Button";
import { ArrowIcon } from "../atoms/Icons";

export const PrevPageButton = (props: Omit<ButtonProps, "icon">) => (
  <Button
    {...props}
    icon={<ArrowIcon class="w-5 h-5 rotate-180" />}
  />
);

export const NextPageButton = (props: Omit<ButtonProps, "icon">) => (
  <Button
    {...props}
    icon={<ArrowIcon class="w-5 h-5" />}
  />
);
