import { Component } from 'solid-js';

interface ContentBrowserProps {
  feeds?: boolean;
  library?: boolean;
}

export const ContentBrowser: Component<ContentBrowserProps> = (props) => {
  return (
    <div class="content-browser">
      {props.feeds && (
        <section class="feeds">
          <h2>Feeds</h2>
          {/* Ici tu peux mapper les contenus de feeds */}
          <p>Aucun feed disponible pour le moment.</p>
        </section>
      )}

      {props.library && (
        <section class="library">
          <h2>Library</h2>
          {/* Ici tu peux mapper les contenus de library */}
          <p>Votre bibliothèque est vide.</p>
        </section>
      )}

      {!props.feeds && !props.library && (
        <p>Sélectionnez une section pour afficher le contenu.</p>
      )}
    </div>
  );
};
