import Button, { ButtonProps } from "../ui/Button";
import Span from "../ui/Span";
import { FeedIcon, LibraryIcon, SearchIcon } from "../ui/Icons";

export const FeedButton = (props: Omit<ButtonProps, "icon">) => (
  <Button {...props} icon={<FeedIcon class="w-5 h-5" />}>
    <Span hideOnSmall>Recettes & Articles</Span>
  </Button>
);

export const LibraryButton = (props: Omit<ButtonProps, "icon">) => (
  <Button {...props} icon={<LibraryIcon class="w-5 h-5" />}>
    <Span hideOnSmall>Librairie & Critiques</Span>
  </Button>
);

export const SearchButton = (props: Omit<ButtonProps, "icon"> & { open?: boolean }) => (
  <Button {...props} icon={<SearchIcon class="w-5 h-5" />} active={props.open}>
    <Span hideOnSmall>Recherche</Span>
  </Button>
);

const NavButtons = {
  FeedButton,
  LibraryButton,
  SearchButton,
};

export default NavButtons;
