import { useNavigate, useParams } from "react-router-dom";
import { PublicationForm } from "@/components/publication/PublicationForm";
import { RequireAuth } from "@/components/ui/utilities/RequireAuth";

export function PublicationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const handleSuccess = (publication: any) => {
    navigate(`/publications/${publication.publication_id || ""}`);
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="flex mx-auto p-6 text-prim-txt dark:text-prim-txt-d">
      <RequireAuth>
        <PublicationForm
          publicationId={id}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </RequireAuth>
    </div>
  );
}
