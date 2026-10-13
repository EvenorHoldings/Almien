import { Navigate, useParams } from 'react-router-dom';
import Index from './Index';
import NotFound from './NotFound';
import { ALIAS_VIEWS, VIEW_SHORT_PATHS, isViewId } from '@/components/dashboard/viewIds';

/** /view/:id — deep link to any dashboard view. */
export default function ViewRoute() {
  const { id } = useParams();
  if (!isViewId(id)) return <NotFound />;
  if (ALIAS_VIEWS.includes(id)) return <Navigate to="/dashboard" replace />;
  const short = VIEW_SHORT_PATHS[id];
  if (short) return <Navigate to={short} replace />;
  return <Index initialView={id} />;
}
