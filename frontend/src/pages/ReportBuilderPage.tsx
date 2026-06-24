import { Navigate, useSearchParams } from "react-router-dom";

/** Sends users to the unified report picker on /reports */
export const ReportBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  return <Navigate to={query ? `/reports?${query}` : "/reports?report=portfolio"} replace />;
};
