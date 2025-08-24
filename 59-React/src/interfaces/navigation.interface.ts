import { ReactNode } from 'react';

export interface NavLinkItem {
  href?: string;
  label: string | ReactNode;
  icon?: ReactNode;
  hasBadge?: boolean;
  isLogout?: boolean;
  isUserLink?: boolean;
  isUserLinkOpen?: boolean;
}

export interface LinkItemProps {
  link: NavLinkItem;
  onClick: (e: React.MouseEvent | null, href: string, isLogout?: boolean) => void;
  onUsernameClick?: (e: React.MouseEvent) => void;
  children?: ReactNode;
}