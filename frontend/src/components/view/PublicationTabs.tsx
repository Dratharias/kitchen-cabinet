import { Utensils, FileText } from "lucide-react";

export function PublicationTabs({
  currentTab,
  setTab,
}: {
  currentTab: "ingredients" | "steps";
  setTab: (tab: "ingredients" | "steps") => void;
}) {
  const tabs: { key: "ingredients" | "steps"; label: string; icon: React.ReactNode }[] = [
    { key: "ingredients", label: "Ingrédients", icon: <Utensils className="w-5 h-5" /> },
    { key: "steps", label: "Préparation", icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="flex w-full justify-center gap-2 mt-4 mb-2 border-b border-gray-700 bg-[#1F1F1F]/80">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setTab(tab.key)}
          className={`flex-1 px-4 py-2 flex items-center justify-center gap-2 text-base font-medium transition-colors border-b-2 hover:cursor-pointer ${
            currentTab === tab.key
              ? "text-amber-400 border-amber-400"
              : "text-gray-400 hover:text-gray-200 border-transparent hover:border-gray-400"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}