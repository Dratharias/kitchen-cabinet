import FuzzyText from "@/components/ui/FuzzyText";

const metadata = {
  title: "404",
};

export default function NotFoundPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#1F1F1F] text-center text-gray-200 px-6">
      <div className="flex flex-col items-center justify-center space-y-10">
        {/* Texte principal avec effet fuzzy */}
        <div className="flex-col justify-center">
          <FuzzyText baseIntensity={0.1} hoverIntensity={0.25} enableHover>
            {metadata.title}
          </FuzzyText>
        </div>

        {/* Lien de retour */}
        <p className="text-lg text-gray-400">
          Vérifie l’adresse ou retourne à{" "}
          <a
            href="/"
            className="text-amber-500 hover:text-amber-400 underline transition-colors"
          >
            l’accueil
          </a>
          .
        </p>
      </div>
    </main>
  );
}
