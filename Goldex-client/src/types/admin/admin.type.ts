export interface AdminPanelProps {
  onBack: () => void;
}

export interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AdminDashboardProps {
  onLogout: () => void;
}
