export interface RouteMeta {
  title: string;
  requiresAdmin?: boolean;
}

export interface GuardResult {
  allowed: boolean;
  redirectTo?: string;
  reason?: string;
}
