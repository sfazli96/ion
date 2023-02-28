import { IconType } from './icon';

export interface Item {
  title: string;
  icon: IconType;
  selected?: boolean;
  disabled?: boolean;
  action?: () => void;
}

export interface IonSidebarProps {
  logo: string;
  items: (Item & { options?: [Item, ...Item[]] })[];
}