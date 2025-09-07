import Button, { ButtonProps } from "../ui/Button";

// Boutons préconfigurés
export const FeedButton = (props: Omit<ButtonProps, "label" | "emoji">) => (
  <Button {...props} label="Recettes & Articles" emoji="📰" />
);

export const LibraryButton = (props: Omit<ButtonProps, "label" | "emoji">) => (
  <Button {...props} label="Librairie & critiques" emoji="📚" />
);

export const SearchButton = (
  props: Omit<ButtonProps, "label" | "emoji"> & { open?: boolean }
) => <Button {...props} label="Recherche" emoji="🔍" active={props.open} />;

const NavIcons = {
  FeedButton,
  LibraryButton,
  SearchButton,
};

export default NavIcons;
