import { createSignal } from "solid-js";
import { Icon } from "@iconify-icon/solid";

type MenuItem = {
  label: string;
  icon?: string;
  action: () => void;
};

export default function UserMenu() {
  const [isEditor, setIsEditor] = createSignal(true); 
  const [loggedIn, setLoggedIn] = createSignal(false);
  const [open, setOpen] = createSignal(false);

  const commonItems: MenuItem[] = [
    { label: loggedIn() ? "Logout" : "Login", icon: "mdi:login", action: () => setLoggedIn(!loggedIn()) },
    { label: "Create", icon: "mdi:plus-circle", action: () => console.log("Create") },
    { label: "Review", icon: "mdi:eye", action: () => console.log("Review") },
  ];

  const editorItems: MenuItem[] = [
    { label: "Modify", icon: "mdi:pencil", action: () => console.log("Modify") },
    { label: "Publish/Unpublish", icon: "mdi:publish", action: () => console.log("Publish") },
    { label: "Restrict/Public", icon: "mdi:lock", action: () => console.log("Restrict") },
    { label: "Delete", icon: "mdi:delete", action: () => console.log("Delete") },
  ];

  const menuItems = isEditor() ? [...commonItems, ...editorItems] : commonItems;

  return (
    <div class="relative">
      {/* Desktop user icon */}
      <button
        class="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
        onClick={() => setOpen(!open())}
        aria-label="User menu"
      >
        <Icon icon="mdi:account-circle" class="w-6 h-6 text-gray-800 dark:text-gray-100" />
      </button>

      {/* Mobile hamburger */}
      <button
        class="md:hidden flex items-center justify-center w-10 h-10 rounded bg-gray-200 dark:bg-gray-700"
        onClick={() => setOpen(!open())}
        aria-label="Menu"
      >
        <Icon icon="mdi:menu" class="w-6 h-6 text-gray-800 dark:text-gray-100" />
      </button>

      {/* Menu */}
      {open() && (
        <ul class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50">
          {menuItems.map(item => (
            <li
              class="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                item.action();
                setOpen(false);
              }}
            >
              {item.icon && <Icon icon={item.icon} class="w-5 h-5" />}
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
