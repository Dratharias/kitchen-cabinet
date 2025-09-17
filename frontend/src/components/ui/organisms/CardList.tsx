import { Component, For, Show } from "solid-js";
import Card, { CardProps } from "../molecules/Card";
import { PaginationNavigator } from "../utilities/PaginationNavigator";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface CardListProps {
  cards: CardProps[];
  pagination?: PaginationProps;
  class?: string;
}

const CardList: Component<CardListProps> = (props) => {
  return (
    <div
      class="flex flex-col w-full min-h-full"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      {/* Responsive grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6 flex-1">
        <For each={props.cards} fallback={<div>Loading...</div>}>
          {(card) => <Card {...card} />}
        </For>
      </div>

      {/* Pagination */}
      <Show when={props.pagination}>
        <PaginationNavigator pagination={props.pagination} />
      </Show>
    </div>
  );
};

export default CardList;
