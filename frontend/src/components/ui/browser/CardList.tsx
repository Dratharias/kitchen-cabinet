import { Component, For, Show } from "solid-js";
import Card, { CardProps } from "./Card";
import { Span } from "../html/Span";
import { PrevPageButton, NextPageButton } from "../utilities/PaginationButtons";
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
  const handlePrev = () => {
    if (props.pagination && props.pagination.page > 1) {
      props.pagination.onPageChange(props.pagination.page - 1);
    }
  };

  const handleNext = () => {
    if (props.pagination && props.pagination.page < props.pagination.totalPages) {
      props.pagination.onPageChange(props.pagination.page + 1);
    }
  };

  return (
    <div class={`flex flex-col w-full ${props.class ?? ""} min-h-full`}>
      {/* Grid responsive et flexible */}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 grid-rows-12 sm:grid-rows-6 xl:grid-rows-4 gap-4 xl:gap-6 flex-1">
        <For each={props.cards}>{(card) => <Card {...card} />}</For>
      </div>

      {/* Pagination */}
      <Show when={props.pagination && props.pagination.totalPages > 1}>
        <div class="flex justify-evenly items-center mt-6 gap-4">
          <PaginationNavigator pagination={props.pagination} />
        </div>
      </Show>
    </div>
  );
};

export default CardList;
