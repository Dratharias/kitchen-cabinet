import { useNavigate, useParams } from "@solidjs/router";
import { PublicationForm } from "@/components/publication/PublicationForm";
import { RequireAuth } from "@/components/ui/utilities/RequireAuth";

export function PublicationPage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  const handleSuccess = (publication: any) => {
    navigate(`/publications/${publication.publication_id || ""}`);
  };

  const handleCancel = () => {
    // Retour à la liste
    navigate("/");
  };

  return (
    <div class="flex mx-auto p-6 text-prim-txt dark:text-prim-txt-d">
      <RequireAuth>
        <PublicationForm
          publicationId={params.id}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </RequireAuth>
    </div>
  );
}
