export const colorTheme = {
  Button: `flex-1 justify-center px-4 py-2 rounded-md border border-current
           font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2
           bg-transparent text-current hover:text-fresh-400 dark:hover:text-forest-400`,
  ButtonActive: `bg-mintsage-60 dark:bg-forest-375 text-forest-900 dark:text-harmony-100`,
  ButtonOnSurface: `bg-mintsage-50 dark:bg-forest-400 text-forest-700 dark:text-harmony-100
                     border border-forest-300 dark:border-harmony-100
                     hover:bg-mintsage-60 dark:hover:bg-forest-375
                     transition-colors duration-200`,
  Navbar: `bg-mintsage-50 dark:bg-forest-400 text-forest-700 dark:text-harmony-100`,
  NavbarButton: `px-3 py-2 rounded-md text-current
                 hover:bg-forest-200 dark:hover:bg-harmony-700
                 transition-colors duration-200`,
  CardTitle: `text-forest-700 dark:text-harmony-100 font-semibold`,
  CardDescription: `text-forest-500 dark:text-harmony-300 text-sm`,
  CardMeta: `text-forest-400 dark:text-harmony-200 text-xs`,
};

export const surfaceTheme = {
  Card: `bg-mintsage-50 dark:bg-forest-400 text-forest-700 dark:text-harmony-100
         border border-forest-200 dark:border-harmony-700 rounded-lg p-6 shadow-sm`,
  CardCompact: `bg-mintsage-50 dark:bg-forest-400 text-forest-700 dark:text-harmony-100
                border border-forest-200 dark:border-harmony-700 rounded-lg`,
  CardTitle: `text-forest-700 dark:text-harmony-100 font-bold text-2xl`,
  CardSubtitle: `text-forest-500 dark:text-harmony-300 text-sm`,
  CardNotesTitle: `text-forest-700 dark:text-harmony-100 font-semibold`,
  CardNotesText: `text-forest-500 dark:text-harmony-300 text-sm`,
  List: `bg-mintsage-50 dark:bg-forest-400 
         rounded-lg divide-y divide-forest-200 dark:divide-harmony-600`,
  ListItemStatic: `text-forest-500 dark:text-harmony-300`,
  ListItemInteractive: `cursor-pointer hover:bg-forest-200 dark:hover:bg-harmony-700 text-forest-500 dark:text-harmony-300`,
  Input: `w-full flex-1 text-lg sm:text-xl rounded-lg p-2
          border border-forest-300 dark:border-harmony-100
          bg-mintsage-50 dark:bg-forest-400
          text-forest-700 dark:text-harmony-100
          focus:outline-none focus:ring-2
          focus:ring-forest-200 dark:focus:ring-harmony-300
          transition-colors duration-200`,
};
